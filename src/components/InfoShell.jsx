import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { needsShopSetup } from "../utils";
import BrandLogo from "./BrandLogo";
import LangSelect from "./LangSelect";
import UserMenu from "./UserMenu";
import SiteFooter from "./SiteFooter";
import "../pages/Landing.css";
import "../pages/InfoPages.css";

export default function InfoShell({ title, children }) {
  const { user, ready } = useAuth();
  const { lang } = useLang();
  const homeTo = user && needsShopSetup(user) ? "/setup" : user ? "/dashboard" : "/welcome";

  return (
    <div className="lp info-page">
      <header className="lp-nav">
        <BrandLogo className="lp-nav-brand" />
        <div className="lp-nav-actions">
          <LangSelect />
          {ready && user ? (
            <>
              <Link to={homeTo} className="lp-nav-home">
                {t(lang, "home")}
              </Link>
              <UserMenu variant="landing" />
            </>
          ) : ready ? (
            <Link to="/login" className="lp-nav-cta">
              {t(lang, "lpLogin")}
            </Link>
          ) : null}
        </div>
      </header>
      <main className="info-main">
        <p className="info-draft">{t(lang, "legalDraftBanner")}</p>
        <h1 className="info-title">{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
