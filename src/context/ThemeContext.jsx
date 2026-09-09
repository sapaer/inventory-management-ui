import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const KEY = "pn_theme"; // "light" | "dark" — absence means follow the system

/** Read the stored choice; null when the user hasn't picked one. */
function stored() {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function systemDark() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}

/** Resolve to the concrete theme currently in effect. */
function resolve() {
  return stored() || (systemDark() ? "dark" : "light");
}

function apply(theme) {
  const el = document.documentElement;
  el.setAttribute("data-theme", theme);
  el.style.colorScheme = theme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolve);

  // Keep following the system until the user makes an explicit choice.
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!stored()) setTheme(mq.matches ? "dark" : "light");
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  const toggle = () => {
    setTheme((cur) => {
      const next = cur === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const value = useMemo(() => ({ theme, toggle }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
