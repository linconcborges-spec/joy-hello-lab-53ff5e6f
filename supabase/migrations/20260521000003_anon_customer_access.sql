-- Restaura acesso anônimo para operações do cardápio digital.
-- A migration 20260520000002 restringiu tudo a "authenticated",
-- mas clientes do /cardapio são usuários anônimos.

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
-- Clientes precisam criar pedidos e consultar o próprio pedido (acompanhamento)
CREATE POLICY "anon orders insert" ON public.orders
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon orders select" ON public.orders
  FOR SELECT TO anon USING (true);

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
CREATE POLICY "anon order_items insert" ON public.order_items
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon order_items select" ON public.order_items
  FOR SELECT TO anon USING (true);

-- ─── ORDER ADDONS ────────────────────────────────────────────────────────────
CREATE POLICY "anon order_addons insert" ON public.order_addons
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon order_addons select" ON public.order_addons
  FOR SELECT TO anon USING (true);
