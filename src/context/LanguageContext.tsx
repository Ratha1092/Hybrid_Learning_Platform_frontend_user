import { createContext, useContext, useState } from "react";
import en from "../Language/i18n/en.json";
import kh from "../Language/i18n/kh.json";

const translations = { en, kh };

type Lang = "en" | "kh";

type LanguageContextType = {
  lang: Lang;
  t: (key: string) => string;
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "kh",
  t: () => "",
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem("lang") as Lang) ?? "en"
  );

  const toggleLang = () => {
    const next = lang === "kh" ? "en" : "kh";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let result: any = translations[lang];
    for (const k of keys) result = result?.[k];
    return result ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
