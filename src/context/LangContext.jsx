import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import Loader from "../components/Loader";
import {
  applyPageLanguage,
  ensurePageTranslator,
  getInitialLang,
  isTranslatePending,
  showTranslateLoader,
  TRANSLATE_EVENT,
} from "../pageTranslate";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);
  const [translating, setTranslating] = useState(isTranslatePending);

  useLayoutEffect(() => {
    document.getElementById("pn-translate-bootstrap")?.remove();
  }, []);

  useEffect(() => {
    function onTranslate(e) {
      setTranslating(Boolean(e.detail?.pending));
    }
    window.addEventListener(TRANSLATE_EVENT, onTranslate);
    return () => window.removeEventListener(TRANSLATE_EVENT, onTranslate);
  }, []);

  useEffect(() => {
    ensurePageTranslator();
    applyPageLanguage(lang);
  }, [lang]);

  const setLang = (next, { reload = false } = {}) => {
    const value = next === "hi" ? "hi" : "en";
    if (value === lang && !reload) return;
    const shouldReload = reload || value === "hi";
    if (shouldReload) showTranslateLoader(value);
    applyPageLanguage(value, { reload: shouldReload });
    if (!shouldReload) {
      setLangState(value);
    }
  };

  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return (
    <LangContext.Provider value={value}>
      {translating ? <Loader variant="overlay" noTranslate /> : null}
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
