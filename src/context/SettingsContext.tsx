import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { settingsService, type PublicSettings } from "../services/settingsService";

interface SettingsContextValue {
  settings: PublicSettings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService
      .getPublic()
      .then(({ data }) => setSettings(data.data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Swap the favicon at runtime once the admin-configured one is known.
  useEffect(() => {
    if (!settings.site_favicon) return;
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (link) link.href = settings.site_favicon;
  }, [settings.site_favicon]);
  
  useEffect(() => {
    const root = document.documentElement;
    if (settings.primary_color) root.style.setProperty("--color-primary", settings.primary_color);
    if (settings.secondary_color) root.style.setProperty("--color-secondary", settings.secondary_color);
  }, [settings.primary_color, settings.secondary_color]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
