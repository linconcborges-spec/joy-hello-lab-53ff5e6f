-- Fase 1: Migração para Supabase Auth
-- Adiciona auth_id na tabela employees para linkar com auth.users

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Índice para lookup rápido por auth_id
CREATE INDEX IF NOT EXISTS employees_auth_id_idx ON public.employees(auth_id);

-- Permite senha vazia (a senha passa a ser gerenciada pelo Supabase Auth)
ALTER TABLE public.employees ALTER COLUMN password SET DEFAULT '';

-- Remove as políticas RLS abertas ao anon
DROP POLICY IF EXISTS "read employees" ON public.employees;
DROP POLICY IF EXISTS "insert employees" ON public.employees;
DROP POLICY IF EXISTS "update employees" ON public.employees;
DROP POLICY IF EXISTS "delete employees" ON public.employees;

-- Função helper para obter o role do funcionário logado sem recursão no RLS
CREATE OR REPLACE FUNCTION public.get_my_employee_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.employees WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- Qualquer funcionário autenticado pode ler a tabela (necessário para AuthModal)
CREATE POLICY "authenticated read employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

-- Somente admins podem inserir funcionários
CREATE POLICY "admin insert employees"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_employee_role() = 'admin');

-- Somente admins podem atualizar funcionários
CREATE POLICY "admin update employees"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (public.get_my_employee_role() = 'admin');

-- Somente admins podem deletar funcionários
CREATE POLICY "admin delete employees"
  ON public.employees FOR DELETE
  TO authenticated
  USING (public.get_my_employee_role() = 'admin');
