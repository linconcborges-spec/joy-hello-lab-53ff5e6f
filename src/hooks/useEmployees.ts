import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { authCheckClient } from "@/integrations/supabase/authCheckClient";
import { toast } from "sonner";
import { toEmployeeEmail } from "@/lib/authUtils";
import bcrypt from "bcryptjs";

export interface Employee {
  id: string;
  name: string;
  username: string;
  role: string;
  auth_id?: string | null;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees" as any)
        .select("id, name, username, role, auth_id")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as any[]) as Employee[];
    },
  });
}

export function useAddEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employee: { name: string; username: string; password: string; role: string }) => {
      const email = toEmployeeEmail(employee.username);

      // Usa authCheckClient (persistSession: false) para não sobrescrever a sessão do admin
      // REQUER "Confirm email" desativado no Supabase Auth Dashboard
      const { data: signUpData, error: signUpError } = await authCheckClient.auth.signUp({
        email,
        password: employee.password,
      });

      if (signUpError || !signUpData.user) {
        if (signUpError?.message?.includes("already registered")) {
          throw new Error("duplicate");
        }
        throw signUpError ?? new Error("Falha ao criar usuário no Supabase Auth");
      }

      const hashedPassword = bcrypt.hashSync(employee.password, 10);

      const { data, error } = await supabase
        .from("employees" as any)
        .insert({
          name: employee.name,
          username: employee.username.toLowerCase().trim(),
          role: employee.role,
          auth_id: signUpData.user.id,
          password: hashedPassword,
        } as any)
        .select("id, name, username, role, auth_id")
        .single();

      if (error) throw error;
      return data as unknown as Employee;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Funcionário cadastrado!");
    },
    onError: (err: any) => {
      if (err?.message?.includes("duplicate") || err?.message?.includes("unique")) {
        toast.error("Esse login já existe. Escolha outro.");
      } else {
        toast.error("Erro ao cadastrar funcionário");
      }
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      auth_id,
      password,
      ...rest
    }: {
      id: string;
      auth_id?: string | null;
      name?: string;
      username?: string;
      password?: string;
      role?: string;
    }) => {
      // Monta o update: dados básicos + hash da nova senha (se fornecida)
      const updates: any = { ...rest };
      if (password?.trim()) {
        updates.password = bcrypt.hashSync(password, 10);
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("employees" as any)
          .update(updates)
          .eq("id", id);
        if (error) throw error;
      }

      // Tenta atualizar também no Supabase Auth via Edge Function (best-effort)
      if (password && auth_id) {
        const { error: fnError } = await supabase.functions.invoke("update-employee-password", {
          body: { auth_id, new_password: password },
        });
        if (fnError) console.error("[useUpdateEmployee] Edge function:", fnError.message);
        // Não joga erro: employees.password já foi atualizado como fallback
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Funcionário atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar funcionário"),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, auth_id }: { id: string; auth_id?: string | null }) => {
      // Remove o employee do banco
      const { error } = await supabase
        .from("employees" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;

      // Remove o usuário do Supabase Auth via Edge Function
      if (auth_id) {
        const { error: fnError } = await supabase.functions.invoke("delete-employee-auth-user", {
          body: { auth_id },
        });
        if (fnError) console.error("[useDeleteEmployee] Falha ao remover auth user:", fnError);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Funcionário removido!");
    },
    onError: () => toast.error("Erro ao remover funcionário"),
  });
}
