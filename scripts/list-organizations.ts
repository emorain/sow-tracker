import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data } = await supabase.from('organizations').select('id, name');
  console.log('\nYour organizations:\n');
  data?.forEach((org, i) => console.log(`${i + 1}. ${org.name}\n   ID: ${org.id}`));
  console.log('');
}

main();
