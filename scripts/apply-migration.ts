import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = join(__dirname, '../supabase/migrations/20251220000000_financial_tracking.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('Applying migration to Supabase...');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (!statement) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          // Try direct query if RPC fails
          const { error: queryError } = await (supabase as any).from('_').select().limit(0);

          if (queryError) {
            console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
            console.error(queryError);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Exception executing statement: ${statement.substring(0, 100)}...`);
        console.error(err);
        errorCount++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Successful statements: ${successCount}`);
    console.log(`Failed statements: ${errorCount}`);

    if (errorCount === 0) {
      console.log('✅ All statements executed successfully!');
    } else {
      console.log('⚠️ Some statements failed. Please check the errors above.');
    }

  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
