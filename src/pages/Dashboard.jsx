import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { inventoryApi, notificationApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { BUSINESS_TYPES, t, VEHICLES } from "../i18n";
import { formatDate, locationLabel, stockOf } from "../utils";
import "./Dashboard.css";

// Rows a phone shows per section before "View all": enough to fill one screen
// once the section's heading has been scrolled up under the top bar (screen
// height minus top bar, tab bar and heading, over a ~58px row). Bounded so a
// tall tablet doesn't dump the whole feed and a short phone still gets a few.
function screenRows() {
  if (typeof window === "undefined") return 8;
  return Math.max(5, Math.min(12, Math.floor((window.innerHeight - 190) / 58)));
}

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

  const [previewRows, setPreviewRows] = useState(screenRows);
  useEffect(() => {
    const onResize = () => setPreviewRows(screenRows());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  // Phones show a short preview (heading + View all sit on top); the full
  // list lives on the Activity / Low Stocks pages.
  // One row fewer than the screenful so the last card isn't cramped against the tab bar.
  const groups = groupFeedByDay(feed.slice(0, Math.max(4, previewRows - 1)));

  // First-run setup: a part in the catalog and a named shop. Until both are
  // done the "Get started" card shows; after that it's gone for good.
  const profileDone = Boolean(user?.shopName && user?.name);
  const setupPending = total === 0 || !profileDone;

  const deskGroups = groupFeedByDay(feed.slice(0, 6));

  const data = { user, lang, nav, total, out, low, inStock, attention, pct, groups, profileDone, setupPending, previewRows };

  if (loading) return <div className={`content dash ${mobile ? "is-last" : "is-desk"}`}>Loading…</div>;

  return (
    <div className={`content dash ${mobile ? "is-last" : "is-desk"}`}>
      {mobile ? <LastHome {...data} /> : <DeskHome {...data} groups={deskGroups} />}
    </div>
  );
}

function LastHome({ user, lang, nav, total, inStock, attention, out, low, groups, profileDone, setupPending, previewRows }) {
  return (
    <>
      <DashHero user={user} lang={lang} total={total} attention={attention} />
      <div className="stack-top">
        <div className="stack-actions">
          <button type="button" className="stack-link" onClick={() => nav("/inventory/new")}>
            <span className="stack-ic">
              <PlusIcon />
            </span>
            <span className="stack-link-ttl">{t(lang, "addPart")}</span>
            <Chevron />
          </button>
        </div>

        {total > 0 ? (
          <div className="stack-stats">
            <div className="stack-metrics">
              <Link to="/inventory">
                <strong>{total}</strong>
                <span>{t(lang, "totalParts")}</span>
              </Link>
              <Link to="/inventory?status=in">
                <strong style={{ color: "#16A34A" }}>{inStock.length}</strong>
                <span>{t(lang, "inStock")}</span>
              </Link>
              <Link to="/low-stocks">
                <strong style={{ color: "#D97706" }}>{attention}</strong>
                <span>{t(lang, "lowOut")}</span>
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {attention > 0 ? <LowList lang={lang} rows={[...out, ...low]} total={total} limit={previewRows} /> : null}
      {setupPending ? <GetStarted lang={lang} nav={nav} total={total} profileDone={profileDone} /> : null}
      {groups.length ? <RecentBlock lang={lang} groups={groups} /> : null}
    </>
  );
}

function DeskHome({ lang, nav, user, total, out, low, inStock, attention, pct, groups, profileDone, setupPending }) {
  const isNew = total === 0;
  const start = setupPending ? <GetStarted lang={lang} nav={nav} total={total} profileDone={profileDone} /> : null;
  const recent = groups.length ? <RecentBlock lang={lang} groups={groups} /> : null;
  return (
    <>
      <DashHero user={user} lang={lang} total={total} attention={attention} />

      {isNew ? null : (
        <div className="desk-cards">
          <button type="button" className="add-card" onClick={() => nav("/inventory/new")}>
            <span className="add-card-ic" aria-hidden="true">
              <PlusIcon />
            </span>
            <span className="add-card-copy">
              <strong>{t(lang, "addPart")}</strong>
              <span>{t(lang, "addHeroSub")}</span>
            </span>
          </button>
          <StatCard
            to="/inventory"
            icon={<BoxIcon />}
            label={t(lang, "totalParts")}
            value={total}
            note={t(lang, "inCatalog")}
          />
          <StatCard
            to="/inventory?status=in"
            tone="ok"
            icon={<CheckIcon />}
            label={t(lang, "inStock")}
            value={inStock.length}
            bar={pct}
            note={t(lang, "availablePct", pct)}
          />
          <StatCard
            to="/low-stocks"
            tone={attention > 0 ? "warn" : undefined}
            icon={<WarnIcon />}
            label={t(lang, "lowOut")}
            value={attention}
            note={t(lang, "atZero", out.length)}
            cta={attention > 0 ? t(lang, "viewShort") : undefined}
          />
        </div>
      )}

      {/* A brand-new shop has no stock to list, so its two panels stretch to the
          bottom of the page with their content centred instead of leaving a
          blank band under them. */}
      <div className={`desk-bottom${isNew ? " is-fill" : ""}`}>
        {isNew ? start : <LowList lang={lang} rows={[...out, ...low]} total={total} />}
        <div className="desk-bottom-side">
          {isNew ? null : start}
          {recent || (isNew ? <ActivityEmpty lang={lang} /> : null)}
        </div>
      </div>
    </>
  );
}

/**
 * Top of the dashboard: who the shop is (name, owner, type, place, vehicles),
 * whether stock needs attention, and a link to edit the details. Styled like the
 * landing page — mint panel with the brand grid, serif shop name.
 */
function DashHero({ user, lang, total, attention }) {
  const shop = user?.shopName;
  const who = shop || user?.name;
  const type = BUSINESS_TYPES.find((b) => b.id === user?.businessType)?.label;
  const place = locationLabel(user);
  const vehicles = (user?.vehicleCategories || [])
    .map((id) => VEHICLES.find((v) => v.id === id)?.label)
    .filter(Boolean);
  const facts = [user?.name && shop ? t(lang, "shopOwner", user.name) : "", type, place, user?.phone ? `+91 ${user.phone}` : ""].filter(
    Boolean,
  );
  const status =
    total === 0
      ? { tone: "new", text: t(lang, "dashSubNew"), to: "/inventory/new" }
      : attention > 0
        ? { tone: "warn", text: t(lang, "dashSubLow", attention), to: "/low-stocks" }
        : { tone: "ok", text: t(lang, "dashSubOk") };
  const pill = (
    <>
      <span className="hero-pill-ic" aria-hidden="true">
        {status.tone === "warn" ? <WarnIcon size={15} /> : status.tone === "ok" ? <CheckIcon /> : <PlusIcon />}
      </span>
      {status.text}
      {status.to ? <span aria-hidden="true"> →</span> : null}
    </>
  );
  return (
    <section className="hero" aria-label={t(lang, "shopDetailsTitle")}>
      <div className="hero-id">
        <span className="hero-tile" aria-hidden="true">
          {user?.shopPhotoUrl ? <img src={user.shopPhotoUrl} alt="" /> : <StoreIcon />}
        </span>
        <div className="hero-txt">
          <p className="hero-kicker">{t(lang, "dashWelcome")}</p>
          <h1 className="hero-name">{who || t(lang, "yourShop")}</h1>
          {facts.length ? (
            <p className="hero-facts">
              {facts.map((f) => (
                <span key={f}>{f}</span>
              ))}
            </p>
          ) : null}
          {vehicles.length ? (
            <div className="hero-chips">
              {vehicles.map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="hero-side">
        {status.to ? (
          <Link to={status.to} className={`hero-pill is-${status.tone}`}>
            {pill}
          </Link>
        ) : (
          <span className={`hero-pill is-${status.tone}`}>{pill}</span>
        )}
        {shop ? (
          <Link to="/account?section=shop" className="hero-edit">
            {t(lang, "shopEditDetails")}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function StatCard({ to, tone, icon, label, value, note, cta, bar }) {
  const body = (
    <>
      <span className="stat-tile" aria-hidden="true">
        {icon}
      </span>
      <div className="stat-body">
        <div className="stat-val">{value}</div>
        <div className="stat-lbl">{label}</div>
        <div className="stat-note">
          {note}
          {cta ? (
            <>
              {" · "}
              <span className="stat-cta">{cta}</span>
            </>
          ) : null}
        </div>
        {bar != null ? (
          <div className="stat-bar" aria-hidden="true">
            <span style={{ width: `${bar}%` }} />
          </div>
        ) : null}
      </div>
    </>
  );
  const cls = `stat-card${to ? " is-link" : ""}${tone ? ` is-${tone}` : ""}`;
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function LowList({ lang, rows, total, limit = 6 }) {
  const shown = [...rows].sort((a, b) => a.quantity - b.quantity).slice(0, limit);
  return (
    <section className="card dash-low">
      <div className="card-hd">
        <div className="card-ttl">{t(lang, "runningLow")}</div>
        {rows.length ? (
          <Link className="link dash-viewall" to="/low-stocks">
            {t(lang, "viewAll")} →
          </Link>
        ) : null}
      </div>
      {shown.length ? (
        shown.map((item) => (
          <Link key={item.id} to="/low-stocks" className="list-row dash-low-row">
            <div className="dash-row-text">{item.partName}</div>
            {stockOf(item) === "OUT_OF_STOCK" ? (
              <span className="badge b-r">{t(lang, "out")}</span>
            ) : (
              <span className="badge b-a">
                {item.quantity} {t(lang, "leftShort")}
              </span>
            )}
          </Link>
        ))
      ) : (
        <p className="dash-low-empty">{t(lang, total ? "allStocked" : "lowEmptyNew")}</p>
      )}
    </section>
  );
}

function GetStarted({ lang, nav, total, profileDone }) {
  const steps = [
    { key: "shop", done: true, text: t(lang, "stepShop") },
    { key: "part", done: total > 0, text: t(lang, "stepAddPart"), action: t(lang, "addPart"), go: () => nav("/inventory/new") },
    { key: "profile", done: profileDone, text: t(lang, "stepProfile"), action: t(lang, "settings"), go: () => nav("/account?section=profile") },
  ];
  const done = steps.filter((x) => x.done).length;
  return (
    <section className="card dash-recent dash-start">
      <div className="card-hd">
        <div className="card-ttl">{t(lang, "getStarted")}</div>
        <span className="dash-start-count">{t(lang, "setupProgress", done, steps.length)}</span>
      </div>
      <h2 className="dash-recent-ttl">{t(lang, "getStarted")}</h2>
      <div className="dash-start-bar" aria-hidden="true">
        <span style={{ width: `${Math.round((done / steps.length) * 100)}%` }} />
      </div>
      <div className="dash-start-rows">
        {steps.map((step) => (
          <div className={`list-row${step.done ? " is-done" : ""}`} key={step.key}>
            <span className={`dot dash-dot is-${step.done ? "ok" : "warn"}`} aria-hidden="true">
              ●
            </span>
            <span className={`dash-ic ${step.done ? "is-ok" : "is-todo"}`} aria-hidden="true">
              {step.done ? <CheckIcon /> : null}
            </span>
            <div className="dash-row-text">{step.text}</div>
            {step.done ? (
              <span className="dash-start-done">{t(lang, "stepDone")}</span>
            ) : (
              <button type="button" className="link" onClick={step.go}>
                {step.action}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivityEmpty({ lang }) {
  return (
    <section className="card dash-activity-empty">
      <span className="dash-activity-ic" aria-hidden="true">
        <ActivityIcon />
      </span>
      <p className="dash-activity-ttl">{t(lang, "activityEmptyTitle")}</p>
      <p className="dash-activity-sub">{t(lang, "activityEmptySub")}</p>
    </section>
  );
}

function RecentBlock({ lang, groups }) {
  return (
    <section className="card dash-recent">
      <div className="card-hd">
        <div className="card-ttl">{t(lang, "recent")}</div>
        <Link className="link dash-viewall" to="/activity">
          {t(lang, "viewAll")} →
        </Link>
      </div>
      <div className="dash-recent-bar">
        <h2 className="dash-recent-ttl">{t(lang, "recent")}</h2>
        <Link className="link dash-viewall" to="/activity">
          {t(lang, "viewAll")} →
        </Link>
      </div>
      {groups.map((group) => (
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
      ))}
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

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V7l1.5-3h13L20 7v2a2.5 2.5 0 0 1-4.5 1.5A2.5 2.5 0 0 1 12 11a2.5 2.5 0 0 1-3.5-.5A2.5 2.5 0 0 1 4 9z" />
      <path d="M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
      <path d="M10 20v-5h4v5" />
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

function BoxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
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
