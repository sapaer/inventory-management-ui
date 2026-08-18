const SUPPORTED = ["en", "hi"];

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

  if (reload) {
    window.location.reload();
    return;
  }

  const trySetCombo = (attempt = 0) => {
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      if (combo.value !== next) {
        combo.value = next;
        combo.dispatchEvent(new Event("change"));
      }
      return;
    }
    if (attempt < 20) {
      setTimeout(() => trySetCombo(attempt + 1), 200);
    }
  };

  trySetCombo();
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
      // Wait a tick for the combo to mount
      setTimeout(() => applyPageLanguage(preferred), 400);
    }
  };

  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}
