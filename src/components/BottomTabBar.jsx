import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { inventoryApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";

const NAV = [
  { to: "/dashboard", tabKey: "home", icon: HomeIcon, end: true },
  { to: "/inventory", tabKey: "tabInventory", icon: BoxIcon },
  { to: "/low-stocks", tabKey: "tabAlerts", icon: BellIcon, badge: true },
  { to: "/insights", tabKey: "insights", icon: ChartIcon },
];

// Focused, single-task flows — no app-wide nav while the user is in them.
const HIDDEN_ON = ["/account-setup"];

/**
 * App-wide bottom navigation for phones/small screens — the same four tabs
 * (Home/Inventory/Alerts/Insights) on every signed-in page, including
 * standalone pages like Help/Contact/Terms and the Account page itself.
 * Account's own sections (Profile/Store/Notifications/Settings) are reached
 * from the profile-menu button in the top bar (MobileAccountMenu.jsx), not
 * from here — so this bar never changes shape depending on where you are.
 */
export default function BottomTabBar() {
  const { user } = useAuth();
  const { lang } = useLang();
  const loc = useLocation();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );
  const [lowCount, setLowCount] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!user) return;
    inventoryApi
      .lowStock()
      .then((rows) => setLowCount(Array.isArray(rows) ? rows.length : 0))
      .catch(() => setLowCount(0));
  }, [user, loc.pathname]);

  if (!user || !isMobile || HIDDEN_ON.includes(loc.pathname)) return null;

  return (
    <nav className="tabbar" aria-label={t(lang, "navigation")}>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `tabbar-item${isActive ? " active" : ""}`}
        >
          <span className="tabbar-ic">
            <item.icon />
          </span>
          <span>{t(lang, item.tabKey)}</span>
          {item.badge && lowCount > 0 ? <span className="tabbar-badge">{lowCount}</span> : null}
        </NavLink>
      ))}
    </nav>
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
