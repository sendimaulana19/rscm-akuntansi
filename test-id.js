const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hrymstowrgqgquhzyfwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeW1zdG93cmdxZ3F1aHp5ZndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODAxNjIsImV4cCI6MjA5NjQ1NjE2Mn0.MTJMGSvvSL_HXQ8yV_BSApX7kBqI5MnqP0bJAPqEGIk'
);

async function test() {
  const { data, error } = await supabase.from('video_tutorial').select('*').eq('id', 'd446d66c-3c51-4893-9bcd-0e228beb3252').single();
  console.log('Error:', error);
  console.log('Data exists:', !!data);
}

test();
