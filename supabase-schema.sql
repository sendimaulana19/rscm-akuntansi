-- ================================================
-- SCHEMA DATABASE TIM KERJA AKUNTANSI RSCM
-- Versi: 2.0 (idempotent — aman dijalankan ulang)
-- Jalankan SQL ini di Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. PROFILES (extend Supabase auth.users) ──
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  nama TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nama');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. KINERJA KEUANGAN (12 KPI) ──
CREATE TABLE IF NOT EXISTS public.kinerja_keuangan (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bulan INT NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun INT NOT NULL,
  ebitda BIGINT,
  arus_kas_bersih BIGINT,
  pendapatan_operasional BIGINT,
  rasio_beban_pegawai NUMERIC(5,2),
  rasio_beban_persediaan_farmasi NUMERIC(5,2),
  rasio_beban_persediaan_non_farmasi NUMERIC(5,2),
  margin_laba_kotor NUMERIC(5,2),
  margin_laba_usaha NUMERIC(5,2),
  ebitda_margin NUMERIC(5,2),
  perputaran_piutang NUMERIC(5,1),
  perputaran_persediaan NUMERIC(5,1),
  perputaran_utang NUMERIC(5,1),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bulan, tahun)
);

-- ── 3. LAPORAN KEUANGAN ──
CREATE TABLE IF NOT EXISTS public.laporan_keuangan (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  judul TEXT NOT NULL,
  periode TEXT NOT NULL CHECK (periode IN ('Semester 1', 'Semester 2', 'Tahunan')),
  tahun INT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. CATATAN ATAS LAPORAN KEUANGAN ──
CREATE TABLE IF NOT EXISTS public.catatan_laporan_keuangan (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  judul TEXT NOT NULL,
  tahun INT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. AKUNTANSI MANAJEMEN (KSO) ──
CREATE TABLE IF NOT EXISTS public.akuntansi_manajemen (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nama_kso TEXT NOT NULL,
  periode TEXT NOT NULL CHECK (periode IN ('Triwulan 1', 'Triwulan 2', 'Triwulan 3', 'Triwulan 4')),
  tahun INT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. VIDEO TUTORIAL ──
CREATE TABLE IF NOT EXISTS public.video_tutorial (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. KEPUASAN PELANGGAN ──
CREATE TABLE IF NOT EXISTS public.kepuasan_pelanggan (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('gambar', 'pdf')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. DOWNLOAD DOKUMEN ──
CREATE TABLE IF NOT EXISTS public.download_dokumen (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  kategori TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  jumlah_unduhan INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. DOKUMENTASI KEGIATAN ──
CREATE TABLE IF NOT EXISTS public.dokumentasi (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  caption TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('foto', 'video')),
  tanggal DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 10. PENGUMUMAN ──
CREATE TABLE IF NOT EXISTS public.pengumuman (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  judul TEXT NOT NULL,
  konten TEXT,
  jenis TEXT CHECK (jenis IN ('teks', 'gambar', 'pdf')),
  file_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 11. HALAMAN PROFIL ──
CREATE TABLE IF NOT EXISTS public.halaman_profil (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  judul TEXT NOT NULL,
  konten TEXT,
  gambar_urls TEXT[],
  file_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.halaman_profil (slug, judul) VALUES
  ('rscm', 'Profil RSCM'),
  ('struktur-organisasi', 'Struktur Organisasi'),
  ('kpi', 'KPI'),
  ('budaya-kerja', 'Budaya Kerja')
ON CONFLICT (slug) DO NOTHING;

-- ── 12. OUR TEAMS ──
CREATE TABLE IF NOT EXISTS public.our_teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nama TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  foto_url TEXT,
  urutan INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 13. KONTAK PESAN ──
CREATE TABLE IF NOT EXISTS public.kontak_pesan (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT NOT NULL,
  pesan TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinerja_keuangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_keuangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catatan_laporan_keuangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akuntansi_manajemen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tutorial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kepuasan_pelanggan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_dokumen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dokumentasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaman_profil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.our_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kontak_pesan ENABLE ROW LEVEL SECURITY;

-- ================================================
-- DROP semua policy lama (agar tidak konflik)
-- ================================================

-- kinerja_keuangan
DROP POLICY IF EXISTS "Public can read kinerja_keuangan" ON public.kinerja_keuangan;
DROP POLICY IF EXISTS "Admin can all kinerja_keuangan" ON public.kinerja_keuangan;

-- laporan_keuangan
DROP POLICY IF EXISTS "Public can read laporan_keuangan" ON public.laporan_keuangan;
DROP POLICY IF EXISTS "Admin can all laporan_keuangan" ON public.laporan_keuangan;

-- catatan_laporan_keuangan
DROP POLICY IF EXISTS "Public can read catatan_laporan" ON public.catatan_laporan_keuangan;
DROP POLICY IF EXISTS "Admin can all catatan_laporan" ON public.catatan_laporan_keuangan;

-- akuntansi_manajemen
DROP POLICY IF EXISTS "Public can read akuntansi_manajemen" ON public.akuntansi_manajemen;
DROP POLICY IF EXISTS "Admin can all akuntansi_manajemen" ON public.akuntansi_manajemen;

-- video_tutorial
DROP POLICY IF EXISTS "Public can read video_tutorial" ON public.video_tutorial;
DROP POLICY IF EXISTS "Admin can all video_tutorial" ON public.video_tutorial;

-- kepuasan_pelanggan
DROP POLICY IF EXISTS "Public can read kepuasan_pelanggan" ON public.kepuasan_pelanggan;
DROP POLICY IF EXISTS "Admin can all kepuasan_pelanggan" ON public.kepuasan_pelanggan;

-- download_dokumen
DROP POLICY IF EXISTS "Public can read download_dokumen" ON public.download_dokumen;
DROP POLICY IF EXISTS "Admin can all download_dokumen" ON public.download_dokumen;

-- dokumentasi
DROP POLICY IF EXISTS "Public can read dokumentasi" ON public.dokumentasi;
DROP POLICY IF EXISTS "Admin can all dokumentasi" ON public.dokumentasi;

-- pengumuman
DROP POLICY IF EXISTS "Public can read pengumuman" ON public.pengumuman;
DROP POLICY IF EXISTS "Admin can all pengumuman" ON public.pengumuman;

-- halaman_profil
DROP POLICY IF EXISTS "Public can read halaman_profil" ON public.halaman_profil;
DROP POLICY IF EXISTS "Admin can all halaman_profil" ON public.halaman_profil;

-- our_teams
DROP POLICY IF EXISTS "Public can read our_teams" ON public.our_teams;
DROP POLICY IF EXISTS "Admin can all our_teams" ON public.our_teams;

-- kontak_pesan
DROP POLICY IF EXISTS "Public can insert kontak_pesan" ON public.kontak_pesan;
DROP POLICY IF EXISTS "Admin can read kontak_pesan" ON public.kontak_pesan;

-- profiles
DROP POLICY IF EXISTS "User can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;

-- ================================================
-- BUAT ULANG SEMUA POLICY
-- ================================================

-- PUBLIC READ (pengunjung tanpa login bisa baca)
CREATE POLICY "Public can read kinerja_keuangan"
  ON public.kinerja_keuangan FOR SELECT USING (true);

CREATE POLICY "Public can read laporan_keuangan"
  ON public.laporan_keuangan FOR SELECT USING (true);

CREATE POLICY "Public can read catatan_laporan"
  ON public.catatan_laporan_keuangan FOR SELECT USING (true);

CREATE POLICY "Public can read akuntansi_manajemen"
  ON public.akuntansi_manajemen FOR SELECT USING (true);

CREATE POLICY "Public can read video_tutorial"
  ON public.video_tutorial FOR SELECT USING (true);

CREATE POLICY "Public can read kepuasan_pelanggan"
  ON public.kepuasan_pelanggan FOR SELECT USING (true);

CREATE POLICY "Public can read download_dokumen"
  ON public.download_dokumen FOR SELECT USING (true);

CREATE POLICY "Public can read dokumentasi"
  ON public.dokumentasi FOR SELECT USING (true);

CREATE POLICY "Public can read pengumuman"
  ON public.pengumuman FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read halaman_profil"
  ON public.halaman_profil FOR SELECT USING (true);

CREATE POLICY "Public can read our_teams"
  ON public.our_teams FOR SELECT USING (true);

CREATE POLICY "Public can insert kontak_pesan"
  ON public.kontak_pesan FOR INSERT WITH CHECK (true);

-- Public bisa update jumlah_unduhan (download counter)
CREATE POLICY "Public can update download count"
  ON public.download_dokumen FOR UPDATE USING (true) WITH CHECK (true);

-- ADMIN WRITE (hanya user login bisa insert/update/delete)
CREATE POLICY "Admin can all kinerja_keuangan"
  ON public.kinerja_keuangan FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can all laporan_keuangan"
  ON public.laporan_keuangan FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can all catatan_laporan"
  ON public.catatan_laporan_keuangan FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can all akuntansi_manajemen"
  ON public.akuntansi_manajemen FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can all video_tutorial"
  ON public.video_tutorial FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can all kepuasan_pelanggan"
  ON public.kepuasan_pelanggan FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can all download_dokumen"
  ON public.download_dokumen FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can all dokumentasi"
  ON public.dokumentasi FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can all pengumuman"
  ON public.pengumuman FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can all halaman_profil"
  ON public.halaman_profil FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can all our_teams"
  ON public.our_teams FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can read kontak_pesan"
  ON public.kontak_pesan FOR SELECT USING (auth.uid() IS NOT NULL);

-- Profiles
CREATE POLICY "User can read own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR ALL USING (auth.uid() IS NOT NULL);

-- ================================================
-- STORAGE BUCKETS
-- Buat manual di Supabase Dashboard > Storage
-- ================================================
-- Bucket: 'rscm-files'  → untuk PDF & dokumen (Public)
-- Bucket: 'rscm-images' → untuk foto/gambar (Public)
-- Bucket: 'rscm-videos' → untuk video (Public)
--
-- Cara buat:
-- 1. Buka Supabase Dashboard > Storage
-- 2. Klik "New bucket"
-- 3. Nama: rscm-files, centang "Public bucket"
-- 4. Ulangi untuk rscm-images dan rscm-videos
-- ================================================
