const LANG_KEY = "pn_lang";
const SUPPORTED = ["en", "hi"];

export function getInitialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "hi") return "hi";
  } catch {
    /* private mode */
  }
  return "en";
}

function expireCookie(name, extra = "") {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;${extra}`;
}

function clearGoogTrans() {
  const host = window.location.hostname;
  const extras = [""];
  if (host) extras.push(`domain=${host}`);
  if (host && host.includes(".")) extras.push(`domain=.${host}`);
  extras.forEach((extra) => expireCookie("googtrans", extra));
}

export function persistLang(lang) {
  const next = SUPPORTED.includes(lang) ? lang : "en";
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    /* private mode */
  }
  document.documentElement.lang = next;
  if (next === "hi") {
    document.cookie = "googtrans=/en/hi;path=/;max-age=31536000";
  } else {
    clearGoogTrans();
  }
  return next;
}

function fireCombo(value) {
  const combo = document.querySelector(".goog-te-combo");
  if (!combo) return false;
  combo.value = value;
  combo.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function isGoogleTranslated() {
  const html = document.documentElement;
  return html.classList.contains("translated-ltr") || html.classList.contains("translated-rtl");
}

function applyHindi(attempt = 0) {
  const combo = document.querySelector(".goog-te-combo");
  if (!combo) {
    if (attempt < 40) setTimeout(() => applyHindi(attempt + 1), 150);
    return;
  }
  if (combo.value === "hi") {
    fireCombo("en");
    setTimeout(() => fireCombo("hi"), 180);
    return;
  }
  fireCombo("hi");
}

let scriptLoading = false;

function loadGoogleTranslator() {
  if (document.getElementById("google_translate_element")) {
    applyHindi();
    return;
  }

  const host = document.createElement("div");
  host.id = "google_translate_element";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);

  if (window.google?.translate) {
    window.googleTranslateElementInit?.();
    applyHindi();
    return;
  }
  if (scriptLoading) return;
  scriptLoading = true;

  window.googleTranslateElementInit = () => {
    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: "en,hi",
        autoDisplay: false,
      },
      "google_translate_element"
    );
    setTimeout(() => applyHindi(), 300);
  };

  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

export function applyGoogleLang(lang) {
  const next = persistLang(lang === "hi" ? "hi" : "en");

  if (next === "hi") {
    loadGoogleTranslator();
    return;
  }

  clearGoogTrans();
  if (isGoogleTranslated()) {
    window.location.reload();
  }
}

/** Load Google only when Hindi is the saved language. English stays original copy. */
export function ensurePageTranslator() {
  if (getInitialLang() === "hi") {
    loadGoogleTranslator();
    return;
  }
  clearGoogTrans();
  if (isGoogleTranslated()) window.location.reload();
}
