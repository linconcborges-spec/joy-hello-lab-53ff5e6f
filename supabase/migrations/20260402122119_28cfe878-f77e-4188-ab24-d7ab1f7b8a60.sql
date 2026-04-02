
CREATE TABLE public.addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code SERIAL NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view addons" ON public.addons FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert addons" ON public.addons FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update addons" ON public.addons FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete addons" ON public.addons FOR DELETE TO public USING (true);
