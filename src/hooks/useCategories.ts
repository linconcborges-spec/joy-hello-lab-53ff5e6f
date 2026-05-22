import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true });
      if (error) {
        // sort_order pode não existir ainda — tenta sem a coluna
        const { data: fallback, error: err2 } = await supabase
          .from("categories")
          .select("id, name");
        if (err2) throw err2;
        return ((fallback ?? []) as any[]).map(c => ({ ...c, sort_order: 0 })) as Category[];
      }
      return (data ?? []) as Category[];
    },
  });
}

export function useAddCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (category: { name: string; sort_order?: number }) => {
      const { data, error } = await supabase
        .from("categories")
        .insert(category)
        .select("id, name, sort_order")
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria cadastrada!");
    },
    onError: () => toast.error("Erro ao cadastrar categoria"),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; sort_order?: number }) => {
      const { error } = await supabase.from("categories").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria removida!");
    },
    onError: () => toast.error("Erro ao remover categoria"),
  });
}
