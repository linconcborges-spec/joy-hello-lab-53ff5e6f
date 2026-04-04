-- ==========================================================
-- Migration: Adiciona colunas que faltavam no schema
-- ==========================================================

-- 1. Coluna CNPJ na tabela de pedidos
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- 2. Coluna is_printed na tabela de pedidos
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS is_printed BOOLEAN NOT NULL DEFAULT false;

-- 3. Código do produto e categoria no item do pedido
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS product_code TEXT;

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS category_id UUID;

-- 4. addresses já existe como JSONB — migra dados antigos se necessário
UPDATE public.customers
SET addresses = to_jsonb(ARRAY[address])
WHERE address IS NOT NULL
  AND address <> ''
  AND (addresses IS NULL OR addresses = '[]'::jsonb);
