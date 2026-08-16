import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { inventoryApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { initials, locationLabel } from "../utils";
import NotificationBell from "./NotificationBell";

const NAV = [
  { to: "/", key: "home", icon: HomeIcon, end: true },
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
  const [open, setOpen] = useState(false);
  const [lowCount, setLowCount] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    inventoryApi
      .lowStock()
      .then((rows) => setLowCount(Array.isArray(rows) ? rows.length : 0))
      .catch(() => setLowCount(0));
  }, [loc.pathname]);

  const titleMap = {
    "/": t(lang, "home"),
    "/inventory": t(lang, "inventory"),
    "/inventory/new": t(lang, "addPart"),
    "/low-stocks": t(lang, "lowStocks"),
    "/insights": t(lang, "insights"),
    "/settings": t(lang, "settings"),
  };
  const isHome = loc.pathname === "/";
  const title = isHome
    ? t(lang, "greeting", user?.name)
    : loc.pathname.includes("/edit")
      ? t(lang, "edit")
      : titleMap[loc.pathname] || t(lang, "dashboard");
  const showAdd = !isHome && loc.pathname !== "/inventory/new" && !loc.pathname.endsWith("/edit");

  return (
    <div className="shell">
      <div className={`mobile-scrim${open ? " show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar${open ? " open" : ""}`}>
        <NavLink to="/" end className="brand">
          <div className="brand-name">{t(lang, "brand")}</div>
          <div className="brand-tag">{t(lang, "tagline")}</div>
        </NavLink>
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
        <div className="shop-foot">
          <div className="shop-nm">{user?.shopName || t(lang, "yourShop")}</div>
          <div className="shop-lc">{locationLabel(user) || (user?.phone ? `+91 ${user.phone}` : "")}</div>
          <span className="plan-pill">{t(lang, "freePlan")}</span>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Menu">
              ☰
            </button>
            <div className="page-title">{title}</div>
          </div>
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
              <button className="btn btn-p" onClick={() => nav("/inventory/new")}>
                + {t(lang, "addPart")}
              </button>
            ) : null}
            <NotificationBell />
            <div className="av">{initials(user?.name || user?.shopName)}</div>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
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
