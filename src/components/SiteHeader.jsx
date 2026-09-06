import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { needsShopSetup } from "../utils";
import BrandLogo from "./BrandLogo";
import LangSelect from "./LangSelect";
import UserMenu from "./UserMenu";
import "./SiteHeader.css";

/**
 * Shared top bar for the public pages (landing, login, info pages).
 * Brand on the left; language switch plus context buttons on the right.
 * `hideLogin` / `hideSignup` drop the matching button on the page that already is that.
 */
export default function SiteHeader({ hideLogin = false, hideSignup = false, sticky = false }) {
  const { user, ready } = useAuth();
  const { lang } = useLang();
  const homeTo = user && needsShopSetup(user) ? "/setup" : user ? "/dashboard" : "/welcome";

  return (
    <header className={`site-header${sticky ? " site-header-sticky" : ""}`}>
      <BrandLogo className="site-header-brand" to={homeTo} />
      <div className="site-header-actions">
        <LangSelect className="site-header-lang" />
        {ready && user ? (
          <>
            <Link to={homeTo} className="site-header-link">
              {t(lang, "home")}
            </Link>
            <UserMenu variant="landing" />
          </>
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
