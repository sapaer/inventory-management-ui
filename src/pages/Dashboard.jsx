import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { inventoryApi, notificationApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { formatWhen, stockOf } from "../utils";

export default function Dashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    Promise.all([
      inventoryApi.list().catch(() => []),
      notificationApi.list(1, 10).catch(() => ({ content: [] })),
    ])
      .then(([rows, notes]) => {
        setItems(Array.isArray(rows) ? rows : []);
        setAlerts(Array.isArray(notes?.content) ? notes.content : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = items.length;
  const out = items.filter((i) => stockOf(i) === "OUT_OF_STOCK");
  const low = items.filter((i) => stockOf(i) === "LOW_STOCK");
  const inStock = items.filter((i) => stockOf(i) === "IN_STOCK");
  const attention = low.length + out.length;
  const pct = total ? Math.round((inStock.length / total) * 100) : 0;
  const latest = items.reduce((acc, i) => {
    const tms = new Date(i.updatedAt).getTime();
    return tms > acc ? tms : acc;
  }, 0);
  const recent = [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
  const lowNames = [...low, ...out]
    .slice(0, 3)
    .map((i) => `${i.partName} (${i.quantity === 0 ? (lang === "hi" ? "आउट" : "out of stock") : `${i.quantity} ${lang === "hi" ? "बचे" : "left"}`})`)
    .join(", ");

  if (loading) return <div className="content">Loading…</div>;

  return (
    <div className="content">
      {attention > 0 ? (
        <div className="banner amber">
          <span>⚠</span>
          <span>
            <strong>{t(lang, "partsRunningLow", attention)}</strong>
            {lowNames ? ` — ${lowNames}` : ""}
          </span>
          <Link className="link" to="/low-stocks">
            {t(lang, "viewAll")} →
          </Link>
        </div>
      ) : (
        <div className="banner mint">
          {user?.shopName || user?.name ? t(lang, "welcomeBanner") : t(lang, "completeProfile")}
          {!user?.shopName || !user?.name ? (
            <Link className="link" to="/settings">
              {t(lang, "settings")} →
            </Link>
          ) : null}
        </div>
      )}

      <div className="qa-grid">
        <button className="qa-card" onClick={() => nav("/inventory/new")}>
          <div className="qa-icon" style={{ background: "#E1F5EE" }}>
            +
          </div>
          <div>
            <div className="qa-title">{t(lang, "addPart")}</div>
            <div className="qa-sub">{t(lang, "qaAddSub")}</div>
            <div className="qa-pill">{t(lang, "freeNow")}</div>
          </div>
        </button>
        <button className="qa-card" onClick={() => nav("/inventory")}>
          <div className="qa-icon" style={{ background: "#DBEAFE" }}>
            ▤
          </div>
          <div>
            <div className="qa-title">{t(lang, "inventory")}</div>
            <div className="qa-sub">{t(lang, "qaInvSub", total)}</div>
          </div>
        </button>
        <button className="qa-card" onClick={() => nav("/insights")}>
          <div className="qa-icon" style={{ background: "#F3E8FF" }}>
            ↗
          </div>
          <div>
            <div className="qa-title">{t(lang, "insights")}</div>
            <div className="qa-sub">{t(lang, "qaInsSub")}</div>
          </div>
        </button>
        <button className={`qa-card${attention ? " warn" : ""}`} onClick={() => nav("/low-stocks")}>
          <div className="qa-icon" style={{ background: "#FEF3C7" }}>
            !
          </div>
          <div>
            <div className="qa-title" style={attention ? { color: "#92400E" } : undefined}>
              {t(lang, "lowStocks")}
            </div>
            <div className="qa-sub" style={attention ? { color: "#B45309" } : undefined}>
              {t(lang, "qaLowSub", attention)}
            </div>
          </div>
        </button>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-lbl">{t(lang, "totalParts")}</div>
          <div className="stat-val">{total}</div>
          <div className="stat-note">{t(lang, "inCatalog")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{t(lang, "inStock")}</div>
          <div className="stat-val" style={{ color: "#16A34A" }}>
            {inStock.length}
          </div>
          <div className="stat-note">{t(lang, "availablePct", pct)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{t(lang, "lowOut")}</div>
          <div className="stat-val" style={{ color: "#D97706" }}>
            {attention}
          </div>
          <div className="stat-note" style={{ color: out.length ? "#EF4444" : undefined }}>
            {t(lang, "atZero", out.length)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{t(lang, "lastUpdated")}</div>
          <div className="stat-val" style={{ fontSize: 18 }}>
            {latest ? formatWhen(latest) : "—"}
          </div>
          <div className="stat-note">{user?.shopName || t(lang, "yourShop")}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <div className="card-ttl">{t(lang, "recent")}</div>
        </div>
        {recent.length ? (
          recent.map((item) => {
            const st = stockOf(item);
            const text =
              st !== "IN_STOCK"
                ? t(lang, "recentLow", item.partName, item.quantity)
                : t(lang, "recentAdded", item.partName, item.quantity);
            return (
              <div className="list-row" key={item.id}>
                <span className="dot" style={{ color: colorFor(st) }}>
                  ●
                </span>
                <div style={{ flex: 1, color: "#374151" }}>{text}</div>
                <span className="time">{formatWhen(item.updatedAt)}</span>
              </div>
            );
          })
        ) : (
          <>
            <div className="list-row">
              <span className="dot" style={{ color: "#16A34A" }}>
                ●
              </span>
              <div style={{ flex: 1, color: "#374151" }}>{t(lang, "hintAdd")}</div>
              <button className="link" onClick={() => nav("/inventory/new")}>
                {t(lang, "addPart")}
              </button>
            </div>
            <div className="list-row">
              <span className="dot" style={{ color: "#1D4ED8" }}>
                ●
              </span>
              <div style={{ flex: 1, color: "#374151" }}>{t(lang, "hintProfile")}</div>
              <Link className="link" to="/settings">
                {t(lang, "settings")}
              </Link>
            </div>
            <div className="list-row">
              <span className="dot" style={{ color: "#D97706" }}>
                ●
              </span>
              <div style={{ flex: 1, color: "#374151" }}>{t(lang, "hintAlerts")}</div>
            </div>
          </>
        )}
        {alerts.slice(0, 2).map((n) => (
          <div className="list-row" key={n.id}>
            <span className="dot" style={{ color: "#D97706" }}>
              ●
            </span>
            <div style={{ flex: 1, color: "#374151" }}>
              <strong>{n.title}</strong> — {n.body}
            </div>
            <span className="time">{formatWhen(n.sentAt || n.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function colorFor(status) {
  if (status === "OUT_OF_STOCK") return "#ef4444";
  if (status === "LOW_STOCK") return "#d97706";
  return "#16a34a";
}
