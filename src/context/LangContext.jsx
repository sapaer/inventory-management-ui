import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { applyGoogleLang, ensurePageTranslator, getInitialLang, persistLang } from "../pageTranslate";

const LangContext = createContext(null);

function LangRouteSync() {
  const { lang } = useLang();
  const loc = useLocation();

  useEffect(() => {
    if (lang !== "hi") return undefined;
    const id = setTimeout(() => applyGoogleLang("hi"), 200);
    return () => clearTimeout(id);
  }, [lang, loc.pathname]);

  return null;
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  useEffect(() => {
    persistLang(lang);
    ensurePageTranslator();
  }, []);

  const setLang = (next) => {
    const value = persistLang(next === "hi" ? "hi" : "en");
    setLangState(value);
    applyGoogleLang(value);
  };

  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return (
    <LangContext.Provider value={value}>
      <LangRouteSync />
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
