import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Addon {
  id: string;
  code: number;
  name: string;
  price: number;
  category_id?: string | null;
}

export function useAddons() {
  return useQuery({
    queryKey: ["addons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addons")
        .select("id, code, name, price, category_id")
        .order("code", { ascending: true });
      if (error) throw error;
      return data as Addon[];
    },
  });
}

export function useAddAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addon: { name: string; price: number; category_id?: string | null }) => {
      const { data, error } = await supabase
        .from("addons")
        .insert(addon)
        .select("id, code, name, price, category_id")
        .single();
      if (error) throw error;
      return data as Addon;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addons"] });
      toast.success("Adicional cadastrado!");
    },
    onError: () => toast.error("Erro ao cadastrar adicional"),
  });
}

export function useUpdateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; price: number; category_id?: string | null }) => {
      const { error } = await supabase.from("addons").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addons"] });
      toast.success("Adicional atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar adicional"),
  });
}

export function useDeleteAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addons"] });
      toast.success("Adicional removido!");
    },
    onError: () => toast.error("Erro ao remover adicional"),
  });
}
