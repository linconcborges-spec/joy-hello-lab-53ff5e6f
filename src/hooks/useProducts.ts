import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  code: number;
  name: string;
  price: number;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, price")
        .order("code", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
  });
}
