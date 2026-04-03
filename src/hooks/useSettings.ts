import { useState, useEffect, useCallback } from "react";

const SETTINGS_KEY = "imperio-settings";

export interface AppSettings {
  storeName: string;
  defaultDeliveryFee: number;
  printPaperWidth: string;
  printMargin: string;
  printFontSize: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  storeName: "Império Chiclets",
  defaultDeliveryFee: 0,
  printPaperWidth: "80mm",
  printMargin: "0px",
  printFontSize: "14px",
};

function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  return { settings, updateSettings };
}
