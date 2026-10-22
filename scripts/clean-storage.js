/**
 * SKRIP PEMBERSIH STORAGE OTOMATIS (CLEAN STORAGE) - RSCM AKUNTANSI
 * 
 * Fungsi:
 * 1. Memindai seluruh tabel database untuk mengumpulkan daftar berkas yang masih AKTIF digunakan.
 * 2. Memindai seluruh isi bucket penyimpanan Supabase Storage ('rscm-files' dan 'rscm-images').
 * 3. Menemukan berkas "sampah" / yatim (orphaned files) yang datanya sudah dihapus dari panel admin.
 * 4. Menghapus berkas sampah fisik tersebut dari Supabase Storage untuk menghemat kuota free plan.
 * 
 * Cara Penggunaan:
 * - Pratinjau (cek tanpa menghapus): node scripts/clean-storage.js --dry-run
 * - Eksekusi pembersihan langsung:   npm run clean-storage
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

// 2. Daftar semua tabel database
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

const BUCKETS = ['rscm-files', 'rscm-images'];

// Helper rekursif list all files
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
    // Subdirektori ditandai dengan id null atau metadata null tanpa ekstensi
    if (item.id === null || (item.metadata === null && !item.name.includes('.'))) {
      const subFiles = await listAllFiles(client, bucket, itemPath);
      results = results.concat(subFiles);
    } else {
      results.push({
        bucket,
        path: itemPath,
        name: item.name,
        size: item.metadata?.size || 0,
        createdAt: item.created_at
      });
    }
  }

  return results;
}

async function runCleanup() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('====================================================');
  console.log('🧹 RSCM AKUNTANSI - PEMBERSIHAN STORAGE OTOMATIS');
  console.log('====================================================');
  console.log(`Mode: ${isDryRun ? '🔍 SIMULASI (Dry Run - Tanpa Menghapus)' : '⚡ EKSEKUSI PEMBERSIHAN (Hapus Berkas Yatim)'}`);
  console.log('');

  const { url, key } = loadEnv();
  const supabase = createClient(url, key);

  // 1. Kumpulkan seluruh data dari semua tabel database
  console.log('📦 1. Memindai seluruh data tabel database...');
  let combinedDbText = '';
  let totalRows = 0;

  for (const tableName of ALL_TABLES) {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (!error && data && data.length > 0) {
        totalRows += data.length;
        combinedDbText += ' ' + JSON.stringify(data);
      }
    } catch (e) {
      // Abaikan jika tabel belum dibuat
    }
  }
  console.log(`   ✓ Ditemukan ${totalRows} baris data aktif di database.`);

  // 2. Kumpulkan seluruh berkas di storage
  console.log('📁 2. Memindai seluruh berkas di Supabase Storage...');
  let allStorageFiles = [];
  for (const bucket of BUCKETS) {
    const files = await listAllFiles(supabase, bucket);
    console.log(`   - Bucket "${bucket}": ${files.length} berkas.`);
    allStorageFiles = allStorageFiles.concat(files);
  }
  console.log(`   ✓ Total berkas fisik di storage: ${allStorageFiles.length} berkas.`);

  // 3. Analisis berkas aktif vs berkas yatim (orphaned)
  console.log('\n🔎 3. Mencocokkan berkas storage dengan referensi database...');
  const activeFiles = [];
  const orphanedFiles = [];

  for (const file of allStorageFiles) {
    const rawName = file.name;
    const rawPath = file.path;
    const encodedName = encodeURIComponent(rawName);
    const encodedPath = rawPath.split('/').map(p => encodeURIComponent(p)).join('/');

    // Cek apakah nama atau path berkas (baik encoded maupun decoded) ada dalam data database
    const isUsed =
      combinedDbText.includes(rawName) ||
      combinedDbText.includes(rawPath) ||
      combinedDbText.includes(encodedName) ||
      combinedDbText.includes(encodedPath);

    if (isUsed) {
      activeFiles.push(file);
    } else {
      orphanedFiles.push(file);
    }
  }

  const formatSize = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
  const orphanedTotalSize = orphanedFiles.reduce((acc, f) => acc + f.size, 0);
  const activeTotalSize = activeFiles.reduce((acc, f) => acc + f.size, 0);

  console.log(`   - Berkas Aktif (Masih digunakan): ${activeFiles.length} berkas (${formatSize(activeTotalSize)})`);
  console.log(`   - Berkas Yatim (Sudah dihapus di admin): ${orphanedFiles.length} berkas (${formatSize(orphanedTotalSize)})`);

  if (orphanedFiles.length === 0) {
    console.log('\n✨ Bersih! Tidak ada berkas sampah/yatim di Supabase Storage.');
    console.log('Semua berkas penyimpanan saat ini masih aktif digunakan.');
    return;
  }

  console.log('\n📋 DAFTAR BERKAS SAMPAH / YATIM YANG AKAN DIHAPUS:');
  orphanedFiles.forEach((f, idx) => {
    console.log(`   ${idx + 1}. [${f.bucket}] ${f.path} (${formatSize(f.size)})`);
  });

  if (isDryRun) {
    console.log('\n💡 Ini adalah mode --dry-run. Tidak ada berkas yang dihapus.');
    console.log('Jalankan "npm run clean-storage" untuk menghapus berkas-berkas di atas secara permanen.');
    return;
  }

  // 4. Eksekusi penghapusan fisik dari storage
  console.log('\n🗑️ 4. Menghapus berkas sampah fisik dari Supabase Storage...');
  let deletedCount = 0;
  let failedCount = 0;

  for (const f of orphanedFiles) {
    try {
      const { error } = await supabase.storage.from(f.bucket).remove([f.path]);
      if (error) {
        console.error(`   ❌ Gagal menghapus [${f.bucket}] ${f.path}:`, error.message);
        failedCount++;
      } else {
        console.log(`   ✓ Terhapus: [${f.bucket}] ${f.path}`);
        deletedCount++;
      }
    } catch (err) {
      console.error(`   ❌ Error [${f.bucket}] ${f.path}:`, err.message);
      failedCount++;
    }
  }

  console.log('\n====================================================');
  console.log('🎉 PEMBERSIHAN SELESAI!');
  console.log(`- Berhasil dihapus : ${deletedCount} berkas`);
  if (failedCount > 0) console.log(`- Gagal dihapus    : ${failedCount} berkas`);
  console.log(`- Ruang dihemat    : ${formatSize(orphanedTotalSize)}`);
  console.log(`- Sisa berkas aktif: ${activeFiles.length} berkas (${formatSize(activeTotalSize)})`);
  console.log('====================================================\n');
}

runCleanup().catch(err => {
  console.error('Fatal error saat membersihkan storage:', err);
  process.exit(1);
});
