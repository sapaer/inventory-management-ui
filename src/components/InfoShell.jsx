import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import "../pages/Landing.css";
import "../pages/InfoPages.css";

export default function InfoShell({ title, children }) {
  const { user } = useAuth();
  const { lang } = useLang();

  return (
    <div className={`lp info-page${user ? " is-authed" : " is-guest"}`}>
      <SiteHeader sticky />
      <main className="info-main">
        <p className="info-draft">{t(lang, "legalDraftBanner")}</p>
        <h1 className="info-title">{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
