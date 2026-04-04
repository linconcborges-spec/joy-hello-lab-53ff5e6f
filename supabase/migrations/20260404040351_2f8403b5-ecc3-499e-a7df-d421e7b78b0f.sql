
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert settings" ON public.settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update settings" ON public.settings FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete settings" ON public.settings FOR DELETE TO public USING (true);

INSERT INTO public.settings (key, value) VALUES
  ('store_name', 'Império Chiclets'),
  ('default_delivery_fee', '0'),
  ('print_paper_width', '80mm'),
  ('print_margin_top', '0mm'),
  ('print_margin', '0px'),
  ('print_font_size', '14px');
