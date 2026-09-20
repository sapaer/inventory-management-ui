import { useState } from "react";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import "./PageHero.css";

/** Page header in the site's style: mint panel, green icon tile, small label and serif title. */
export function PageHero({ icon, kicker, title }) {
  return (
    <header className="page-hero">
      <span className="page-hero-tile" aria-hidden="true">
        {icon}
      </span>
      <div className="page-hero-txt">
        {kicker ? <p className="page-hero-kicker">{kicker}</p> : null}
        <h1 className="page-hero-title">{title}</h1>
      </div>
    </header>
  );
}

/** Dismissible help note under a page header; once closed it stays closed (per `id`, per browser). */
export function InfoNote({ id, children }) {
  const { lang } = useLang();
  const key = `pn_note_${id}`;
  const [shown, setShown] = useState(() => {
    try {
      return localStorage.getItem(key) !== "hidden";
    } catch {
      return true;
    }
  });
  if (!shown) return null;

  function dismiss() {
    setShown(false);
    try {
      localStorage.setItem(key, "hidden");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="info-note" role="note">
      <span className="info-note-ic" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 11v5.5M12 7.6h.01" />
        </svg>
      </span>
      <p>{children}</p>
      <button type="button" className="info-note-x" aria-label={t(lang, "suDismiss")} onClick={dismiss}>
        ×
      </button>
    </div>
  );
}
