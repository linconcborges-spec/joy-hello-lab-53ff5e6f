-- Adiciona colunas que foram criadas manualmente no banco antigo
-- e que não existem no banco novo após a migração.

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
