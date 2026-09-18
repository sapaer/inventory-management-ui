import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";

const NAV = [
  { to: "/dashboard", tabKey: "home", icon: HomeIcon, end: true },
  { to: "/inventory", tabKey: "tabInventory", icon: BoxIcon },
  { to: "/stock-update", tabKey: "tabUpdate", icon: UpdateIcon },
  { to: "/insights", tabKey: "insights", icon: ChartIcon },
];

function scrollPageToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelectorAll(".lp-scroll").forEach((el) => {
    el.scrollTop = 0;
  });
}

/**
 * App-wide bottom navigation for phones/small screens — the same four tabs
 * (Home/Inventory/Update stock/Insights) on every signed-in page.
 */
export default function BottomTabBar() {
  const { user } = useAuth();
  const { lang } = useLang();
  const loc = useLocation();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const visible = Boolean(user) && isMobile;

  // Public pages (Landing, Help/Contact/Terms/FAQs) reserve bottom padding
  // for this bar via `body.has-tabbar` — those pages don't know the auth
  // state themselves, and this bar is the one place that already does, so
  // it's the one to flag whether that space is actually needed. Without
  // this, a signed-out visitor on mobile got the padding with no bar to
  // justify it: blank space below the (hidden-on-mobile) footer.
  useEffect(() => {
    document.body.classList.toggle("has-tabbar", visible);
    return () => document.body.classList.remove("has-tabbar");
  }, [visible]);

  useEffect(() => {
    scrollPageToTop();
  }, [loc.pathname]);

  if (!visible) return null;

  return (
    <nav className="tabbar" aria-label={t(lang, "navigation")}>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `tabbar-item${isActive ? " active" : ""}`}
          onClick={scrollPageToTop}
        >
          <span className="tabbar-ic">
            <item.icon />
          </span>
          <span>{t(lang, item.tabKey)}</span>
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
function UpdateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11A8 8 0 0 0 6 6.3L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14 4.7l2-1.7" />
      <path d="M20 20v-4h-4" />
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
