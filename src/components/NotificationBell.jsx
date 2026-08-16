import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationApi, formatApiError } from "../api";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { formatWhen } from "../utils";

export default function NotificationBell() {
  const { lang } = useLang();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const box = useRef(null);

  async function load() {
    try {
      const data = await notificationApi.list(1, 20);
      setItems(Array.isArray(data?.content) ? data.content : []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function onDoc(e) {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const unread = items.filter((n) => !n.isRead).length;

  async function openItem(n) {
    try {
      if (!n.isRead) {
        await notificationApi.markRead(n.id);
        setItems((rows) => rows.map((r) => (r.id === n.id ? { ...r, isRead: true } : r)));
      }
    } catch (e) {
      console.warn(formatApiError(e));
    }
    setOpen(false);
    const itemId = n.data?.item_id || n.data?.itemId;
    if (n.type === "LOW_STOCK") nav("/low-stocks");
    else if (itemId) nav(`/inventory/${itemId}/edit`);
  }

  return (
    <div className="bell-wrap" ref={box}>
      <button className="bell-btn" onClick={() => { setOpen((v) => !v); if (!open) load(); }} aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 ? <span className="bell-dot">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="bell-panel">
          <div className="bell-hd">{t(lang, "alerts")}</div>
          {items.length === 0 ? (
            <div className="list-row muted">{t(lang, "noAlerts")}</div>
          ) : (
            items.slice(0, 8).map((n) => (
              <button key={n.id} className={`bell-row${n.isRead ? "" : " unread"}`} onClick={() => openItem(n)}>
                <div>
                  <div className="pname">{n.title}</div>
                  <div className="pspec">{n.body}</div>
                </div>
                <span className="time">{formatWhen(n.sentAt || n.createdAt)}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
