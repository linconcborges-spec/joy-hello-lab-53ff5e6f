import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toEmployeeEmail } from "@/lib/authUtils";
import bcrypt from "bcryptjs";

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
          setUser(emp);
          return true;
        }
        // Auth OK mas employee não encontrado — não cai no fallback de migração
        return false;
      }

      // 2. Fallback de migração: funcionário ainda não tem auth_id
      //    REQUER que "Confirm email" esteja DESATIVADO no Supabase Dashboard.
      const { data: empData, error: empError } = await withTimeout(
        supabase
          .from("employees" as any)
          .select("id, name, username, password, role, auth_id")
          .eq("username", username.trim().toLowerCase())
          .single(),
        8000
      );

      if (empError || !empData) return false;

      const d = empData as any;
      if (d.auth_id) {
        // Tem auth_id mas signInWithPassword falhou (ex: e-mail não confirmado ou senha dessincronizada)
        // Tenta verificar contra employees.password como fallback
        if (d.password) {
          const isHashFb = /^\$2[ayb]\$/.test(d.password);
          const isMatchFb = isHashFb
            ? bcrypt.compareSync(password, d.password)
            : d.password === password;
          if (isMatchFb) {
            const emp = { id: d.id, name: d.name, username: d.username, role: d.role };
            try {
              localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ ...emp, exp: Date.now() + 24 * 3600 * 1000 }));
            } catch { /* ok */ }
            setUser(emp);
            return true;
          }
        }
        return false;
      }

      // Verifica senha antiga (bcrypt ou texto plano)
      const storedPassword = d.password as string;
      const isHash = storedPassword && /^\$2[ayb]\$/.test(storedPassword);
      const isMatch = isHash
        ? bcrypt.compareSync(password, storedPassword)
        : storedPassword === password;

      if (!isMatch) return false;

      // Cria usuário no Supabase Auth e vincula ao employee
      const { data: signUpData, error: signUpError } = await withTimeout(
        supabase.auth.signUp({ email, password }),
        8000
      );
      if (signUpError || !signUpData.user) {
        console.error("[Auth] Falha ao criar usuário no Supabase Auth:", signUpError);
        return false;
      }

      await supabase
        .from("employees" as any)
        .update({ auth_id: signUpData.user.id, password: "" })
        .eq("id", d.id);

      const { data: finalSignIn } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        8000
      );
      if (finalSignIn.user) {
        setUser({ id: d.id, name: d.name, username: d.username, role: d.role });
        return true;
      }

      return false;
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
