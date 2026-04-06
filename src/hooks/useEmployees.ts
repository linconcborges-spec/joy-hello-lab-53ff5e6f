import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import bcrypt from "bcryptjs";

export interface Employee {
  id: string;
  name: string;
  username: string;
  password: string;
  role: string;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees" as any)
        .select("id, name, username, password, role")
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
      // Criptografar senha antes de salvar
      const hashedPassword = bcrypt.hashSync(employee.password, 10);
      
      const { data, error } = await supabase
        .from("employees" as any)
        .insert({ ...employee, password: hashedPassword } as any)
        .select("id, name, username, password, role")
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
    mutationFn: async ({ id, ...data }: { id: string; name?: string; username?: string; password?: string; role?: string }) => {
      const updateData: any = { ...data };
      
      // Se tiver senha, criptografar
      if (updateData.password) {
        updateData.password = bcrypt.hashSync(updateData.password, 10);
      }

      const { error } = await supabase
        .from("employees" as any)
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Funcionário removido!");
    },
    onError: () => toast.error("Erro ao remover funcionário"),
  });
}
