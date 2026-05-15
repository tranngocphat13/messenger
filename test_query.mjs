import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uoninckkdjidwpswdyux.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbmluY2trZGppZHdwc3dkeXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MjExNzMsImV4cCI6MjA5MzM5NzE3M30.wPLiCLg_6J6sUr9DnX_e43eNlL8VS8P0xtyJLpWpbqc'
);

async function test() {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participants:participants(
        user:profiles(*)
      )
    `)
    .limit(2);
    
  console.dir(data, { depth: null });
  console.error(error);
}

test();
