import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import BrandLogo from "./BrandLogo";
import "./SiteFooter.css";

export default function SiteFooter({ variant = "dark" }) {
  const { lang } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className={`lp-foot${variant === "light" ? " lp-foot-light" : ""}`}>
      <div className="lp-foot-left">
        <BrandLogo className="lp-foot-brand" />
      </div>
      <p className="lp-foot-copy">
        © {year} {t(lang, "brand")} {t(lang, "footRights")}
      </p>
      <nav className="lp-foot-links" aria-label={t(lang, "help")}>
        <Link to="/help" className="lp-foot-link">
          {t(lang, "help")}
        </Link>
        <Link to="/contact" className="lp-foot-link">
          {t(lang, "contactUs")}
        </Link>
        <Link to="/terms" className="lp-foot-link">
          {t(lang, "terms")}
        </Link>
      </nav>
    </footer>
  );
}
