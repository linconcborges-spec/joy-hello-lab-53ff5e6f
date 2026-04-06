CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.verify_employee_login(p_username text, p_password text)
RETURNS TABLE(id uuid, name text, username text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.name, e.username, e.role
  FROM public.employees e
  WHERE e.username = p_username
    AND e.password = crypt(p_password, e.password);
END;
$$;