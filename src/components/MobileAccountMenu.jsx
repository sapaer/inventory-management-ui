import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";

// Mirrors Account.jsx's own MOBILE_SECTIONS (Security + Preferences collapse
// into "settings" there too) so this menu reaches every account area.
const ITEMS = [
  { id: "profile", key: "tabProfile", to: "/account", Icon: UserIcon },
  { id: "shop", key: "tabShop", to: "/account?section=shop", Icon: StoreIcon },
  { id: "notifications", key: "tabAlerts", to: "/account?section=notifications", Icon: BellIcon },
  { id: "settings", key: "settingsNav", to: "/account?section=settings", Icon: SettingsIcon },
];

/**
 * Compact account menu for phones — one profile-icon button that opens
 * Profile / Store details / Notifications / Settings / Logout. This is the
 * single mobile nav-shell used everywhere (Layout's signed-in app shell and
 * SiteHeader's public pages alike): Home/Inventory/Alerts/Insights already
 * live in the app-wide bottom tab bar, so there's no separate hamburger
 * drawer anymore.
 */
export default function MobileAccountMenu() {
  const { signOut } = useAuth();
  const { lang } = useLang();
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname, loc.search]);

  const rawSection = loc.pathname === "/account" ? new URLSearchParams(loc.search).get("section") : null;
  const acctSection =
    rawSection === "security" || rawSection === "preferences"
      ? "settings"
      : rawSection || (loc.pathname === "/account" ? "profile" : null);

  async function logout() {
    setOpen(false);
    await signOut();
    nav("/auth?mode=login", { replace: true });
  }

  return (
    <div className="mobile-acct" ref={ref}>
      <button
        type="button"
        className="mobile-acct-btn"
        aria-label={t(lang, "myAccount")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <UserIcon />
      </button>
      {open ? (
        <div className="mobile-acct-menu" role="menu">
          {ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className={`mobile-acct-item${acctSection === item.id ? " active" : ""}`}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="nav-ic">
                <item.Icon />
              </span>
              {t(lang, item.key)}
            </Link>
          ))}
          <button type="button" className="mobile-acct-item mobile-acct-logout" role="menuitem" onClick={logout}>
            <span className="nav-ic">
              <LogoutIcon />
            </span>
            {t(lang, "logout")}
          </button>
        </div>
      ) : null}
    </div>
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
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="10" cy="16" r="2" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 17l5-5-5-5M21 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
    </svg>
  );
}
