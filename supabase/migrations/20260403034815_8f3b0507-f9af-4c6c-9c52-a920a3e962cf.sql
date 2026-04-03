CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.addons
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access for categories"
    ON public.categories FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert for categories"
    ON public.categories FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update for categories"
    ON public.categories FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anonymous delete for categories"
    ON public.categories FOR DELETE TO anon USING (true);

CREATE POLICY "Allow public read access for categories"
    ON public.categories FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert for categories"
    ON public.categories FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update for categories"
    ON public.categories FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete for categories"
    ON public.categories FOR DELETE TO public USING (true);