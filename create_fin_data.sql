CREATE TABLE IF NOT EXISTS public.financial_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    m1 NUMERIC, m2 NUMERIC, m3 NUMERIC, m4 NUMERIC, m5 NUMERIC, m6 NUMERIC,
    m7 NUMERIC, m8 NUMERIC, m9 NUMERIC, m10 NUMERIC, m11 NUMERIC, m12 NUMERIC,
    q1 NUMERIC, q2 NUMERIC, q3 NUMERIC, q4 NUMERIC,
    h1 NUMERIC, h2 NUMERIC,
    ytd NUMERIC,
    level1 VARCHAR(255),
    level2 VARCHAR(255),
    level3 VARCHAR(255),
    level4 VARCHAR(255),
    level5 VARCHAR(255),
    level6 VARCHAR(255),
    kode VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_type, year, item_name)
);
ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ""Allow public read access on financial_data"" ON public.financial_data;
CREATE POLICY ""Allow public read access on financial_data"" ON public.financial_data FOR SELECT USING (true);
DROP POLICY IF EXISTS ""Allow all access on financial_data"" ON public.financial_data;
CREATE POLICY ""Allow all access on financial_data"" ON public.financial_data FOR ALL USING (true) WITH CHECK (true);
