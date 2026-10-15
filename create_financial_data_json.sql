
CREATE TABLE IF NOT EXISTS public.financial_reports_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, year)
);

ALTER TABLE public.financial_reports_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on financial_reports_data" ON public.financial_reports_data;
CREATE POLICY "Allow public read access on financial_reports_data" ON public.financial_reports_data FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all access on financial_reports_data" ON public.financial_reports_data;
CREATE POLICY "Allow all access on financial_reports_data" ON public.financial_reports_data FOR ALL USING (true) WITH CHECK (true);

