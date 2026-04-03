-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to products
ALTER TABLE public.products
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Add category_id to addons
ALTER TABLE public.addons
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Security policies for Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access for categories"
    ON public.categories
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow anonymous insert for categories"
    ON public.categories
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous update for categories"
    ON public.categories
    FOR UPDATE
    TO anon
    USING (true);

CREATE POLICY "Allow anonymous delete for categories"
    ON public.categories
    FOR DELETE
    TO anon
    USING (true);
