import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export interface AppSettings {
  storeName: string;
  defaultDeliveryFee: number;
  printPaperWidth: string;
  printMarginTop: string;
  printMargin: string;
  printFontSize: string;
  targetPrinter: string;
  theme: "light" | "dark";
  logoUrl: string;
  bannerUrl: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  storeName: "Império Chiclets",
  defaultDeliveryFee: 0,
  printPaperWidth: "80mm",
  printMarginTop: "0mm",
  printMargin: "0px",
  printFontSize: "14px",
  targetPrinter: "",
  theme: "light",
  logoUrl: "",
  bannerUrl: "",
};

const KEY_MAP: Record<string, keyof AppSettings> = {
  store_name: "storeName",
  default_delivery_fee: "defaultDeliveryFee",
  print_paper_width: "printPaperWidth",
  print_margin_top: "printMarginTop",
  print_margin: "printMargin",
  print_font_size: "printFontSize",
  target_printer: "targetPrinter",
  theme: "theme",
  logo_url: "logoUrl",
  banner_url: "bannerUrl",
};

const REVERSE_KEY_MAP: Record<keyof AppSettings, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
) as Record<keyof AppSettings, string>;

function parseSettings(rows: { key: string; value: string }[]): AppSettings {
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const field = KEY_MAP[row.key];
    if (!field) continue;
    if (field === "defaultDeliveryFee") {
      settings[field] = parseFloat(row.value) || 0;
    } else {
      (settings as any)[field] = row.value;
    }
  }
  return settings;
}

export function useSettings() {
  const qc = useQueryClient();

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value");
      if (error) throw error;
      return parseSettings((data as any[]) || []);
    },
  });

  const mutation = useMutation({
    mutationFn: async (partial: Partial<AppSettings>) => {
      const upserts = Object.entries(partial).map(([field, val]) => ({
        key: REVERSE_KEY_MAP[field as keyof AppSettings],
        value: String(val),
      }));
      for (const row of upserts) {
        const { error } = await supabase
          .from("settings")
          .upsert({ key: row.key, value: row.value }, { onConflict: 'key' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const updateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      // Optimistic local update
      qc.setQueryData(["settings"], (old: AppSettings | undefined) => ({
        ...(old || DEFAULT_SETTINGS),
        ...partial,
      }));
      mutation.mutate(partial);
    },
    [qc, mutation]
  );

  return { settings, updateSettings, isLoading };
}
