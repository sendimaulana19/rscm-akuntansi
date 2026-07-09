const { createClient } = require('@supabase/supabase-js');
const url = 'https://hrymstowrgqgquhzyfwf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeW1zdG93cmdxZ3F1aHp5ZndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODAxNjIsImV4cCI6MjA5NjQ1NjE2Mn0.MTJMGSvvSL_HXQ8yV_BSApX7kBqI5MnqP0bJAPqEGIk';
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('mitra_kso').select('*');
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
