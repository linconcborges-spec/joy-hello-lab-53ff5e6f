-- ============================================================
-- Schema completo — Império Chiclets POS
-- Colar inteiro no SQL Editor do novo projeto Supabase (banco vazio)
-- ============================================================

-- ─── EXTENSÕES ──────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ─── TABELAS ────────────────────────────────────────────────

CREATE TABLE public.categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  sort_order  INTEGER,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.customers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        SERIAL      UNIQUE,
  name        TEXT        NOT NULL,
  address     TEXT        NOT NULL DEFAULT '',
  addresses   JSONB,
  phone       TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  code        INTEGER        NOT NULL UNIQUE,
  name        TEXT           NOT NULL,
  price       NUMERIC(10,2)  NOT NULL DEFAULT 0,
  description TEXT,
  image_url   TEXT,
  is_visible  BOOLEAN        DEFAULT true,
  sort_order  INTEGER,
  category_id UUID           REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE public.addons (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        SERIAL      NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  price       NUMERIC     NOT NULL DEFAULT 0,
  category_id UUID        REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.employees (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  username    TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL DEFAULT '',
  role        TEXT        NOT NULL DEFAULT 'user',
  auth_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        UNIQUE NOT NULL,
  value       TEXT        NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  number            INTEGER     NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending',
  customer_name     TEXT,
  phone             TEXT,
  address           TEXT,
  payment_method    TEXT        NOT NULL,
  total_amount      NUMERIC     NOT NULL,
  delivery_fee      NUMERIC,
  change_for        NUMERIC,
  observation       TEXT,
  cnpj              TEXT,
  is_printed        BOOLEAN     DEFAULT false,
  original_snapshot JSONB,
  last_edited_at    TIMESTAMPTZ,
  last_edited_by    TEXT,
  cancelled_at      TIMESTAMPTZ,
  cancelled_by      TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.order_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID        REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    UUID,
  product_name  TEXT        NOT NULL,
  product_code  TEXT,
  category_id   UUID,
  quantity      INTEGER     NOT NULL,
  unit_price    NUMERIC     NOT NULL,
  total         NUMERIC     NOT NULL,
  observation   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.order_addons (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID        REFERENCES public.order_items(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  price         NUMERIC     NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.product_categories (
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE public.addon_categories (
  addon_id    UUID NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (addon_id, category_id)
);

-- ─── ÍNDICES ────────────────────────────────────────────────

CREATE INDEX employees_auth_id_idx ON public.employees(auth_id);

-- ─── TRIGGER ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── FUNÇÕES ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_employee_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.employees WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_employee_login(p_username text, p_password text)
RETURNS TABLE(id uuid, name text, username text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.name, e.username, e.role
  FROM public.employees e
  WHERE e.username = p_username
    AND (
      e.password = p_password
      OR e.password = extensions.crypt(p_password, e.password)
    )
  LIMIT 1;
END;
$$;

-- ─── RLS ────────────────────────────────────────────────────

ALTER TABLE public.customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_addons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_categories  ENABLE ROW LEVEL SECURITY;

-- Customers — somente autenticado
CREATE POLICY "auth customers select" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth customers insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth customers update" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth customers delete" ON public.customers FOR DELETE TO authenticated USING (true);

-- Products — leitura pública (menu), escrita autenticada
CREATE POLICY "anon products select" ON public.products FOR SELECT TO anon USING (true);
CREATE POLICY "auth products select" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth products insert" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth products update" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth products delete" ON public.products FOR DELETE TO authenticated USING (true);

-- Addons — leitura pública (menu), escrita autenticada
CREATE POLICY "anon addons select" ON public.addons FOR SELECT TO anon USING (true);
CREATE POLICY "auth addons select" ON public.addons FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth addons insert" ON public.addons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth addons update" ON public.addons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth addons delete" ON public.addons FOR DELETE TO authenticated USING (true);

-- Categories — leitura pública (menu), escrita autenticada
CREATE POLICY "anon categories select" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "auth categories select" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth categories insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth categories update" ON public.categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth categories delete" ON public.categories FOR DELETE TO authenticated USING (true);

-- Employees — autenticado lê, somente admin escreve
CREATE POLICY "authenticated read employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin insert employees"        ON public.employees FOR INSERT TO authenticated WITH CHECK (public.get_my_employee_role() = 'admin');
CREATE POLICY "admin update employees"        ON public.employees FOR UPDATE TO authenticated USING (public.get_my_employee_role() = 'admin');
CREATE POLICY "admin delete employees"        ON public.employees FOR DELETE TO authenticated USING (public.get_my_employee_role() = 'admin');

-- Settings — leitura pública, escrita autenticada
CREATE POLICY "anon settings select" ON public.settings FOR SELECT TO anon USING (true);
CREATE POLICY "auth settings select" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth settings insert" ON public.settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth settings update" ON public.settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth settings delete" ON public.settings FOR DELETE TO authenticated USING (true);

-- Orders — somente autenticado
CREATE POLICY "auth orders select" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth orders update" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth orders delete" ON public.orders FOR DELETE TO authenticated USING (true);

-- Order items — somente autenticado
CREATE POLICY "auth order_items select" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth order_items insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth order_items update" ON public.order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth order_items delete" ON public.order_items FOR DELETE TO authenticated USING (true);

-- Order addons — somente autenticado
CREATE POLICY "auth order_addons select" ON public.order_addons FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth order_addons insert" ON public.order_addons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth order_addons update" ON public.order_addons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth order_addons delete" ON public.order_addons FOR DELETE TO authenticated USING (true);

-- Product categories — leitura pública, escrita autenticada
CREATE POLICY "anon product_categories select" ON public.product_categories FOR SELECT TO anon USING (true);
CREATE POLICY "auth product_categories select" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth product_categories insert" ON public.product_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth product_categories update" ON public.product_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth product_categories delete" ON public.product_categories FOR DELETE TO authenticated USING (true);

-- Addon categories — leitura pública, escrita autenticada
CREATE POLICY "anon addon_categories select" ON public.addon_categories FOR SELECT TO anon USING (true);
CREATE POLICY "auth addon_categories select" ON public.addon_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth addon_categories insert" ON public.addon_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth addon_categories update" ON public.addon_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth addon_categories delete" ON public.addon_categories FOR DELETE TO authenticated USING (true);

-- ─── DADOS INICIAIS ─────────────────────────────────────────

INSERT INTO public.settings (key, value) VALUES
  ('store_name',           'Império Chiclets'),
  ('default_delivery_fee', '0'),
  ('print_paper_width',    '80mm'),
  ('print_margin_top',     '0mm'),
  ('print_margin',         '0px'),
  ('print_font_size',      '14px')
ON CONFLICT (key) DO NOTHING;
