CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.verify_employee_login(p_username text, p_password text)
RETURNS TABLE(id uuid, name text, username text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.name, e.username, e.role
  FROM public.employees e
  WHERE e.username = p_username
    AND (
      e.password = p_password
      OR e.password = extensions.crypt(p_password, e.password)
    )
  LIMIT 1;
END;
$$;