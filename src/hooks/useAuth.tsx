import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toEmployeeEmail } from "@/lib/authUtils";
import { toast } from "sonner";

const LOCAL_SESSION_KEY = "_emp_session_v1";

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchEmployeeByAuthId(authId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("employees" as any)
    .select("id, name, username, role")
    .eq("auth_id", authId)
    .single();

  if (error || !data) return null;
  const d = data as any;
  return { id: d.id, name: d.name, username: d.username, role: d.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restaura sessão local imediatamente (síncrono) — cobre funcionários sem Supabase Auth
    try {
      const raw = localStorage.getItem(LOCAL_SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.exp > Date.now()) {
          setUser({ id: s.id, name: s.name, username: s.username, role: s.role });
        } else {
          localStorage.removeItem(LOCAL_SESSION_KEY);
        }
      }
    } catch { /* localStorage indisponível */ }

    // Timeout de segurança: se o Supabase não responder em 5s, libera a tela
    const timeout = setTimeout(() => setIsLoading(false), 5000);

    withTimeout(supabase.auth.getSession(), 4000).then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          const emp = await withTimeout(fetchEmployeeByAuthId(session.user.id), 4000);
          setUser(emp);
        }
      } catch {
        // falha ao buscar employee — mantém sessão local se houver
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    }).catch(() => {
      clearTimeout(timeout);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        try { localStorage.removeItem(LOCAL_SESSION_KEY); } catch { /* ok */ }
      } else if (session?.user) {
        try {
          const emp = await withTimeout(fetchEmployeeByAuthId(session.user.id), 8000);
          if (emp) setUser(emp);
        } catch {
          // timeout ou erro de rede: mantém o usuário atual
        }
      }
    });

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const email = toEmployeeEmail(username.trim().toLowerCase());

    try {
      // 1. Tentativa via Supabase Auth (caminho normal)
      const { data: signInData, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        8000
      );

      if (!signInError && signInData.user) {
        // Auth OK — busca o employee vinculado
        const emp = await withTimeout(fetchEmployeeByAuthId(signInData.user.id), 5000);
        if (emp) {
          // Persiste sessão local (supabase client tem persistSession:false)
          try {
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({
              id: emp.id, name: emp.name, username: emp.username, role: emp.role,
              exp: Date.now() + 24 * 3600 * 1000,
            }));
          } catch { /* ok */ }
          setUser(emp);
          return true;
        }
        return false;
      }

      // 2. Fallback via RPC verify_employee_login (SECURITY DEFINER — ignora RLS)
      //    pgcrypto.crypt() faz a comparação bcrypt no servidor, sem ler senha no cliente
      const { data: rpcRows, error: rpcError } = await withTimeout(
        supabase.rpc("verify_employee_login", {
          p_username: username.trim().toLowerCase(),
          p_password: password,
        }),
        8000
      );

      if (rpcError) {
        console.error("[Auth] verify_employee_login erro:", rpcError.message);
        toast.error(`Erro de verificação: ${rpcError.message}`, { id: "auth-rpc-err" });
        return false;
      }

      const rows = rpcRows as Array<{ id: string; name: string; username: string; role: string }> | null;
      if (!rows || rows.length === 0) {
        // Senha errada ou funcionário não existe — mensagem genérica por segurança
        return false;
      }

      const emp = rows[0];
      try {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({
          id: emp.id, name: emp.name, username: emp.username, role: emp.role,
          exp: Date.now() + 24 * 3600 * 1000,
        }));
      } catch { /* ok */ }
      setUser({ id: emp.id, name: emp.name, username: emp.username, role: emp.role });
      return true;
    } catch {
      // timeout ou erro de rede
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try { localStorage.removeItem(LOCAL_SESSION_KEY); } catch { /* ok */ }
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === "admin", login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
