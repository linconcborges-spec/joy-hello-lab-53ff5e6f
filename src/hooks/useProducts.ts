import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Product {
  id: string;
  code: number;
  name: string;
  price: number;
  description?: string | null;
  image_url?: string | null;
  category_id?: string | null;
  sort_order: number;
  is_visible: boolean;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: { code: number; name: string; price: number; description?: string | null; image_url?: string | null; category_id?: string | null; sort_order?: number; is_visible?: boolean }) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select("*")
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto cadastrado!");
    },
    onError: (error: any) => {
      console.error("Erro ao cadastrar:", error);
      toast.error(error.message || "Erro ao cadastrar produto");
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; price?: number; description?: string | null; image_url?: string | null; category_id?: string | null; sort_order?: number; is_visible?: boolean }) => {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado!");
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar:", error);
      toast.error(error.message || "Erro ao atualizar produto");
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto removido!");
    },
    onError: () => toast.error("Erro ao remover produto"),
  });
}
