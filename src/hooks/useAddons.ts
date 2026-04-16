import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Addon {
  id: string;
  code: number;
  name: string;
  price: number;
  category_id?: string | null; // kept for backwards compat
  category_ids?: string[];     // new: multiple categories
}

export function useAddons() {
  return useQuery({
    queryKey: ["addons"],
    queryFn: async () => {
      const { data: addons, error } = await supabase
        .from("addons")
        .select("id, code, name, price, category_id")
        .order("code", { ascending: true });
      if (error) throw error;

      // Fetch multi-category associations (graceful fallback if table doesn't exist)
      const { data: addonCategories } = await supabase
        .from("addon_categories")
        .select("addon_id, category_id");

      // Build a map: addon_id -> category_ids[]
      const acMap: Record<string, string[]> = {};
      (addonCategories ?? []).forEach((ac: any) => {
        if (!acMap[ac.addon_id]) acMap[ac.addon_id] = [];
        acMap[ac.addon_id].push(ac.category_id);
      });

      return (addons ?? []).map((a: any) => ({
        ...a,
        // Use junction table if available, otherwise fall back to single category_id
        category_ids: acMap[a.id] ?? (a.category_id ? [a.category_id] : []),
      })) as Addon[];
    },
  });
}

export function useAddAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addon: {
      name: string;
      price: number;
      category_id?: string | null;
      category_ids?: string[];
    }) => {
      const { category_ids, ...rest } = addon;
      // Also save the first category_id for backwards compatibility
      const legacyCategoryId = (category_ids && category_ids.length > 0) ? category_ids[0] : (rest.category_id ?? null);
      const { data, error } = await supabase
        .from("addons")
        .insert({ ...rest, category_id: legacyCategoryId })
        .select("id, code, name, price, category_id")
        .single();
      if (error) throw error;

      // Insert into junction table (graceful fallback if table doesn't exist yet)
      const ids = category_ids ?? (rest.category_id ? [rest.category_id] : []);
      if (ids.length > 0) {
        try {
          await supabase.from("addon_categories").insert(
            ids.map((cid) => ({ addon_id: data.id, category_id: cid }))
          );
        } catch (_) {
          // Table doesn't exist yet — ignore, single category_id already saved above
        }
      }
      return data as Addon;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addons"] });
      toast.success("Adicional cadastrado!");
    },
    onError: (error: any) => {
      console.error("Erro ao cadastrar:", error);
      toast.error(error.message || "Erro ao cadastrar adicional");
    },
  });
}

export function useUpdateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      category_ids,
      ...data
    }: {
      id: string;
      name: string;
      price: number;
      category_id?: string | null;
      category_ids?: string[];
    }) => {
      // Save legacy category_id for backwards compat (use first category or null)
      const legacyCategoryId = (category_ids && category_ids.length > 0) ? category_ids[0] : (data.category_id ?? null);
      const { error } = await supabase.from("addons").update({ ...data, category_id: legacyCategoryId }).eq("id", id);
      if (error) throw error;

      // Update junction table if category_ids was provided (graceful fallback)
      if (category_ids !== undefined) {
        try {
          await supabase.from("addon_categories").delete().eq("addon_id", id);
          if (category_ids.length > 0) {
            await supabase.from("addon_categories").insert(
              category_ids.map((cid) => ({ addon_id: id, category_id: cid }))
            );
          }
        } catch (_) {
          // Table doesn't exist yet — ignore, legacy category_id already saved above
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addons"] });
      toast.success("Adicional atualizado!");
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar:", error);
      toast.error(error.message || "Erro ao atualizar adicional");
    },
  });
}

export function useDeleteAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Clean junction table first (graceful fallback)
      try {
        await supabase.from("addon_categories").delete().eq("addon_id", id);
      } catch (_) { /* Table doesn't exist yet */ }
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
