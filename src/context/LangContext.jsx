import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyPageLanguage, ensurePageTranslator, getInitialLang } from "../pageTranslate";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  useEffect(() => {
    ensurePageTranslator();
    applyPageLanguage(lang);
  }, [lang]);

  const setLang = (next, { reload = false } = {}) => {
    const value = next === "hi" ? "hi" : "en";
    if (value === lang && !reload) return;
    applyPageLanguage(value, { reload: reload || value === "hi" });
    if (!(reload || value === "hi")) {
      setLangState(value);
    }
  };

  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
