import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mcgjaewtjxwzuikeboie.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ2phZXd0anh3enVpa2Vib2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTE1MTksImV4cCI6MjA5MDYyNzUxOX0.83--ZKkkrBYQwrHZFGvg7a7NqN2EuhMQUAWRUVcQpIs";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Criando tabela addon_categories...");

  // Step 1: Try to create the table via RPC (exec_sql) — common pattern in this project
  // Since we're using anon key, we'll test with direct operations instead.
  
  // Check if table already exists by trying to select from it
  const { data: existing, error: checkError } = await supabase
    .from("addon_categories")
    .select("addon_id")
    .limit(1);

  if (!checkError) {
    console.log("✅ Tabela addon_categories já existe!");
    
    // Let's see how many rows are in it
    const { count } = await supabase
      .from("addon_categories")
      .select("*", { count: "exact", head: true });
    console.log(`   Registros existentes: ${count}`);
    return;
  }

  console.log("❌ Tabela addon_categories NÃO existe ainda.");
  console.log("   Erro:", checkError.message);
  console.log("");
  console.log("⚠️  Execute o seguinte SQL no painel do Supabase:");
  console.log("   https://supabase.com/dashboard/project/mcgjaewtjxwzuikeboie/sql/new");
  console.log("");
  console.log(`-- ============================================================
-- Migration: addon_categories (many-to-many addon <-> category)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.addon_categories (
    addon_id UUID NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (addon_id, category_id)
);

-- Migrar dados existentes do campo category_id
INSERT INTO public.addon_categories (addon_id, category_id)
SELECT id, category_id
FROM public.addons
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.addon_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read addon_categories"
    ON public.addon_categories FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert addon_categories"
    ON public.addon_categories FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon delete addon_categories"
    ON public.addon_categories FOR DELETE TO anon USING (true);`);
}

run().catch(console.error);
