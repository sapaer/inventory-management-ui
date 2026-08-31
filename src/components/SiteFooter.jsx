import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import BrandLogo from "./BrandLogo";

export default function SiteFooter({ variant = "dark" }) {
  const { lang } = useLang();
  return (
    <footer className={`lp-foot${variant === "light" ? " lp-foot-light" : ""}`}>
      <BrandLogo className="lp-foot-brand" />
      <nav className="lp-foot-links" aria-label={t(lang, "help")}>
        <Link to="/help">{t(lang, "help")}</Link>
        <Link to="/contact">{t(lang, "contact")}</Link>
        <Link to="/terms">{t(lang, "terms")}</Link>
      </nav>
      <span className="lp-foot-note">{t(lang, "freeNote")}</span>
    </footer>
  );
}
