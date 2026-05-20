-- Garante que anon pode chamar verify_employee_login (necessário para o login funcionar)
-- Em Supabase, EXECUTE é revogado de PUBLIC por padrão — precisa de grant explícito.
GRANT EXECUTE ON FUNCTION public.verify_employee_login(text, text) TO anon;
