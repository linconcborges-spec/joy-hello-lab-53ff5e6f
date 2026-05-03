import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCachedData, setCachedData } from "@/lib/offlineStorage";

export interface Customer {
  id: string;
  name: string;
  addresses: string[];
  phone: string;
}

/**
 * Normaliza o telefone para busca e salvamento:
 * 1. Remove tudo que não é número
 * 2. Se começar com 55 e tiver mais de 11 dígitos total, remove o 55
 *    (útil se o usuário colar +55 11 99999-9999)
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 10) {
    return digits.substring(2);
  }
  return digits;
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, name, addresses, phone")
          .order("name", { ascending: true });
        if (error) throw error;
        const result = data as unknown as Customer[];
        // Salva no cache local para uso offline
        setCachedData('customers', result);
        return result;
      } catch (err) {
        // Offline: retorna cache local se disponível
        const cached = getCachedData<Customer[]>('customers');
        if (cached) return cached;
        throw err;
      }
    },
  });
}

export function useAddCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: { name: string; addresses: string[]; phone: string }) => {
      const normalizedPhone = normalizePhone(customer.phone);
      const { data, error } = await supabase
        .from("customers")
        .insert({
          ...customer,
          phone: normalizedPhone
        })
        .select("id, name, addresses, phone")
        .single();
      if (error) throw error;
      return data as unknown as Customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente cadastrado!");
    },
    onError: () => toast.error("Erro ao cadastrar cliente. Verifique se o telefone já existe."),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...customer }: { id: string; name: string; addresses: string[]; phone: string }) => {
      const normalizedPhone = normalizePhone(customer.phone);
      const { error } = await supabase
        .from("customers")
        .update({
          ...customer,
          phone: normalizedPhone
        })
        .eq("id", id);
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
