-- Create junction table for product <-> category (many-to-many)
CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Copy existing single category links to the new table
INSERT INTO public.product_categories (product_id, category_id)
SELECT id, category_id
FROM public.products
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Security policies
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read product_categories"
    ON public.product_categories FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert product_categories"
    ON public.product_categories FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon delete product_categories"
    ON public.product_categories FOR DELETE TO anon USING (true);
