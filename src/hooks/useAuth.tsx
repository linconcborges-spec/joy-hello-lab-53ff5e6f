import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const SESSION_KEY = "imperio-auth-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sessão do sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("employees" as any)
      .select("id, name, username, role, password")
      .eq("username", username)
      .single();

    if (error || !data) {
      return false;
    }

    const dbPassword = (data as any).password;
    
    try {
      // Aceita vários prefixos comuns de bcrypt ($2a$, $2b$, $2y$)
      const isHash = dbPassword && /^\$2[ayb]\$/.test(dbPassword);
      
      if (isHash) {
        const isMatch = bcrypt.compareSync(password, dbPassword);
        if (!isMatch) return false;
      } else {
        // Fallback para texto plano
        if (dbPassword !== password) return false;
        
        // Migrar para hash automaticamente
        const newHash = bcrypt.hashSync(password, 10);
        await supabase.from("employees" as any).update({ password: newHash }).eq("id", (data as any).id);
      }
    } catch (e) {
      return false;
    }

    const authUser: AuthUser = {
      id: (data as any).id,
      name: (data as any).name,
      username: (data as any).username,
      role: (data as any).role,
    };

    setUser(authUser);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
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
