import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Customer {
  id: string;
  code: number;
  name: string;
  address: string;
  phone: string;
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, code, name, address, phone")
        .order("code", { ascending: true });
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useAddCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: { name: string; address: string; phone: string }) => {
      const { data, error } = await supabase
        .from("customers")
        .insert(customer)
        .select("id, code, name, address, phone")
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente cadastrado!");
    },
    onError: () => toast.error("Erro ao cadastrar cliente"),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; address: string; phone: string }) => {
      const { error } = await supabase.from("customers").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar cliente"),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente removido!");
    },
    onError: () => toast.error("Erro ao remover cliente"),
  });
}
