-- Create junction table for addon <-> category (many-to-many)
CREATE TABLE IF NOT EXISTS public.addon_categories (
    addon_id UUID NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (addon_id, category_id)
);

-- Copy existing single category links to the new table
INSERT INTO public.addon_categories (addon_id, category_id)
SELECT id, category_id
FROM public.addons
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Security policies
ALTER TABLE public.addon_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read addon_categories"
    ON public.addon_categories FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert addon_categories"
    ON public.addon_categories FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon delete addon_categories"
    ON public.addon_categories FOR DELETE TO anon USING (true);
