import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import BrandLogo from "./BrandLogo";
import LangSelect from "./LangSelect";
import UserMenu from "./UserMenu";
import "./SiteHeader.css";

/**
 * Shared top bar for the public pages (landing, login, info pages).
 * The brand always goes to the landing page. When signed in, the profile
 * menu carries dashboard / settings / etc.; signed out shows login + signup.
 * `hideLogin` / `hideSignup` drop the matching button on the page that already is that.
 */
export default function SiteHeader({ hideLogin = false, hideSignup = false, sticky = false }) {
  const { user, ready } = useAuth();
  const { lang } = useLang();

  return (
    <header className={`site-header${sticky ? " site-header-sticky" : ""}`}>
      <BrandLogo className="site-header-brand" to="/welcome" />
      <div className="site-header-actions">
        <LangSelect className="site-header-lang" />
        {ready && user ? (
          <UserMenu variant="landing" />
        ) : ready ? (
          <>
            {!hideLogin ? (
              <Link to="/auth?mode=login" className="site-header-link">
                {t(lang, "lpLogin")}
              </Link>
            ) : null}
            {!hideSignup ? (
              <Link to="/auth?mode=signup" className="site-header-cta">
                {t(lang, "lpSignUp")}
              </Link>
            ) : null}
          </>
        ) : null}
      </div>
    </header>
  );
}
