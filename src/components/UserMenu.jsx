import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, formatApiError } from "../api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { initials, needsShopSetup } from "../utils";

export default function UserMenu({ variant = "default" }) {
  const { user, signIn, signOut } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");
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

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    authApi
      .listAccounts()
      .then((list) => {
        if (!cancelled) setAccounts(list || []);
      })
      .catch(() => {
        if (!cancelled) setAccounts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  if (!user) return null;

  const label = user.name || user.shopName || (user.phone ? `+91 ${user.phone}` : t(lang, "brand"));

  async function logout() {
    setOpen(false);
    await signOut();
    nav("/", { replace: true });
  }

  async function switchTo(accountId) {
    setSwitching(true);
    setSwitchError("");
    try {
      const data = await authApi.switchAccount(accountId);
      signIn(data);
      setOpen(false);
      // Full reload so every page refetches under the new account instead of showing stale data.
      window.location.href = needsShopSetup(data.user) ? "/setup" : "/dashboard";
    } catch (e) {
      setSwitchError(formatApiError(e));
      setSwitching(false);
    }
  }

  async function addShop() {
    setSwitching(true);
    setSwitchError("");
    try {
      const data = await authApi.createAccount();
      signIn(data);
      setOpen(false);
      window.location.href = "/setup";
    } catch (e) {
      setSwitchError(formatApiError(e));
      setSwitching(false);
    }
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
          {accounts && accounts.length > 1 ? (
            <div className="user-menu-section">
              <div className="user-menu-section-ttl">{t(lang, "yourShops")}</div>
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  className={`user-menu-item${acc.id === user.id ? " on" : ""}`}
                  role="menuitem"
                  disabled={switching || acc.id === user.id}
                  onClick={() => switchTo(acc.id)}
                >
                  {acc.shopName || acc.name || t(lang, "unnamedShop")}
                  {acc.id === user.id ? ` (${t(lang, "current")})` : ""}
                  {acc.status === "DEACTIVATED" ? ` · ${t(lang, "deactivated")}` : ""}
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" className="user-menu-item" role="menuitem" disabled={switching} onClick={addShop}>
            {t(lang, "addShop")}
          </button>
          {switchError ? <div className="user-menu-error">{switchError}</div> : null}
          {!needsShopSetup(user) ? (
            <Link to="/settings" className="user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              {t(lang, "profile")}
            </Link>
          ) : null}
          <Link to="/help" className="user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
            {t(lang, "help")}
          </Link>
          <Link to="/contact" className="user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
            {t(lang, "contact")}
          </Link>
          <button type="button" className="user-menu-item danger" role="menuitem" onClick={logout}>
            {t(lang, "logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
