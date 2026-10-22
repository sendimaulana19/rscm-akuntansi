/**
 * SKRIP BACKUP OTOMATIS SUPABASE - RSCM AKUNTANSI
 * 
 * Fungsi:
 * 1. Mengunduh SELURUH data tabel database Supabase ke format JSON & SQL INSERT.
 * 2. Mengunduh SELURUH berkas file/gambar/PDF dari Supabase Storage.
 * 3. Menyimpan hasil backup dengan rapi di dalam folder /backups/backup_YYYY-MM-DD_HH-mm-ss/
 * 
 * Cara menjalankan:
 * npm run backup
 * (atau: node scripts/backup.js)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Baca konfigurasi dari .env.local
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ File .env.local tidak ditemukan di direktori proyek.');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  let url = '';
  let key = '';

  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = trimmed.split('=')[1].trim();
    }
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      key = trimmed.split('=')[1].trim();
    }
  });

  if (!url || !key) {
    console.error('❌ URL atau ANON_KEY Supabase tidak ditemukan dalam .env.local.');
    process.exit(1);
  }

  return { url, key };
}

// 2. Daftar semua tabel database di proyek ini
const ALL_TABLES = [
  'financial_reports_data',
  'financial_data',
  'kinerja_keuangan',
  'laporan_keuangan',
  'catatan_laporan_keuangan',
  'akuntansi_manajemen',
  'mitra_kso',
  'akuntansi_verifikasi',
  'video_tutorial',
  'pusat_edukasi',
  'kepuasan_pelanggan',
  'download_dokumen',
  'dokumentasi',
  'pengumuman',
  'halaman_profil',
  'our_teams',
  'kontak_pesan',
  'faq',
  'layanan_formulir',
  'regulasi_kebijakan'
];

// Helper untuk format SQL value
function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Helper rekursif untuk mendaftar semua file di storage bucket
async function listAllFiles(client, bucket, folder = '') {
  let results = [];
  const { data, error } = await client.storage.from(bucket).list(folder, {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  });

  if (error || !data) return results;

  for (const item of data) {
    const itemPath = folder ? `${folder}/${item.name}` : item.name;
    // Jika tidak punya id atau metadata berukuran null, ini adalah subdirektori
    if (item.id === null || (item.metadata === null && !item.name.includes('.'))) {
      const subFiles = await listAllFiles(client, bucket, itemPath);
      results = results.concat(subFiles);
    } else {
      results.push({
        path: itemPath,
        name: item.name,
        size: item.metadata?.size || 0,
        mimetype: item.metadata?.mimetype || ''
      });
    }
  }

  return results;
}

async function runBackup() {
  console.log('\n=============================================================');
  console.log('🚀 MEMULAI PROSES BACKUP LENGKAP SUPABASE (RSCM AKUNTANSI)');
  console.log('=============================================================\n');

  const { url, key } = loadEnv();
  const client = createClient(url, key);

  // Buat folder backup berdasarkan waktu saat ini
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  
  const backupBaseDir = path.resolve(process.cwd(), 'backups', `backup_${timestamp}`);
  const dbDir = path.join(backupBaseDir, 'database');
  const storageDir = path.join(backupBaseDir, 'storage');

  fs.mkdirSync(dbDir, { recursive: true });
  fs.mkdirSync(storageDir, { recursive: true });

  console.log(`📁 Lokasi Folder Backup:`);
  console.log(`   ${backupBaseDir}\n`);

  const summary = {
    waktu_backup: now.toLocaleString('id-ID'),
    supabase_url: url,
    database: {},
    storage: {},
    total_baris_data: 0,
    total_berkas_storage: 0,
    total_ukuran_storage_kb: 0
  };

  // ══════════════════════════════════════════════════════════════
  // BAGIAN 1: BACKUP DATABASE
  // ══════════════════════════════════════════════════════════════
  console.log('📦 [1/2] MENGUNDUH DATA TABEL POSTGRESQL...');
  let combinedSql = `-- ============================================================\n`;
  combinedSql += `-- SQL RESTORE DATA RSCM AKUNTANSI\n`;
  combinedSql += `-- Dibuat otomatis: ${now.toLocaleString('id-ID')}\n`;
  combinedSql += `-- ============================================================\n\n`;

  for (const table of ALL_TABLES) {
    try {
      // Ambil seluruh data dengan pagination
      let allRows = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await client.from(table).select('*').range(from, to);

        if (error) {
          // Tabel mungkin belum dibuat atau tidak ada data
          throw error;
        }

        if (data && data.length > 0) {
          allRows = allRows.concat(data);
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      // Simpan file JSON per tabel
      const jsonFilePath = path.join(dbDir, `${table}.json`);
      fs.writeFileSync(jsonFilePath, JSON.stringify(allRows, null, 2), 'utf-8');

      summary.database[table] = allRows.length;
      summary.total_baris_data += allRows.length;

      // Buat SQL Insert jika ada data
      if (allRows.length > 0) {
        const cols = Object.keys(allRows[0]);
        combinedSql += `-- Tabel: ${table} (${allRows.length} baris)\n`;
        for (const row of allRows) {
          const vals = cols.map(c => escapeSqlValue(row[c]));
          combinedSql += `INSERT INTO public.${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
        combinedSql += `\n`;
      }

      console.log(`   ✅ Tabel '${table}': ${allRows.length} baris tersimpan`);
    } catch (err) {
      summary.database[table] = `Gagal / Kosong (${err.message})`;
      console.log(`   ⚪ Tabel '${table}': Dilewati (${err.message})`);
    }
  }

  // Simpan file SQL restore
  const sqlFilePath = path.join(dbDir, 'restore_data.sql');
  fs.writeFileSync(sqlFilePath, combinedSql, 'utf-8');
  console.log(`\n   📄 File SQL Restore telah dibuat: database/restore_data.sql`);

  // ══════════════════════════════════════════════════════════════
  // BAGIAN 2: BACKUP STORAGE BUCKETS
  // ══════════════════════════════════════════════════════════════
  console.log('\n📁 [2/2] MENGUNDUH BERKAS STORAGE (PDF, GAMBAR, DOKUMEN)...');
  const buckets = ['rscm-files', 'rscm-images'];

  for (const bucket of buckets) {
    try {
      console.log(`   🔍 Memeriksa bucket: '${bucket}'...`);
      const files = await listAllFiles(client, bucket);
      summary.storage[bucket] = { total_files: files.length, files: [] };

      if (files.length === 0) {
        console.log(`   ⚪ Bucket '${bucket}' kosong.`);
        continue;
      }

      console.log(`   📥 Mengunduh ${files.length} file dari bucket '${bucket}':`);

      for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        const targetFilePath = path.join(storageDir, bucket, fileInfo.path);
        fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });

        // Download data biner file
        const { data: fileData, error: dlError } = await client.storage.from(bucket).download(fileInfo.path);

        if (dlError || !fileData) {
          console.log(`      ❌ Gagal unduh: ${fileInfo.path} (${dlError?.message})`);
          continue;
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        fs.writeFileSync(targetFilePath, buffer);

        summary.storage[bucket].files.push({
          path: fileInfo.path,
          size_bytes: buffer.length
        });

        summary.total_berkas_storage++;
        summary.total_ukuran_storage_kb += Math.round(buffer.length / 1024);

        const sizeKb = (buffer.length / 1024).toFixed(1);
        console.log(`      [${i + 1}/${files.length}] ✅ ${fileInfo.path} (${sizeKb} KB)`);
      }
    } catch (bErr) {
      console.log(`   ❌ Error pada bucket '${bucket}': ${bErr.message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // BAGIAN 3: SIMPAN SUMMARY & PANDUAN RESTORE
  // ══════════════════════════════════════════════════════════════
  const summaryFilePath = path.join(backupBaseDir, 'summary.json');
  fs.writeFileSync(summaryFilePath, JSON.stringify(summary, null, 2), 'utf-8');

  const readmeContent = `=============================================================
PANDUAN RESTORE DATA KE SERVER RSCM
Tanggal Backup: ${now.toLocaleString('id-ID')}
=============================================================

Di dalam folder backup ini terdapat 2 folder utama:

1. FOLDER /database/
   - Berisi file JSON per tabel untuk arsip & audit.
   - Berisi file 'restore_data.sql' yang berisi seluruh data tabel
     dalam format perintah SQL INSERT siap jalan.
   
   Cara Restore Database ke PostgreSQL RSCM:
   a. Buat database PostgreSQL di server RSCM (misal: 'rscm_akuntansi').
   b. Jalankan file schema terlebih dahulu:
      psql -h <ip_server_rscm> -U postgres -d rscm_akuntansi -f supabase-schema.sql
   c. Masukkan data hasil backup ini:
      psql -h <ip_server_rscm> -U postgres -d rscm_akuntansi -f database/restore_data.sql
   (Atau bisa gunakan aplikasi DBeaver / pgAdmin dengan membuka file restore_data.sql lalu klik Execute).

2. FOLDER /storage/
   - Berisi file fisik PDF, foto, PowerPoint, dan infografis
     yang diorganisir sesuai bucket ('rscm-files' dan 'rscm-images').
   
   Cara Restore File ke Server RSCM:
   - Jika server RSCM memasang Self-Hosted Supabase:
     Cukup upload folder-folder ini ke dashboard Storage Supabase di RSCM.
   - Jika menggunakan server file biasa / folder public Next.js:
     Copy file-file ini ke folder public/uploads di server RSCM.

=============================================================
`;

  fs.writeFileSync(path.join(backupBaseDir, 'PANDUAN_RESTORE.txt'), readmeContent, 'utf-8');

  console.log('\n=============================================================');
  console.log('🎉 BACKUP SELESAI DENGAN SUKSES!');
  console.log(`📊 Ringkasan:`);
  console.log(`   - Total Baris Database Tersimpan: ${summary.total_baris_data} baris`);
  console.log(`   - Total Berkas File/PDF/Foto: ${summary.total_berkas_storage} file (~${(summary.total_ukuran_storage_kb / 1024).toFixed(2)} MB)`);
  console.log(`   - Petunjuk Restore: Lihat file 'PANDUAN_RESTORE.txt' di dalam folder backup.`);
  console.log('=============================================================\n');
}

runBackup().catch(err => {
  console.error('\n❌ Terjadi kesalahan saat menjalankan backup:', err);
  process.exit(1);
});
