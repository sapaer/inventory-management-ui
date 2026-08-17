import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyPageLanguage, ensurePageTranslator, getInitialLang } from "../pageTranslate";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  useEffect(() => {
    ensurePageTranslator();
    applyPageLanguage(lang);
  }, [lang]);

  const setLang = (next) => {
    setLangState(next);
    applyPageLanguage(next);
  };

  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
