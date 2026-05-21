CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  sender text NOT NULL CHECK (sender IN ('customer', 'admin')),
  message text NOT NULL,
  customer_name text,
  created_at timestamptz DEFAULT now(),
  read_by_admin boolean DEFAULT false
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Anon (customers) can insert and read (filtered by session_id in app)
CREATE POLICY "chat_anon_insert" ON chat_messages
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "chat_anon_select" ON chat_messages
  FOR SELECT TO anon USING (true);

-- Authenticated (admin) can do everything
CREATE POLICY "chat_auth_all" ON chat_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
