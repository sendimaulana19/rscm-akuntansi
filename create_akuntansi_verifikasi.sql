CREATE TABLE IF NOT EXISTS public.akuntansi_verifikasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode VARCHAR(255) NOT NULL,
    dokumen_internal INTEGER NOT NULL DEFAULT 0,
    dokumen_eksternal INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.akuntansi_verifikasi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on akuntansi_verifikasi" ON public.akuntansi_verifikasi;
DROP POLICY IF EXISTS "Allow all access on akuntansi_verifikasi" ON public.akuntansi_verifikasi;

CREATE POLICY "Allow public read access on akuntansi_verifikasi" ON public.akuntansi_verifikasi FOR SELECT USING (true);
CREATE POLICY "Allow all access on akuntansi_verifikasi" ON public.akuntansi_verifikasi FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.akuntansi_verifikasi TO anon, authenticated;
