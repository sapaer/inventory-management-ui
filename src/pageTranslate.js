const SUPPORTED = ["en", "hi"];
const PENDING_KEY = "pn_lang_pending";
export const TRANSLATE_EVENT = "pn:translate";

function emitTranslatePending(pending, lang) {
  window.dispatchEvent(new CustomEvent(TRANSLATE_EVENT, { detail: { pending, lang } }));
}

export function isTranslatePending() {
  try {
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (pending === "hi" || pending === "en") return true;
    return localStorage.getItem("pn_lang") === "hi";
  } catch {
    return false;
  }
}

export function detectBrowserLang() {
  const candidates = [...(navigator.languages || []), navigator.language || ""];
  for (const raw of candidates) {
    const code = String(raw).toLowerCase().split("-")[0];
    if (SUPPORTED.includes(code)) return code;
  }
  return "en";
}

export function getInitialLang() {
  const saved = localStorage.getItem("pn_lang");
  if (SUPPORTED.includes(saved)) return saved;
  return detectBrowserLang();
}

function setCookie(name, value) {
  document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * 365}`;
}

function clearCookie(name) {
  document.cookie = `${name}=;path=/;max-age=0`;
  const host = window.location.hostname;
  if (host && host.includes(".")) {
    document.cookie = `${name}=;path=/;domain=.${host};max-age=0`;
  }
}

export function showTranslateLoader(lang = "hi") {
  try {
    sessionStorage.setItem(PENDING_KEY, lang);
  } catch {
    /* private mode */
  }
  document.documentElement.classList.add("pn-translate-pending");
  emitTranslatePending(true, lang);
}

export function hideTranslateLoader() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* private mode */
  }
  document.documentElement.classList.remove("pn-translate-pending");
  emitTranslatePending(false);
}

function htmlIsTranslated() {
  const cls = document.documentElement.className || "";
  return /\btranslated-(ltr|rtl)\b/.test(cls);
}

function languageIsApplied(lang) {
  if (lang === "en") return !htmlIsTranslated();
  if (htmlIsTranslated()) return true;
  const combo = document.querySelector(".goog-te-combo");
  return combo?.value === lang && document.body.querySelectorAll("font").length > 0;
}

function waitUntilLanguageApplied(lang, { timeoutMs = 12000 } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      setTimeout(resolve, 180);
    };

    if (languageIsApplied(lang)) {
      finish();
      return;
    }

    const observer = new MutationObserver(() => {
      if (languageIsApplied(lang)) finish();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(finish, timeoutMs);
  });
}

function driveTranslatorCombo(next) {
  const trySetCombo = (attempt = 0) => {
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      if (combo.value !== next) {
        combo.value = next;
        combo.dispatchEvent(new Event("change"));
      }
      waitUntilLanguageApplied(next).then(hideTranslateLoader);
      return;
    }
    if (attempt < 25) {
      setTimeout(() => trySetCombo(attempt + 1), 200);
      return;
    }
    waitUntilLanguageApplied(next).then(hideTranslateLoader);
  };
  trySetCombo();
}

/** Drive Google Website Translator without maintaining per-language string maps. */
export function applyPageLanguage(lang, { reload = false } = {}) {
  const next = SUPPORTED.includes(lang) ? lang : "en";
  localStorage.setItem("pn_lang", next);
  document.documentElement.lang = next;

  if (next === "en") {
    clearCookie("googtrans");
    setCookie("googtrans", "/en/en");
  } else {
    setCookie("googtrans", `/en/${next}`);
  }

  if (reload || (next === "hi" && !languageIsApplied(next))) {
    showTranslateLoader(next);
  }

  if (reload) {
    window.location.reload();
    return;
  }

  if (next === "en" && !htmlIsTranslated()) {
    hideTranslateLoader();
    return;
  }

  driveTranslatorCombo(next);
}

let scriptLoading = false;

export function ensurePageTranslator() {
  if (document.getElementById("google_translate_element")) return;
  const host = document.createElement("div");
  host.id = "google_translate_element";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);

  if (scriptLoading || window.google?.translate) return;
  scriptLoading = true;

  window.googleTranslateElementInit = () => {
    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: SUPPORTED.join(","),
        autoDisplay: false,
      },
      "google_translate_element"
    );
    const preferred = getInitialLang();
    if (preferred !== "en") {
      setTimeout(() => applyPageLanguage(preferred), 400);
    } else {
      hideTranslateLoader();
    }
  };

  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.onerror = () => hideTranslateLoader();
  document.body.appendChild(script);
}
