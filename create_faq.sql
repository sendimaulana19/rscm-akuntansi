
CREATE TABLE IF NOT EXISTS public.faq (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pertanyaan TEXT NOT NULL,
  jawaban TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on faq" ON public.faq;
CREATE POLICY "Allow public read access on faq" ON public.faq FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all access on faq" ON public.faq;
CREATE POLICY "Allow all access on faq" ON public.faq FOR ALL USING (true) WITH CHECK (true);

