import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://mcgjaewtjxwzuikeboie.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ2phZXd0anh3enVpa2Vib2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTE1MTksImV4cCI6MjA5MDYyNzUxOX0.83--ZKkkrBYQwrHZFGvg7a7NqN2EuhMQUAWRUVcQpIs";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchAll(table, select = '*') {
  const PAGE = 1000;
  let offset = 0;
  const rows = [];
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`Erro em "${table}": ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return rows;
}

async function run() {
  console.log('Exportando dados do Lovable Supabase...\n');
  const backup = {};

  // Inclui "password" nos employees para preservar o fallback de migração de auth.
  // O campo só é legível enquanto as novas políticas RLS (migrations 15-16) NÃO foram aplicadas no Lovable.
  const tables = [
    ['categories',        '*'],
    ['employees',         'id,name,username,role,created_at,password'],
    ['customers',         '*'],
    ['settings',          '*'],
    ['products',          '*'],
    ['addons',            '*'],
    ['product_categories','*'],
    ['addon_categories',  '*'],
    ['orders',            '*'],
    ['order_items',       '*'],
    ['order_addons',      '*'],
  ];

  for (const [table, select] of tables) {
    process.stdout.write(`  ${table}... `);
    const rows = await fetchAll(table, select);
    backup[table] = rows;
    console.log(`${rows.length} registros`);
  }

  const outPath = join(__dirname, 'backup.json');
  writeFileSync(outPath, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`\nBackup salvo em scripts/backup.json`);
  console.log('ATENÇÃO: esse arquivo contém dados de clientes e senhas — não commitar!');
}

run().catch(err => { console.error('\n' + err.message); process.exit(1); });
