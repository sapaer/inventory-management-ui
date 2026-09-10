import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { formatDateTime } from "../utils";

/**
 * Detail popup for a single notification. Closes on the ✕, on click outside,
 * and on Esc. Renders a contextual action button when the notification links
 * somewhere (a low-stock alert → the part, or the low-stock list).
 */
export default function NotificationModal({ notification, onClose }) {
  const { lang } = useLang();
  const nav = useNavigate();

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!notification) return null;
  const n = notification;
  const itemId = n.data?.item_id || n.data?.itemId;

  let action = null;
  if (n.type === "LOW_STOCK" && itemId) {
    action = { label: t(lang, "viewPart"), to: `/inventory/${itemId}/edit` };
  } else if (n.type === "LOW_STOCK") {
    action = { label: t(lang, "lowStocks"), to: "/low-stocks" };
  }

  const when = formatDateTime(n.sentAt || n.createdAt);

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div
        className="modal notif-modal"
        role="dialog"
        aria-modal="true"
        aria-label={n.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="notif-modal-x" aria-label={t(lang, "close")} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="notif-modal-hd">
          <span className={`notif-badge notif-badge-${(n.channel || "IN_APP").toLowerCase()}`}>
            {n.channel === "WHATSAPP" ? "WhatsApp" : n.channel === "SMS" ? "SMS" : t(lang, "inApp")}
          </span>
          {when ? <span className="notif-modal-time">{when}</span> : null}
        </div>

        <h3 className="notif-modal-title">{n.title}</h3>
        <p className="notif-modal-body">{n.body}</p>

        <div className="modal-actions">
          {action ? (
            <button
              type="button"
              className="btn btn-p"
              onClick={() => {
                onClose();
                nav(action.to);
              }}
            >
              {action.label}
            </button>
          ) : null}
          <button type="button" className="btn btn-g" onClick={onClose}>
            {t(lang, "close")}
          </button>
        </div>
      </div>
    </div>
  );
}
