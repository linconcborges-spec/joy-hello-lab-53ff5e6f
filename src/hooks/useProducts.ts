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
  category_id?: string | null; // kept for backwards compat
  category_ids?: string[]; // new: multiple categories
  sort_order: number;
  is_visible: boolean;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from("products")
        .select("*, product_categories(category_id)")
        .order("code", { ascending: true });
      if (error) throw error;

      return (products ?? []).map((p: any) => ({
        ...p,
        category_ids: (p.product_categories ?? []).map((pc: any) => pc.category_id),
      })) as Product[];
    },
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      code: number;
      name: string;
      price: number;
      description?: string | null;
      image_url?: string | null;
      category_id?: string | null;
      category_ids?: string[];
      sort_order?: number;
      is_visible?: boolean;
    }) => {
      const { category_ids, ...rest } = product;
      const { data, error } = await supabase
        .from("products")
        .insert(rest)
        .select("*")
        .single();
      if (error) throw error;

      // Insert into junction table
      const ids = category_ids ?? (rest.category_id ? [rest.category_id] : []);
      if (ids.length > 0) {
        await supabase.from("product_categories").insert(
          ids.map((cid) => ({ product_id: data.id, category_id: cid }))
        );
      }
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
    mutationFn: async ({
      id,
      category_ids,
      ...data
    }: {
      id: string;
      name?: string;
      price?: number;
      description?: string | null;
      image_url?: string | null;
      category_id?: string | null;
      category_ids?: string[];
      sort_order?: number;
      is_visible?: boolean;
    }) => {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) throw error;

      // Update junction table if category_ids was provided
      if (category_ids !== undefined) {
        await supabase.from("product_categories").delete().eq("product_id", id);
        if (category_ids.length > 0) {
          await supabase.from("product_categories").insert(
            category_ids.map((cid) => ({ product_id: id, category_id: cid }))
          );
        }
      }
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
