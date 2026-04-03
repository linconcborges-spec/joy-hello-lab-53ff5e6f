-- Tabela de funcionários para autenticação
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read employees" ON public.employees FOR SELECT TO anon USING (true);
CREATE POLICY "insert employees" ON public.employees FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update employees" ON public.employees FOR UPDATE TO anon USING (true);
CREATE POLICY "delete employees" ON public.employees FOR DELETE TO anon USING (true);

-- Usuário admin padrão (senha: admin)
INSERT INTO public.employees (name, username, password, role)
VALUES ('Administrador', 'admin', 'admin', 'admin')
ON CONFLICT (username) DO NOTHING;
