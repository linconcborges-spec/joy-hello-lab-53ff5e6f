-- RPC pública para confirmar saída do pedido para entrega via QR code.
-- SECURITY DEFINER: executa com permissões do owner (bypassa RLS),
-- mas só altera status em transições válidas e seguras.
CREATE OR REPLACE FUNCTION public.confirm_order_departure(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_number INT;
BEGIN
  SELECT status, number INTO v_status, v_number
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Pedido não encontrado');
  END IF;

  -- Só avança para "delivering" se estiver em "preparing" ou "pending"
  IF v_status NOT IN ('preparing', 'pending', 'ready') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Pedido já está em entrega, concluído ou cancelado',
      'status', v_status
    );
  END IF;

  UPDATE public.orders
  SET status = 'delivering'
  WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'number', v_number, 'status', 'delivering');
END;
$$;

-- Permite que qualquer pessoa (anon) chame esta função via HTTP
GRANT EXECUTE ON FUNCTION public.confirm_order_departure(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_order_departure(UUID) TO authenticated;
