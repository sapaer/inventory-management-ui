import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import SiteHeader from "./SiteHeader";

/**
 * Shared shell for the login / signup / account-setup screens:
 * glass header, tinted page, marketing panel on the left, and a
 * centred content column on the right with the copyright footer.
 *
 * `variant="setup"` top-aligns the content column and lets the page
 * scroll for the longer setup form.
 */
export default function AuthLayout({ hideLogin = false, hideSignup = false, variant = "form", children }) {
  const { lang } = useLang();

  return (
    <div className={`login-page${variant === "setup" ? " is-setup" : ""}`}>
      <SiteHeader hideLogin={hideLogin} hideSignup={hideSignup} />
      <div className="login">
        <div className="login-left">
          <div>
            <div className="login-tag">{t(lang, "tagline")}</div>
            <div className="login-hero">{t(lang, "heroTitle")}</div>
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
          <div className={`login-right-main${variant === "setup" ? " is-top" : ""}`}>{children}</div>
          <div className="login-right-foot">
            <span className="login-copy">
              © {new Date().getFullYear()} {t(lang, "brand")}. {t(lang, "footRights")}
            </span>
            <Link to="/terms" className="login-privacy">
              {t(lang, "privacyPolicy")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
