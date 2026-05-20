import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toEmployeeEmail } from "@/lib/authUtils";
import bcrypt from "bcryptjs";

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
    // Timeout de segurança: se o Supabase não responder em 8s, libera a tela
    const timeout = setTimeout(() => setIsLoading(false), 8000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          const emp = await fetchEmployeeByAuthId(session.user.id);
          setUser(emp);
        }
      } catch {
        // falha ao buscar employee — trata como não autenticado
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    }).catch(() => {
      clearTimeout(timeout);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
      } else if (session?.user) {
        try {
          const emp = await fetchEmployeeByAuthId(session.user.id);
          setUser(emp);
        } catch {
          setUser(null);
        }
      }
    });

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const email = toEmployeeEmail(username.trim().toLowerCase());

    // 1. Tentativa via Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (!signInError && signInData.user) {
      const emp = await fetchEmployeeByAuthId(signInData.user.id);
      if (emp) {
        setUser(emp);
        return true;
      }
    }

    // 2. Fallback de migração: funcionário ainda não tem auth_id
    //    Verifica credenciais antigas (bcrypt / texto plano) e migra automaticamente.
    //    REQUER que "Confirm email" esteja DESATIVADO no Supabase Dashboard (Auth > Settings).
    const { data: empData, error: empError } = await supabase
      .from("employees" as any)
      .select("id, name, username, password, role, auth_id")
      .eq("username", username.trim().toLowerCase())
      .single();

    if (empError || !empData) return false;

    const d = empData as any;
    if (d.auth_id) {
      // Tem auth_id mas o signInWithPassword falhou → senha errada
      return false;
    }

    // Verifica senha antiga (bcrypt ou texto plano)
    const storedPassword = d.password as string;
    const isHash = storedPassword && /^\$2[ayb]\$/.test(storedPassword);
    const isMatch = isHash
      ? bcrypt.compareSync(password, storedPassword)
      : storedPassword === password;

    if (!isMatch) return false;

    // Cria o usuário no Supabase Auth e vincula ao employee
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !signUpData.user) {
      console.error("[Auth] Falha ao criar usuário no Supabase Auth:", signUpError);
      return false;
    }

    await supabase
      .from("employees" as any)
      .update({ auth_id: signUpData.user.id, password: "" })
      .eq("id", d.id);

    // Faz login com as credenciais recém-criadas
    const { data: finalSignIn } = await supabase.auth.signInWithPassword({ email, password });
    if (finalSignIn.user) {
      setUser({ id: d.id, name: d.name, username: d.username, role: d.role });
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(async () => {
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
