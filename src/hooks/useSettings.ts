import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect } from "react";
import { getCachedData, setCachedData } from "@/lib/offlineStorage";

export interface BusinessHours {
  open: string;  // "HH:MM"
  close: string; // "HH:MM"
  enabled: boolean;
}

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
  // Digital Menu settings
  menuOpen: boolean;
  storeAddress: string;
  storePhone: string;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;
  businessHours: BusinessHours[];
  autoPrint: boolean;
  outOfStockProducts: string[];
  publicUrl: string;
}

const DEFAULT_BUSINESS_HOURS: BusinessHours[] = [
  { open: "08:00", close: "22:00", enabled: true },  // Dom
  { open: "08:00", close: "22:00", enabled: true },  // Seg
  { open: "08:00", close: "22:00", enabled: true },  // Ter
  { open: "08:00", close: "22:00", enabled: true },  // Qua
  { open: "08:00", close: "22:00", enabled: true },  // Qui
  { open: "08:00", close: "22:00", enabled: true },  // Sex
  { open: "08:00", close: "22:00", enabled: true },  // Sab
];

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
  menuOpen: true,
  storeAddress: "",
  storePhone: "",
  deliveryTimeMin: 30,
  deliveryTimeMax: 50,
  instagramUrl: "",
  facebookUrl: "",
  whatsappNumber: "",
  businessHours: DEFAULT_BUSINESS_HOURS,
  autoPrint: false,
  outOfStockProducts: [],
  publicUrl: "",
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
  menu_open: "menuOpen",
  store_address: "storeAddress",
  store_phone: "storePhone",
  delivery_time_min: "deliveryTimeMin",
  delivery_time_max: "deliveryTimeMax",
  instagram_url: "instagramUrl",
  facebook_url: "facebookUrl",
  whatsapp_number: "whatsappNumber",
  business_hours: "businessHours",
  auto_print: "autoPrint",
  out_of_stock_products: "outOfStockProducts",
  public_url: "publicUrl",
};

const REVERSE_KEY_MAP: Record<keyof AppSettings, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
) as Record<keyof AppSettings, string>;

function parseSettings(rows: { key: string; value: string }[]): AppSettings {
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const field = KEY_MAP[row.key];
    if (!field) continue;
    if (field === "defaultDeliveryFee" || field === "deliveryTimeMin" || field === "deliveryTimeMax") {
      (settings as any)[field] = parseFloat(row.value) || 0;
    } else if (field === "menuOpen" || field === "autoPrint") {
      (settings as any)[field] = row.value === "true";
    } else if (field === "businessHours") {
      try {
        (settings as any)[field] = JSON.parse(row.value);
      } catch {
        (settings as any)[field] = DEFAULT_BUSINESS_HOURS;
      }
    } else if (field === "outOfStockProducts") {
      try {
        (settings as any)[field] = JSON.parse(row.value);
      } catch {
        (settings as any)[field] = [];
      }
    } else {
      (settings as any)[field] = row.value;
    }
  }
  return settings;
}

/**
 * Verifica se a loja deve estar aberta agora com base nos horários configurados
 */
export function isWithinBusinessHours(hours: BusinessHours[]): boolean {
  if (!hours || hours.length !== 7) return true;

  const now = new Date();
  const day = now.getDay(); // 0 = Domingo, 1 = Segunda, ...
  const today = hours[day];

  if (!today || !today.enabled) return false;

  const [h, m] = [now.getHours(), now.getMinutes()];
  const currentMinutes = h * 60 + m;

  const [openH, openM] = today.open.split(':').map(Number);
  const [closeH, closeM] = today.close.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = (closeH * 60 + closeM) || (23 * 60 + 59);

  if (closeMinutes < openMinutes) {
    // Caso o horário passe da meia-noite (ex: 18:00 às 02:00)
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

export function useSettings() {
  const qc = useQueryClient();

  useEffect(() => {
    // Usando um nome de canal único por instância para evitar erros de "already subscribed"
    const channelId = `settings-changes-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => {
          qc.invalidateQueries({ queryKey: ["settings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("key, value");
        if (error) throw error;
        const result = parseSettings((data as any[]) || []);
        // Salva no cache local para uso offline
        setCachedData('settings', result);
        return result;
      } catch (err) {
        // Offline: retorna cache local se disponível
        const cached = getCachedData<AppSettings>('settings');
        if (cached) return cached;
        throw err;
      }
    },
  });

  const mutation = useMutation({
    mutationFn: async (partial: Partial<AppSettings>) => {
      const upserts = Object.entries(partial).map(([field, val]) => ({
        key: REVERSE_KEY_MAP[field as keyof AppSettings],
        value: typeof val === "object" ? JSON.stringify(val) : String(val),
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

  const isCurrentlyOpen = settings.menuOpen && isWithinBusinessHours(settings.businessHours);

  return { settings, updateSettings, isLoading, isCurrentlyOpen };
}
