-- Migra funcionários sem conta no Supabase Auth (auth_id IS NULL).
-- Para cada funcionário:
--   · senha em texto plano → cria conta com a senha original
--   · senha já hashada (começa com $) ou vazia → senha temporária = próprio username
-- Executa automaticamente ao rodar a migration.

CREATE OR REPLACE FUNCTION public.migrate_employees_to_auth()
RETURNS TABLE(funcionario text, email text, situacao text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  emp        RECORD;
  new_uid    UUID;
  emp_email  TEXT;
  use_pass   TEXT;
  is_temp    BOOLEAN;
BEGIN
  FOR emp IN
    SELECT e.id, e.name, e.username, e.password
    FROM   public.employees e
    WHERE  e.auth_id IS NULL
    ORDER  BY e.name
  LOOP
    emp_email := emp.username || '@imperiopos.local';

    -- Decide qual senha usar
    IF emp.password IS NULL
       OR emp.password = ''
       OR left(emp.password, 1) = '$'
    THEN
      -- Senha hashada ou vazia: usa username como senha temporária
      use_pass := emp.username;
      is_temp  := true;
    ELSE
      -- Senha em texto plano: usa diretamente
      use_pass := emp.password;
      is_temp  := false;
    END IF;

    new_uid := gen_random_uuid();

    -- Cria o usuário em auth.users
    INSERT INTO auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      new_uid,
      'authenticated',
      'authenticated',
      emp_email,
      extensions.crypt(use_pass, extensions.gen_salt('bf', 10)),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false,
      '', '', '', ''
    )
    ON CONFLICT (email) DO NOTHING;

    -- Se já existia uma conta com esse email, usa o id existente
    SELECT u.id INTO new_uid
    FROM   auth.users u
    WHERE  u.email = emp_email;

    -- Cria a identity (ignora se já existir)
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      created_at,
      updated_at
    ) VALUES (
      emp_email,
      new_uid,
      jsonb_build_object('sub', new_uid::text, 'email', emp_email),
      'email',
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;

    -- Vincula o auth_id ao funcionário
    UPDATE public.employees
    SET    auth_id = new_uid
    WHERE  id = emp.id;

    -- Retorna relatório
    IF is_temp THEN
      RETURN QUERY
        SELECT emp.name,
               emp_email,
               'migrado — senha temporária: ' || emp.username;
    ELSE
      RETURN QUERY
        SELECT emp.name,
               emp_email,
               'migrado — senha original mantida';
    END IF;
  END LOOP;
END;
$$;

-- Executa a migração e exibe o resultado
SELECT * FROM public.migrate_employees_to_auth();
