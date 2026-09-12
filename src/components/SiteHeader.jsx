import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import BrandLogo from "./BrandLogo";
import LangSelect from "./LangSelect";
import MobileAccountMenu from "./MobileAccountMenu";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import "./GlassPanel.css";
import "./SiteHeader.css";

/**
 * Shared top bar for the public pages (landing, login, info pages).
 * Same nav shell as the signed-in app: on phones, Home/Inventory/Alerts/
 * Insights live in the app-wide bottom tab bar (BottomTabBar.jsx) and every
 * account area is one tap away from the profile-menu button here — no
 * separate hamburger drawer.
 */
export default function SiteHeader({ hideLogin = false, hideSignup = false, sticky = false, links = [] }) {
  const { user, ready } = useAuth();
  const { lang } = useLang();

  const loggedIn = ready && Boolean(user);

  const guestButtons = !user ? (
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
  ) : null;

  return (
    <header
      className={`site-header glass glass-nav${sticky ? " site-header-sticky" : ""}${
        loggedIn ? " is-authed" : " is-guest"
      }`}
    >
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
        {user ? (
          <>
            <NotificationBell />
            <UserMenu variant="landing" />
            <MobileAccountMenu />
          </>
        ) : (
          guestButtons
        )}
      </div>
    </header>
  );
}
