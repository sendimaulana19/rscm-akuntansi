const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Read .env.local
const envPath = path.join('C:', 'Users', 'sendi', '.gemini', 'antigravity', 'scratch', 'rscm-akuntansi', '.env.local');
const env = fs.readFileSync(envPath, 'utf-8');
const config = {};
env.split(/\r?\n/).forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v) config[k.trim()] = v.join('=').trim();
});

const supabase = createClient(config.NEXT_PUBLIC_SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// 2. Scan codebase for bucket references
const projectDir = path.join('C:', 'Users', 'sendi', '.gemini', 'antigravity', 'scratch', 'rscm-akuntansi');
function scanDir(dir) {
  let list = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (item === 'node_modules' || item === '.next' || item === '.git') continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      list = list.concat(scanDir(full));
    } else if (/\.(tsx?|jsx?)$/.test(item)) {
      const src = fs.readFileSync(full, 'utf-8');
      const matches = src.match(/storage\.from\(['"]([^'"]+)['"]/g);
      if (matches) {
        matches.forEach(m => {
          const b = m.replace(/storage\.from\(['"]/, '').replace(/['"]/, '');
          list.push(b);
        })
      }
      // Also look for bucket in url patterns
      const urlMatches = src.match(/\/object\/public\/([a-zA-Z0-9_-]+)/g);
      if (urlMatches) {
        urlMatches.forEach(m => {
          const b = m.replace('/object/public/', '');
          list.push(b);
        })
      }
    }
  }
  return list;
}

const detectedBuckets = [...new Set(['rscm-files', 'rscm-images', ...scanDir(projectDir)])];
console.log('Detected buckets to check:', detectedBuckets);

async function checkStorage() {
  const results = {};
  let grandTotalSize = 0;
  let grandTotalFiles = 0;

  for (const bucket of detectedBuckets) {
    let totalSize = 0;
    let fileCount = 0;
    const allFiles = [];

    async function walk(folder = '') {
      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        limit: 200,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

      if (error) {
        return;
      }
      if (!data) return;

      for (const item of data) {
        if (item.name === '.emptyFolderPlaceholder') continue;
        const fullPath = folder ? `${folder}/${item.name}` : item.name;
        // If it's a folder, item.id is null or item.metadata is null
        if (!item.id && !item.metadata) {
          await walk(fullPath);
        } else {
          const size = (item.metadata && item.metadata.size) || 0;
          totalSize += size;
          fileCount++;
          allFiles.push({
            path: fullPath,
            size: size,
            sizeFormatted: formatBytes(size),
            created_at: item.created_at,
            mimetype: item.metadata?.mimetype
          });
        }
      }
    }

    try {
      await walk();
    } catch (e) {
      console.error(`Error walking bucket ${bucket}:`, e.message);
    }

    results[bucket] = {
      files: allFiles,
      count: fileCount,
      totalBytes: totalSize,
      formattedTotal: formatBytes(totalSize)
    };

    grandTotalSize += totalSize;
    grandTotalFiles += fileCount;
  }

  // Also check database tables to see how many records have files uploaded
  console.log('\n====================================');
  console.log('      SUPABASE STORAGE SUMMARY      ');
  console.log('====================================');
  for (const [bucket, data] of Object.entries(results)) {
    console.log(`\nBucket [${bucket}]:`);
    console.log(`  Total Files : ${data.count}`);
    console.log(`  Total Size  : ${data.formattedTotal} (${data.totalBytes.toLocaleString('id-ID')} bytes)`);
    if (data.files.length > 0) {
      console.log('  Top / Sample files:');
      // Sort by size descending
      const sorted = [...data.files].sort((a, b) => b.size - a.size);
      sorted.slice(0, 10).forEach(f => {
        console.log(`    - ${f.path} [${f.sizeFormatted}] (${f.mimetype || 'unknown'})`);
      });
      if (sorted.length > 10) {
        console.log(`    ... and ${sorted.length - 10} more files`);
      }
    }
  }

  console.log('\n------------------------------------');
  console.log(`GRAND TOTAL: ${grandTotalFiles} files | ${formatBytes(grandTotalSize)} (${grandTotalSize.toLocaleString('id-ID')} bytes)`);
  console.log('------------------------------------');

  // Supabase Free Tier info
  console.log('\nℹ️ Info Batasan Kuota Supabase:');
  console.log('- Kuota Storage Gratis (Free Tier) Supabase: 1 GB (1.000 MB / 1.073.741.824 bytes)');
  const pctFree = ((grandTotalSize / (1024 * 1024 * 1024)) * 100).toFixed(2);
  console.log(`- Persentase Penggunaan Storage: ${pctFree}% dari 1 GB kuota gratis Supabase`);
  console.log(`- Sisa Kuota Gratis: ${formatBytes((1024 * 1024 * 1024) - grandTotalSize)}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

checkStorage().catch(console.error);
