const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hrymstowrgqgquhzyfwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeW1zdG93cmdxZ3F1aHp5ZndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODAxNjIsImV4cCI6MjA5NjQ1NjE2Mn0.MTJMGSvvSL_HXQ8yV_BSApX7kBqI5MnqP0bJAPqEGIk'
);

async function test() {
  const { data, error } = await supabase.from('layanan_formulir').select('*');
  console.log('Error:', JSON.stringify(error, null, 2));
  console.log('Data:', data);
}

test();
