import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { authApi, formatApiError, inventoryApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import MobileAccountMenu from "./MobileAccountMenu";
import NotificationBell from "./NotificationBell";
import BrandLogo from "./BrandLogo";
import UserMenu from "./UserMenu";

const NAV = [
  { to: "/dashboard", key: "home", icon: HomeIcon, end: true },
  { to: "/inventory", key: "inventory", icon: BoxIcon },
  { to: "/stock-update", key: "updateStock", icon: UpdateIcon },
  { to: "/insights", key: "insights", icon: ChartIcon },
];

export default function Layout() {
  const { signOut, signIn } = useAuth();
  const { lang } = useLang();
  const loc = useLocation();
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [acctOpen, setAcctOpen] = useState(false);
  const [lowCount, setLowCount] = useState(0);
  const [addingShop, setAddingShop] = useState(false);

  async function addShop() {
    setAddingShop(true);
    try {
      const data = await authApi.createAccount();
      signIn(data);
      window.location.href = "/account-setup";
    } catch (e) {
      alert(formatApiError(e));
      setAddingShop(false);
    }
  }

  async function logout() {
    setAcctOpen(false);
    // Navigate off the protected route BEFORE clearing the session — signOut
    // flips the auth-context user to null, and if this Gate-wrapped page is
    // still mounted when that happens, Gate's own redirect to /auth wins the
    // race and overrides this one.
    nav("/welcome", { replace: true });
    await signOut();
  }

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );
  const acctRef = useRef(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("navCollapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("navCollapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!acctOpen) return;
    function onDoc(e) {
      if (!acctRef.current?.contains(e.target)) setAcctOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [acctOpen]);

  useEffect(() => {
    inventoryApi
      .lowStock()
      .then((rows) => setLowCount(Array.isArray(rows) ? rows.length : 0))
      .catch(() => setLowCount(0));
  }, [loc.pathname]);

  const isHome = loc.pathname === "/dashboard";
  const acctSection =
    loc.pathname === "/account" ? new URLSearchParams(loc.search).get("section") || "profile" : null;

  return (
    <div className={`shell${!isMobile && collapsed ? " nav-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-head">
          <BrandLogo className="brand" showTagline taglineClassName="brand-tag" to="/welcome" />
          <button
            type="button"
            className="nav-toggle"
            aria-pressed={collapsed}
            aria-label={t(lang, collapsed ? "expandNav" : "collapseNav")}
            data-tip={t(lang, collapsed ? "expandNav" : "collapseNav")}
            onClick={() => setCollapsed((v) => !v)}
          >
            <ToggleIcon />
          </button>
        </div>
        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={t(lang, item.key)}
              data-tip={t(lang, item.key)}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <span className="nav-ic">
                <item.icon />
              </span>
              <span className="nav-txt">{t(lang, item.key)}</span>
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className={`sidebar-lowstock${lowCount > 0 ? " has-alerts" : ""}`}
          aria-label={lowCount > 0 ? t(lang, "sidebarLowStock", lowCount) : t(lang, "sidebarLowStockOk")}
          data-tip={lowCount > 0 ? t(lang, "sidebarLowStock", lowCount) : t(lang, "sidebarLowStockOk")}
          onClick={() => nav("/low-stocks")}
        >
          <span className="nav-ic">
            {lowCount > 0 ? <AlertIcon /> : <CheckIcon />}
          </span>
          <span className="sidebar-lowstock-txt nav-txt">
            {lowCount > 0 ? t(lang, "sidebarLowStock", lowCount) : t(lang, "sidebarLowStockOk")}
          </span>
          {lowCount > 0 ? <span className="nav-badge">{lowCount}</span> : null}
        </button>
        <button
          className="sidebar-add"
          aria-label={t(lang, "addPart")}
          data-tip={t(lang, "addPart")}
          onClick={() => nav("/inventory/new")}
        >
          <span className="sidebar-add-ic">+</span>
          <span className="nav-txt">{t(lang, "addPart")}</span>
        </button>
        <button
          className="sidebar-add sidebar-add-secondary"
          aria-label={t(lang, "addShop")}
          data-tip={t(lang, "addShop")}
          disabled={addingShop}
          onClick={addShop}
        >
          <span className="sidebar-add-ic">+</span>
          <span className="nav-txt">{addingShop ? t(lang, "saving") : t(lang, "addShop")}</span>
        </button>
        <div className={`sidebar-acct${acctOpen ? " open" : ""}`} ref={acctRef}>
          {acctOpen ? (
            <div className="sidebar-acct-menu" role="menu">
              <Link
                to="/account"
                className={`sidebar-acct-item${acctSection === "profile" ? " active" : ""}`}
                role="menuitem"
                onClick={() => setAcctOpen(false)}
              >
                <span className="nav-ic">
                  <UserIcon />
                </span>
                {t(lang, "basicDetails")}
              </Link>
              <Link
                to="/account?section=shop"
                className={`sidebar-acct-item${acctSection === "shop" ? " active" : ""}`}
                role="menuitem"
                onClick={() => setAcctOpen(false)}
              >
                <span className="nav-ic">
                  <StoreIcon />
                </span>
                {t(lang, "storeDetails")}
              </Link>
              <button
                type="button"
                className="sidebar-acct-item sidebar-acct-logout"
                role="menuitem"
                onClick={logout}
              >
                <span className="nav-ic">
                  <LogoutIcon />
                </span>
                {t(lang, "logout")}
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="sidebar-acct-btn"
            aria-expanded={acctOpen}
            aria-label={t(lang, "myAccount")}
            data-tip={t(lang, "myAccount")}
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
      </aside>
      <div className="main">
        <header className="topbar">
          <BrandLogo className="topbar-brand-m" to="/welcome" />
          <BrandLogo className="topbar-brand" to="/welcome" />
          <div className="topbar-r">
            {isHome ? (
              <form
                className="srch"
                onSubmit={(e) => {
                  e.preventDefault();
                  nav(query.trim() ? `/inventory?q=${encodeURIComponent(query.trim())}` : "/inventory");
                }}
              >
                <span className="srch-ic">
                  <SearchIcon />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t(lang, "search")}
                />
              </form>
            ) : null}
            <span className="topbar-bell">
              <NotificationBell />
            </span>
            <UserMenu />
            {isMobile ? <MobileAccountMenu /> : null}
          </div>
        </header>
        <Outlet />
        {/* Bottom tab bar for phones is rendered app-wide by BottomTabBar.jsx
            (mounted in App.jsx), not per-page here. */}
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
    </svg>
  );
}
function ToggleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}
function UpdateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11A8 8 0 0 0 6 6.3L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14 4.7l2-1.7" />
      <path d="M20 20v-4h-4" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9.5 17H2.5L12 3Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8 12.3 2.6 2.6L16 9.5" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 17l5-5-5-5M21 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
    </svg>
  );
}
