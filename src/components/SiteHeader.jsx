import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import BrandLogo from "./BrandLogo";
import LangSelect from "./LangSelect";
import UserMenu from "./UserMenu";
import "./GlassPanel.css";
import "./SiteHeader.css";

/**
 * Shared top bar for the public pages (landing, login, info pages).
 * The brand always goes to the landing page. When signed in, the profile
 * menu carries dashboard / settings / etc.; signed out shows login + signup.
 * `hideLogin` / `hideSignup` drop the matching button on the page that already is that.
 * `links` is an optional in-page nav (hidden on small screens).
 */
export default function SiteHeader({ hideLogin = false, hideSignup = false, sticky = false, links = [] }) {
  const { user, ready } = useAuth();
  const { lang } = useLang();

  return (
    <header className={`site-header glass glass-nav${sticky ? " site-header-sticky" : ""}`}>
      <BrandLogo className="site-header-brand" to="/welcome" />
      {links.length ? (
        <nav className="site-header-nav" aria-label={t(lang, "brand")}>
          {links.map((link) => (
            <a key={link.href} href={link.href} className="site-header-nav-link">
              {t(lang, link.labelKey)}
            </a>
          ))}
        </nav>
      ) : null}
      <div className="site-header-actions">
        <LangSelect className="site-header-lang" />
        {ready && user ? (
          <UserMenu variant="landing" />
        ) : ready ? (
          <>
            {!hideLogin ? (
              <Link to="/auth?mode=login" className="site-header-btn site-header-btn-ghost">
                {t(lang, "lpLogin")}
              </Link>
            ) : null}
            {!hideSignup ? (
              <Link to="/auth?mode=signup" className="site-header-btn site-header-btn-solid">
                {t(lang, "lpSignUp")}
              </Link>
            ) : null}
          </>
        ) : null}
      </div>
    </header>
  );
}
