import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { initials, needsShopSetup } from "../utils";

export default function UserMenu({ variant = "default" }) {
  const { user, signOut } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (!root.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const label = user.name || user.shopName || (user.phone ? `+91 ${user.phone}` : t(lang, "brand"));

  async function logout() {
    setOpen(false);
    await signOut();
    nav("/", { replace: true });
  }

  return (
    <div className={`user-menu${variant === "landing" ? " user-menu-lp" : ""}`} ref={root}>
      <button
        type="button"
        className="av user-menu-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        {initials(user.name || user.shopName)}
      </button>
      {open ? (
        <div className="user-menu-drop" role="menu">
          <div className="user-menu-meta">
            <div className="user-menu-name">{label}</div>
            {user.phone ? <div className="user-menu-phone">+91 {user.phone}</div> : null}
          </div>
          {!needsShopSetup(user) ? (
            <Link to="/settings" className="user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              {t(lang, "settings")}
            </Link>
          ) : null}
          <button type="button" className="user-menu-item danger" role="menuitem" onClick={logout}>
            {t(lang, "logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
