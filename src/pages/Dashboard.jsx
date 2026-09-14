import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { inventoryApi, notificationApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { formatDate, formatWhen, stockOf } from "../utils";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
  const recent = [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10);
  const feed = [
    ...recent.map((item) => {
      const st = stockOf(item);
      return {
        id: `p-${item.id}`,
        at: item.updatedAt,
        kind: st === "IN_STOCK" ? "ok" : "warn",
        text: cleanDash(
          st !== "IN_STOCK"
            ? t(lang, "recentLow", item.partName, item.quantity)
            : t(lang, "recentAdded", item.partName, item.quantity),
        ),
      };
    }),
    ...alerts.slice(0, 3).map((n) => ({
      id: `n-${n.id}`,
      at: n.sentAt || n.createdAt,
      kind: "warn",
      text: noticeLine(n),
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  const groups = groupFeedByDay(feed);

  const data = { user, lang, nav, total, out, inStock, attention, pct, latest, groups };

  if (loading) return <div className={`content dash ${mobile ? "is-last" : "is-desk"}`}>Loading…</div>;

  return (
    <div className={`content dash ${mobile ? "is-last" : "is-desk"}`}>
      {mobile ? <LastHome {...data} /> : <DeskHome {...data} />}
    </div>
  );
}

function LastHome({ user, lang, nav, total, inStock, attention, pct, out, groups }) {
  return (
    <>
      <AlertBanner user={user} lang={lang} attention={attention} />
      <div className="stack-actions">
        <button type="button" className="stack-link" onClick={() => nav("/inventory/new")}>
          <span className="stack-ic">
            <PlusIcon />
          </span>
          <span className="stack-link-ttl">{t(lang, "addPart")}</span>
          <Chevron />
        </button>
      </div>

      <div className="stack-stats">
        <div className="stack-metrics">
          <div>
            <strong>{total}</strong>
            <span>{t(lang, "totalParts")}</span>
            <em>{t(lang, "inCatalog")}</em>
          </div>
          <div>
            <strong style={{ color: "#16A34A" }}>{inStock.length}</strong>
            <span>{t(lang, "inStock")}</span>
            <em>{t(lang, "availablePct", pct)}</em>
          </div>
          <div>
            <strong style={{ color: "#D97706" }}>{attention}</strong>
            <span>{t(lang, "lowOut")}</span>
            <em>{t(lang, "atZero", out.length)}</em>
          </div>
        </div>
      </div>

      <RecentBlock lang={lang} nav={nav} groups={groups} />
    </>
  );
}

function DeskHome({ user, lang, nav, total, out, inStock, attention, pct, latest, groups }) {
  return (
    <>
      <div className="desk-split">
        <div className="desk-left">
          <AlertBanner user={user} lang={lang} attention={attention} />
          <button className="qa-card is-add" onClick={() => nav("/inventory/new")}>
            <div className="qa-icon">
              <PlusIcon />
            </div>
            <div>
              <div className="qa-title">{t(lang, "addPart")}</div>
              <div className="qa-sub">{t(lang, "qaAddSub")}</div>
              <div className="qa-pill">{t(lang, "freeNow")}</div>
            </div>
          </button>
        </div>

        <div className="desk-right">
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
              <div className="stat-val stat-val-when">{latest ? formatWhen(latest) : "—"}</div>
              <div className="stat-note">{user?.shopName || t(lang, "yourShop")}</div>
            </div>
          </div>
        </div>
      </div>

      <RecentBlock lang={lang} nav={nav} groups={groups} />
    </>
  );
}

function AlertBanner({ user, lang, attention }) {
  if (attention > 0) {
    return (
      <div className="banner amber">
        <span className="banner-ic" aria-hidden="true">
          <WarnIcon size={22} />
        </span>
        <div className="banner-copy">
          <div className="banner-head">
            <strong>{t(lang, "partsRunningLow", attention)}</strong>
            <Link className="link" to="/low-stocks">
              {t(lang, "viewAll")} →
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="banner mint">
      <div className="banner-copy">
        {user?.shopName || user?.name ? t(lang, "welcomeBanner") : t(lang, "completeProfile")}
      </div>
      {!user?.shopName || !user?.name ? (
        <Link className="link" to="/account?section=profile">
          {t(lang, "settings")} →
        </Link>
      ) : null}
    </div>
  );
}

function RecentBlock({ lang, nav, groups }) {
  return (
    <section className="card dash-recent">
      <div className="card-hd">
        <div className="card-ttl">{t(lang, "recent")}</div>
      </div>
      <h2 className="dash-recent-ttl">{t(lang, "recent")}</h2>
      {groups.length ? (
        groups.map((group) => (
          <div className="dash-group" key={group.key}>
            <p className="dash-day">
              {group.key === "today"
                ? `${t(lang, "todayLabel")} (${group.items.length})`
                : `${formatDate(group.items[0].at)} (${group.items.length})`}
            </p>
            {group.items.map((row) => (
              <FeedRow key={row.id} row={row} />
            ))}
          </div>
        ))
      ) : (
        <EmptyHints lang={lang} nav={nav} />
      )}
    </section>
  );
}

function FeedRow({ row }) {
  const when = formatFeedWhen(row.at);
  return (
    <div className="list-row">
      <span className={`dot dash-dot is-${row.kind}`} aria-hidden="true">
        ●
      </span>
      <span className={`dash-ic is-${row.kind === "ok" ? "ok" : "activity"}`} aria-hidden="true">
        {row.kind === "ok" ? <CheckIcon /> : <ActivityIcon />}
      </span>
      <div className="dash-row-text">{row.text}</div>
      {when ? <span className="time">{when}</span> : null}
    </div>
  );
}

function EmptyHints({ lang, nav }) {
  return (
    <>
      <div className="list-row">
        <span className="dot dash-dot is-ok" aria-hidden="true">
          ●
        </span>
        <span className="dash-ic is-ok" aria-hidden="true">
          <CheckIcon />
        </span>
        <div className="dash-row-text">{t(lang, "hintAdd")}</div>
        <button className="link" onClick={() => nav("/inventory/new")}>
          {t(lang, "addPart")}
        </button>
      </div>
      <div className="list-row">
        <span className="dot dash-dot is-ok" aria-hidden="true">
          ●
        </span>
        <span className="dash-ic is-ok" aria-hidden="true">
          <CheckIcon />
        </span>
        <div className="dash-row-text">{t(lang, "hintProfile")}</div>
        <Link className="link" to="/account?section=profile">
          {t(lang, "settings")}
        </Link>
      </div>
      <div className="list-row">
        <span className="dot dash-dot is-warn" aria-hidden="true">
          ●
        </span>
        <span className="dash-ic is-activity" aria-hidden="true">
          <ActivityIcon />
        </span>
        <div className="dash-row-text">{t(lang, "hintAlerts")}</div>
      </div>
    </>
  );
}

function noticeLine(n) {
  const title = cleanDash(n?.title);
  const body = cleanDash(n?.body);
  if (title && body && body.toLowerCase().includes(title.toLowerCase())) return body;
  if (title && body) return `${title} ${body}`;
  return title || body || "";
}

function cleanDash(value) {
  return String(value || "")
    .replace(/\s*[—–−]+\s*/g, " ")
    .replace(/\s*-{2,}\s*/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function groupFeedByDay(feed) {
  const buckets = new Map();
  for (const row of feed) {
    const key = dayKey(row.at);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(row);
  }
  return [...buckets.entries()]
    .sort((a, b) => {
      if (a[0] === "today") return -1;
      if (b[0] === "today") return 1;
      return new Date(b[1][0].at) - new Date(a[1][0].at);
    })
    .map(([key, items]) => ({ key, items }));
}

function dayKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  if (d >= startToday) return "today";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatFeedWhen(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  if (d >= startToday) return "Today";
  return formatDate(iso);
}

function Chevron() {
  return (
    <svg className="dash-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function WarnIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 9v4M12 17h.01" />
      <path d="M12 3.4 2.8 19.2a1.2 1.2 0 0 0 1 1.8h16.4a1.2 1.2 0 0 0 1-1.8L12 3.4z" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h3.2l2.1-6 3.4 12 2.2-6H20" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 12 3.6 3.6 7.4-7.6" />
    </svg>
  );
}
