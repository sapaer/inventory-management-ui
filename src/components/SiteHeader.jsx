import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { inventoryApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import BrandLogo from "./BrandLogo";
import LangSelect from "./LangSelect";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import "./GlassPanel.css";
import "./SiteHeader.css";

const APP_NAV = [
  { to: "/dashboard", key: "home", icon: HomeIcon, end: true },
  { to: "/inventory", key: "inventory", icon: BoxIcon },
  { to: "/low-stocks", key: "lowStocks", icon: BellIcon },
  { to: "/insights", key: "insights", icon: ChartIcon },
];

/**
 * Shared top bar for the public pages (landing, login, info pages).
 * Desktop keeps language + login/signup in the bar. Mobile is logo + menu;
 * those controls move into the drawer.
 */
export default function SiteHeader({ hideLogin = false, hideSignup = false, sticky = false, links = [] }) {
  const { user, ready } = useAuth();
  const { lang } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [lowCount, setLowCount] = useState(0);
  const acctRef = useRef(null);
  const drawerId = useId();

  useEffect(() => {
    setMenuOpen(false);
    setAcctOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!ready || !user) return undefined;
    inventoryApi
      .lowStock()
      .then((rows) => setLowCount(Array.isArray(rows) ? rows.length : 0))
      .catch(() => setLowCount(0));
  }, [ready, user, location.pathname]);

  useEffect(() => {
    if (!acctOpen) return undefined;
    function onDoc(e) {
      if (!acctRef.current?.contains(e.target)) setAcctOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [acctOpen]);

  const loggedIn = ready && Boolean(user);
  const acctSection =
    location.pathname === "/account" ? new URLSearchParams(location.search).get("section") || "profile" : null;

  function closeMenu() {
    setMenuOpen(false);
    setAcctOpen(false);
  }

  const guestButtons = ready && !user ? (
    <>
      <Link to="/auth?mode=login" className="site-header-btn site-header-btn-ghost" onClick={closeMenu}>
        {t(lang, "lpLogin")}
      </Link>
      <Link to="/auth?mode=signup" className="site-header-btn site-header-btn-solid" onClick={closeMenu}>
        {t(lang, "lpSignUp")}
      </Link>
    </>
  ) : null;

  const desktopAccount = ready && user ? (
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
  ) : null;

  return (
    <header className={`site-header glass glass-nav${sticky ? " site-header-sticky" : ""}${menuOpen ? " is-open" : ""}`}>
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
        {desktopAccount}
      </div>

      <button
        type="button"
        className="site-header-burger"
        aria-expanded={menuOpen}
        aria-controls={drawerId}
        aria-label={menuOpen ? t(lang, "closeMenu") : t(lang, "openMenu")}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {menuOpen
        ? createPortal(
            <button type="button" className="site-header-scrim" aria-label={t(lang, "closeMenu")} onClick={closeMenu} />,
            document.body,
          )
        : null}
      {createPortal(
        <div
          id={drawerId}
          className={`site-header-drawer${menuOpen ? " is-open" : ""}${loggedIn ? " is-authed" : " is-guest"}`}
          aria-hidden={!menuOpen}
          inert={menuOpen ? undefined : true}
        >
          {loggedIn ? (
            <>
              <div className="site-header-drawer-head">
                <BrandLogo className="site-header-drawer-brand" showTagline taglineClassName="brand-tag" to="/welcome" />
                <button type="button" className="site-header-drawer-close" aria-label={t(lang, "closeMenu")} onClick={closeMenu}>
                  <CloseIcon />
                </button>
              </div>
              <nav className="nav" aria-label={t(lang, "myAccount")}>
                {APP_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    aria-label={t(lang, item.key)}
                    onClick={closeMenu}
                    className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                  >
                    <span className="nav-ic">
                      <item.icon />
                    </span>
                    <span className="nav-txt">{t(lang, item.key)}</span>
                    {item.key === "lowStocks" && lowCount > 0 ? <span className="nav-badge">{lowCount}</span> : null}
                  </NavLink>
                ))}
              </nav>
              <button
                type="button"
                className="sidebar-add"
                aria-label={t(lang, "addPart")}
                onClick={() => {
                  closeMenu();
                  navigate("/inventory/new");
                }}
              >
                <span className="sidebar-add-ic">+</span>
                <span className="nav-txt">{t(lang, "addPart")}</span>
              </button>
              <div className={`sidebar-acct${acctOpen ? " open" : ""}`} ref={acctRef}>
                {acctOpen ? (
                  <div className="sidebar-acct-menu" role="menu">
                    <Link
                      to="/account?section=profile"
                      className={`sidebar-acct-item${acctSection === "profile" ? " active" : ""}`}
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      <span className="nav-ic">
                        <GearIcon />
                      </span>
                      {t(lang, "profile")}
                    </Link>
                    <Link
                      to="/account?section=store"
                      className={`sidebar-acct-item${acctSection === "store" ? " active" : ""}`}
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      <span className="nav-ic">
                        <StoreIcon />
                      </span>
                      {t(lang, "storeDetails")}
                    </Link>
                    <div className="sidebar-acct-item sidebar-acct-notif">
                      <NotificationBell label={t(lang, "notifications")} />
                    </div>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="sidebar-acct-btn"
                  aria-expanded={acctOpen}
                  aria-label={t(lang, "myAccount")}
                  onClick={() => setAcctOpen((v) => !v)}
                >
                  <span className="nav-ic">
                    <UserIcon />
                  </span>
                  <span className="nav-txt">{t(lang, "myAccount")}</span>
                  <span className="sidebar-acct-caret">
                    <CaretIcon />
                  </span>
                </button>
              </div>
              <div className="sidebar-lang">
                <LangSelect />
              </div>
            </>
          ) : (
            <>
              <div className="site-header-drawer-section">
                <p className="site-header-drawer-lbl">{t(lang, "language")}</p>
                <LangSelect className="site-header-lang" />
              </div>
              {guestButtons ? (
                <>
                  <div className="site-header-drawer-divider" />
                  <div className="site-header-drawer-account">{guestButtons}</div>
                </>
              ) : null}
            </>
          )}
        </div>,
        document.body,
      )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 9V7l1.5-3h13L20 7v2a2.5 2.5 0 0 1-4.5 1.5A2.5 2.5 0 0 1 12 11a2.5 2.5 0 0 1-3.5-.5A2.5 2.5 0 0 1 4 9z" />
      <path d="M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function CaretIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
