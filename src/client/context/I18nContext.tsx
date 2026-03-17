import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { Language } from "../../shared/types";
import { UI_STRINGS } from "../../shared/constants";

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  graphqlLang: "EN" | "KO";
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("sts2-lang");
    if (saved === "en" || saved === "ko") return saved;
    return navigator.language.startsWith("ko") ? "ko" : "en";
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("sts2-lang", newLang);
    document.documentElement.lang = newLang;
  }, []);

  const t = useCallback(
    (key: string): string => UI_STRINGS[lang][key] ?? key,
    [lang]
  );

  const graphqlLang = lang === "ko" ? "KO" as const : "EN" as const;

  const value = useMemo(
    () => ({ lang, setLang, t, graphqlLang }),
    [lang, setLang, t, graphqlLang]
  );

  return <I18nContext value={value}>{children}</I18nContext>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
