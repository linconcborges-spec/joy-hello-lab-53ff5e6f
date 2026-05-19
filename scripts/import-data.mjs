import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Passe as variáveis apenas na linha de comando — NUNCA commitar a service_role key.
// Exemplo de uso no PowerShell:
//   $env:SUPABASE_NEW_URL="https://SEU-PROJETO.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
//   node scripts/import-data.mjs

const NEW_URL = process.env.SUPABASE_NEW_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!NEW_URL || !SERVICE_KEY) {
  console.error('Erro: defina SUPABASE_NEW_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar.');
  console.error('  $env:SUPABASE_NEW_URL="https://SEU-PROJETO.supabase.co"');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."');
  process.exit(1);
}

// service_role bypassa RLS — usado apenas localmente durante a migração
const supabase = createClient(NEW_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function upsertAll(table, rows, onConflict) {
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from(table)
      .upsert(rows.slice(i, i + CHUNK), { onConflict });
    if (error) throw new Error(`"${table}" (chunk ${i}): ${error.message}`);
  }
}

async function run() {
  const backupPath = join(__dirname, 'backup.json');
  const backup = JSON.parse(readFileSync(backupPath, 'utf-8'));
  console.log('Importando dados no novo Supabase...\n');

  // Ordem respeita dependências de FK
  const order = [
    ['categories',        'id'],
    ['employees',         'id'],
    ['customers',         'id'],
    ['settings',          'key'],
    ['products',          'id'],
    ['addons',            'id'],
    ['product_categories','product_id,category_id'],
    ['addon_categories',  'addon_id,category_id'],
    ['orders',            'id'],
    ['order_items',       'id'],
    ['order_addons',      'id'],
  ];

  for (const [table, onConflict] of order) {
    const rows = backup[table] ?? [];
    if (rows.length === 0) {
      console.log(`  ${table}: sem dados, pulando`);
      continue;
    }
    process.stdout.write(`  ${table} (${rows.length} registros)... `);
    await upsertAll(table, rows, onConflict);
    console.log('OK');
  }

  console.log('\nImportação concluída!');
  console.log('Próximo passo: atualize .env e supabase/config.toml com os dados do novo projeto.');
}

run().catch(err => { console.error('\n' + err.message); process.exit(1); });
