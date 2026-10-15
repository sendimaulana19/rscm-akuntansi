const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      DROP TABLE IF EXISTS public.financial_reports_data;
      CREATE TABLE public.financial_reports_data (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          category VARCHAR(50) NOT NULL,
          year INTEGER NOT NULL,
          item_name VARCHAR(255) NOT NULL,
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(category, year, item_name)
      );

      ALTER TABLE public.financial_reports_data ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow public read access on financial_reports_data" ON public.financial_reports_data FOR SELECT USING (true);
      CREATE POLICY "Allow all access on financial_reports_data" ON public.financial_reports_data FOR ALL USING (true) WITH CHECK (true);
    `
  });
  console.log(error || 'Success');
}
run();
