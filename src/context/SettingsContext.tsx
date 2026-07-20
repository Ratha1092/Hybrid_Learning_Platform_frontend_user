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
    // Brand color is fixed blue — ignore any admin-stored purple/violet value.
    document.documentElement.style.setProperty("--color-primary",   "#2563eb");
    document.documentElement.style.setProperty("--color-secondary", "#3b82f6");
  }, []);

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
