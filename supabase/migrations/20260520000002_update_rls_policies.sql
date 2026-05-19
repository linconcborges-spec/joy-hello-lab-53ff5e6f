-- Fase 1: Atualizar RLS de todas as tabelas operacionais
-- Objetivo: somente funcionários autenticados acessam dados sensíveis.
-- O menu público (/cardapio) continua com acesso anon somente para leitura.

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
-- Remove políticas anon existentes
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
  DROP POLICY IF EXISTS "Enable update for all users" ON public.orders;
  DROP POLICY IF EXISTS "Enable delete for all users" ON public.orders;
  DROP POLICY IF EXISTS "orders_select" ON public.orders;
  DROP POLICY IF EXISTS "orders_insert" ON public.orders;
  DROP POLICY IF EXISTS "orders_update" ON public.orders;
  DROP POLICY IF EXISTS "orders_delete" ON public.orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth orders select" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth orders update" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth orders delete" ON public.orders FOR DELETE TO authenticated USING (true);

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.order_items;
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.order_items;
  DROP POLICY IF EXISTS "Enable update for all users" ON public.order_items;
  DROP POLICY IF EXISTS "Enable delete for all users" ON public.order_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth order_items select" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth order_items insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth order_items update" ON public.order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth order_items delete" ON public.order_items FOR DELETE TO authenticated USING (true);

-- ─── ORDER ADDONS ────────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.order_addons;
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.order_addons;
  DROP POLICY IF EXISTS "Enable update for all users" ON public.order_addons;
  DROP POLICY IF EXISTS "Enable delete for all users" ON public.order_addons;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.order_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth order_addons select" ON public.order_addons FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth order_addons insert" ON public.order_addons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth order_addons update" ON public.order_addons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth order_addons delete" ON public.order_addons FOR DELETE TO authenticated USING (true);

-- ─── CUSTOMERS ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.customers;
  DROP POLICY IF EXISTS "Enable update for all users" ON public.customers;
  DROP POLICY IF EXISTS "Enable delete for all users" ON public.customers;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth customers select" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth customers insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth customers update" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth customers delete" ON public.customers FOR DELETE TO authenticated USING (true);

-- ─── PRODUCTS (leitura pública para o menu) ───────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.products;
  DROP POLICY IF EXISTS "Enable update for all users" ON public.products;
  DROP POLICY IF EXISTS "Enable delete for all users" ON public.products;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon products select" ON public.products FOR SELECT TO anon USING (true);
CREATE POLICY "auth products select" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth products insert" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth products update" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth products delete" ON public.products FOR DELETE TO authenticated USING (true);

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.categories;
  DROP POLICY IF EXISTS "Enable update for all users" ON public.categories;
  DROP POLICY IF EXISTS "Enable delete for all users" ON public.categories;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon categories select" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "auth categories select" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth categories insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth categories update" ON public.categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth categories delete" ON public.categories FOR DELETE TO authenticated USING (true);

-- ─── PRODUCT CATEGORIES ──────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_categories;
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.product_categories;
  DROP POLICY IF EXISTS "Enable update for all users" ON public.product_categories;
  DROP POLICY IF EXISTS "Enable delete for all users" ON public.product_categories;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon product_categories select" ON public.product_categories FOR SELECT TO anon USING (true);
CREATE POLICY "auth product_categories select" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth product_categories insert" ON public.product_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth product_categories update" ON public.product_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth product_categories delete" ON public.product_categories FOR DELETE TO authenticated USING (true);

-- ─── ADDONS ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.addons;
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.addons;
  DROP POLICY IF EXISTS "Enable update for all users" ON public.addons;
  DROP POLICY IF EXISTS "Enable delete for all users" ON public.addons;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon addons select" ON public.addons FOR SELECT TO anon USING (true);
CREATE POLICY "auth addons select" ON public.addons FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth addons insert" ON public.addons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth addons update" ON public.addons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth addons delete" ON public.addons FOR DELETE TO authenticated USING (true);

-- ─── ADDON CATEGORIES ────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.addon_categories;
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.addon_categories;
  DROP POLICY IF EXISTS "Enable update for all users" ON public.addon_categories;
  DROP POLICY IF EXISTS "Enable delete for all users" ON public.addon_categories;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.addon_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon addon_categories select" ON public.addon_categories FOR SELECT TO anon USING (true);
CREATE POLICY "auth addon_categories select" ON public.addon_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth addon_categories insert" ON public.addon_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth addon_categories update" ON public.addon_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth addon_categories delete" ON public.addon_categories FOR DELETE TO authenticated USING (true);

-- ─── SETTINGS ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.settings;
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.settings;
  DROP POLICY IF EXISTS "Enable update for all users" ON public.settings;
  DROP POLICY IF EXISTS "Enable delete for all users" ON public.settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon settings select" ON public.settings FOR SELECT TO anon USING (true);
CREATE POLICY "auth settings select" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth settings insert" ON public.settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth settings update" ON public.settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth settings delete" ON public.settings FOR DELETE TO authenticated USING (true);
