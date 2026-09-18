import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * Shared shell for the login / signup / account-setup screens:
 * glass header, tinted page, marketing panel on the left, and a
 * centred content column on the right with the copyright footer.
 *
 * `variant="setup"` top-aligns the content column, lets the page scroll for
 * the longer setup form, and swaps the small copyright line for the same
 * site footer the public pages use (on phones the bottom tab bar takes its
 * place instead).
 */
export default function AuthLayout({ hideLogin = false, hideSignup = false, variant = "form", children }) {
  const { lang } = useLang();
  const isSetup = variant === "setup";

  return (
    <div className={`login-page${isSetup ? " is-setup" : ""}`}>
      <SiteHeader hideLogin={hideLogin} hideSignup={hideSignup} sticky />
      <div className="login">
        <div className="login-left">
          <div>
            <div className="login-tag">{t(lang, "tagline")}</div>
            <AuthArt />
            <div className="login-hero">
              {t(lang, "heroTitle")
                .split(", ")
                .map((line, i, all) => (
                  <span key={line} className="login-hero-line">
                    {line}
                    {i < all.length - 1 ? "," : ""}
                  </span>
                ))}
            </div>
            <div className="login-sub">{t(lang, "heroSub")}</div>
            <div className="benefit">
              <span className="benefit-ic">1</span>
              <div>
                <strong>{t(lang, "benefit1")}</strong>
                <span>{t(lang, "benefit1s")}</span>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit-ic">2</span>
              <div>
                <strong>{t(lang, "benefit2")}</strong>
                <span>{t(lang, "benefit2s")}</span>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit-ic">3</span>
              <div>
                <strong>{t(lang, "benefit3")}</strong>
                <span>{t(lang, "benefit3s")}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="login-right">
          <div className={`login-right-main${isSetup ? " is-top" : ""}`}>{children}</div>
          {!isSetup ? (
            <div className="login-right-foot">
              <span className="login-copy">
                © {new Date().getFullYear()} {t(lang, "brand")}. {t(lang, "footRights")}
              </span>
              <Link to="/terms" className="login-privacy">
                {t(lang, "privacyPolicy")}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
      {isSetup ? <SiteFooter /> : null}
    </div>
  );
}

/* Abstract storefront + parts/alerts tiles for the green panel on the auth
   screens — fills the space the short copy leaves. Pure decoration. */
function AuthArt() {
  return (
    <div className="login-art" aria-hidden="true">
      <svg viewBox="0 0 260 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="130" cy="76" r="66" fill="rgba(255,255,255,0.06)" />
        <circle cx="130" cy="76" r="46" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
        <path d="M64 80h28M168 80h28" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeDasharray="3 4" />
        <rect x="92" y="38" width="76" height="76" rx="20" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.32)" />
        <g transform="translate(106 52) scale(2)" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9V7l1.5-3h13L20 7v2a2.5 2.5 0 0 1-4.5 1.5A2.5 2.5 0 0 1 12 11a2.5 2.5 0 0 1-3.5-.5A2.5 2.5 0 0 1 4 9z" />
          <path d="M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
          <path d="M10 20v-5h4v5" />
        </g>
        <rect x="20" y="58" width="44" height="44" rx="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.24)" />
        <g transform="translate(29 67) scale(1.083)" stroke="#d7efe5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
        </g>
        <rect x="196" y="58" width="44" height="44" rx="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.24)" />
        <g transform="translate(205 67) scale(1.083)" stroke="#d7efe5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </g>
        <circle cx="70" cy="28" r="4" fill="#2bbc8a" opacity="0.75" />
        <circle cx="196" cy="126" r="5" fill="#2bbc8a" opacity="0.6" />
        <circle cx="48" cy="126" r="3" fill="rgba(255,255,255,0.5)" />
        <circle cx="222" cy="30" r="3" fill="rgba(255,255,255,0.4)" />
      </svg>
    </div>
  );
}
