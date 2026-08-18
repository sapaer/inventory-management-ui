import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { inventoryApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { locationLabel } from "../utils";
import NotificationBell from "./NotificationBell";
import BrandLogo from "./BrandLogo";
import UserMenu from "./UserMenu";
import LangSelect from "./LangSelect";
import AppTour from "./AppTour";

const NAV = [
  { to: "/dashboard", key: "home", icon: HomeIcon, end: true },
  { to: "/inventory", key: "inventory", icon: BoxIcon },
  { to: "/low-stocks", key: "lowStocks", icon: BellIcon },
  { to: "/insights", key: "insights", icon: ChartIcon },
  { to: "/settings", key: "settings", icon: GearIcon },
];

export default function Layout() {
  const { user } = useAuth();
  const { lang } = useLang();
  const loc = useLocation();
  const nav = useNavigate();
  const [guideOpen, setGuideOpen] = useState(false);
  const [lowCount, setLowCount] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    inventoryApi
      .lowStock()
      .then((rows) => setLowCount(Array.isArray(rows) ? rows.length : 0))
      .catch(() => setLowCount(0));
  }, [loc.pathname]);

  const titleMap = {
    "/dashboard": t(lang, "home"),
    "/inventory": t(lang, "inventory"),
    "/inventory/new": t(lang, "addPart"),
    "/low-stocks": t(lang, "lowStocks"),
    "/insights": t(lang, "insights"),
    "/settings": t(lang, "settings"),
  };
  const isHome = loc.pathname === "/dashboard";
  const title = isHome
    ? t(lang, "greeting", user?.name)
    : loc.pathname.includes("/edit")
      ? t(lang, "edit")
      : titleMap[loc.pathname] || t(lang, "dashboard");
  const showAdd = !isHome && loc.pathname !== "/inventory/new" && !loc.pathname.endsWith("/edit");

  return (
    <div className="shell notranslate" translate="no">
      <aside className="sidebar">
        <BrandLogo className="brand" showTagline taglineClassName="brand-tag" to="/welcome" />
        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <span className="nav-ic">
                <item.icon />
              </span>
              {t(lang, item.key)}
              {item.key === "lowStocks" && lowCount > 0 ? <span className="nav-badge">{lowCount}</span> : null}
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-add" onClick={() => nav("/inventory/new")}>
          + {t(lang, "addPart")}
        </button>
        <button
          type="button"
          className="sidebar-guide"
          onClick={() => setGuideOpen(true)}
        >
          <GuideIcon />
          {t(lang, "userGuide")}
        </button>
        <div className="shop-foot">
          <div className="shop-nm">{user?.shopName || t(lang, "yourShop")}</div>
          <div className="shop-lc">{locationLabel(user) || (user?.phone ? `+91 ${user.phone}` : "")}</div>
          <span className="plan-pill">{t(lang, "freePlan")}</span>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="page-title">{title}</div>
          <div className="topbar-r">
            {isHome ? (
              <form
                className="srch"
                onSubmit={(e) => {
                  e.preventDefault();
                  nav(query.trim() ? `/inventory?q=${encodeURIComponent(query.trim())}` : "/inventory");
                }}
              >
                <span>⌕</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t(lang, "search")}
                />
              </form>
            ) : null}
            {showAdd ? (
              <button className="btn btn-p topbar-add" onClick={() => nav("/inventory/new")}>
                + <span className="add-label">{t(lang, "addPart")}</span>
              </button>
            ) : null}
            <LangSelect className="topbar-lang" />
            <NotificationBell />
            <UserMenu />
            <BrandLogo className="topbar-brand" to="/welcome" />
          </div>
        </header>
        <Outlet />
      </div>
      <AppTour open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

function GuideIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-1a3 3 0 0 0 1.5-2.6c0-1.1-.9-2-2-2a2 2 0 0 0-2 2" />
      <circle cx="12" cy="8" r="0.8" fill="currentColor" stroke="none" />
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
