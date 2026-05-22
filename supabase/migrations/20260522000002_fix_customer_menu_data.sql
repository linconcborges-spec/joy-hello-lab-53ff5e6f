-- Corrige dados que causam o cardápio não mostrar produtos

-- 1. Produtos com is_visible NULL ficam visíveis por padrão
UPDATE public.products SET is_visible = true WHERE is_visible IS NULL;

-- 2. Zera sort_order NULL para ordenação funcionar
UPDATE public.products SET sort_order = 0 WHERE sort_order IS NULL;
UPDATE public.categories SET sort_order = 0 WHERE sort_order IS NULL;

-- 3. Garante política anon SELECT em product_categories (necessária para exibir produtos por categoria)
DO $$ BEGIN
  CREATE POLICY "anon product_categories select"
    ON public.product_categories FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
