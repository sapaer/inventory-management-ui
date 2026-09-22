import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { inventoryApi } from "../api";
import { useLang } from "../context/LangContext";
import { t, VEHICLES } from "../i18n";
import { formatPrice, stockOf } from "../utils";
import { InfoNote, PageHero } from "../components/PageHero";
import DateRangePicker, { formatRangeLabel, fromKey } from "../components/DateRangePicker";
import PartPicker from "../components/PartPicker";
import "./Insights.css";

// Quick presets; "Custom" is the calendar button (DateRangePicker) instead of
// a chip — picking a date there is what covers "a particular date" or "2 days".
const QUICK_RANGES = [
  { id: "24h", key: "insLast24h" },
  { id: "7", key: "last7" },
  { id: "30", key: "last30" },
  { id: "90", key: "last90" },
];
const MAX_PAGES = 10; // 100 events a page

const DAY = 86400000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Example shop so an empty account can see the page with numbers on it.
// Client-side only, never sent anywhere.
const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();
const DUMMY_ITEMS = [
  { id: "d1", partName: "Brake Pad Set — Front", quantity: 2, minQuantity: 6, sellingPrice: 650, vehicleCategory: "FOUR_WHEELER", updatedAt: daysAgo(2) },
  { id: "d2", partName: "Engine Oil Filter", quantity: 0, minQuantity: 10, sellingPrice: 150, vehicleCategory: "TWO_WHEELER", updatedAt: daysAgo(1) },
  { id: "d3", partName: "Clutch Plate", quantity: 5, minQuantity: 4, sellingPrice: 850, vehicleCategory: "TWO_WHEELER", updatedAt: daysAgo(5) },
  { id: "d4", partName: "Headlight Assembly", quantity: 0, minQuantity: 3, sellingPrice: 1950, vehicleCategory: "FOUR_WHEELER", updatedAt: daysAgo(3) },
  { id: "d5", partName: "Battery 12V 35Ah", quantity: 8, minQuantity: 5, sellingPrice: 3100, vehicleCategory: "FOUR_WHEELER", updatedAt: daysAgo(40) },
  { id: "d6", partName: "Chain Sprocket Kit", quantity: 12, minQuantity: 5, sellingPrice: 1150, vehicleCategory: "TWO_WHEELER", updatedAt: daysAgo(1) },
  { id: "d7", partName: "Air Filter", quantity: 3, minQuantity: 8, sellingPrice: 250, vehicleCategory: "COMMERCIAL", updatedAt: daysAgo(4) },
  { id: "d8", partName: "Wiper Blade Pair", quantity: 15, minQuantity: 6, sellingPrice: 350, vehicleCategory: "FOUR_WHEELER", updatedAt: daysAgo(60) },
  { id: "d9", partName: "Auto Rickshaw Tyre", quantity: 6, minQuantity: 4, sellingPrice: 1450, vehicleCategory: "THREE_WHEELER", updatedAt: daysAgo(7) },
  { id: "d10", partName: "EV Charging Cable", quantity: 4, minQuantity: 3, sellingPrice: 2400, vehicleCategory: "EV", updatedAt: daysAgo(2) },
  { id: "d11", partName: "Spark Plug (Set of 4)", quantity: 20, minQuantity: 8, sellingPrice: 480, vehicleCategory: "FOUR_WHEELER", updatedAt: daysAgo(10) },
  { id: "d12", partName: "Radiator Coolant 1L", quantity: 18, minQuantity: 6, sellingPrice: 280, vehicleCategory: "COMMERCIAL", updatedAt: daysAgo(95) },
];
const QUIET = new Set(["d5", "d8", "d12"]);

function dummySales() {
  const out = [];
  DUMMY_ITEMS.forEach((item, k) => {
    if (QUIET.has(item.id)) return;
    for (let d = 0; d < 90; d++) {
      if ((d * 37 + k * 11 + (d % 5) * k) % 7 > 1) continue;
      const at = new Date(Date.now() - d * DAY);
      at.setHours(11, 0, 0, 0);
      out.push({ partId: item.id, partName: item.partName, qty: ((d * 3 + k) % 3) + 1, at });
    }
  });
  return out;
}

// ₹ axis labels: 950, 1.5k, 20k, 1.2L
function compactMoney(v) {
  if (v >= 100000) return `₹${+(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${+(v / 1000).toFixed(1)}k`;
  return `₹${v}`;
}

// Ticks at 0, half and top, with the top on a round number.
function niceMax(m) {
  if (m <= 1) return 2;
  const pow = 10 ** Math.floor(Math.log10(m));
  return [1, 2, 4, 8, 10].map((c) => c * pow).find((v) => v >= m) || 10 * pow;
}

// Bars: one per day for 7 and 30 days, one per 3 days for 90.
function bucketSales(sales, days) {
  const size = days === 90 ? 3 : 1;
  const n = days / size;
  const today = startOfDay(new Date());
  const buckets = Array.from({ length: n }, (_, i) => {
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (n - 1 - i) * size);
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (size - 1));
    return { start, end, units: 0, amount: 0 };
  });
  for (const s of sales) {
    const ago = Math.round((today - startOfDay(s.at)) / DAY);
    const i = n - 1 - Math.floor(ago / size);
    if (i >= 0 && i < n) {
      buckets[i].units += s.qty;
      buckets[i].amount += s.amount;
    }
  }
  return buckets;
}

const fmtDay = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function Insights() {
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quick, setQuick] = useState("30");
  const [dates, setDates] = useState({ from: "", to: "" });
  const [preview, setPreview] = useState(false);
  const [trendPartId, setTrendPartId] = useState("");
  const [sales, setSales] = useState({ list: [], units: 0, received: 0, failed: false, loading: true });

  const customActive = Boolean(dates.from || dates.to);

  // {start, end, days, is24h} from whichever control is active. `end` is
  // null for every preset (open-ended — "up to now"); only a custom range
  // has a real upper bound.
  const resolved = useMemo(() => {
    const now = new Date();
    if (customActive) {
      const s = fromKey(dates.from) || fromKey(dates.to);
      const eDay = fromKey(dates.to) || s;
      const end = new Date(eDay.getFullYear(), eDay.getMonth(), eDay.getDate() + 1);
      return { start: s, end, days: Math.max(1, Math.round((end - s) / DAY)), is24h: false };
    }
    if (quick === "24h") return { start: new Date(now.getTime() - DAY), end: null, days: 1, is24h: true };
    const days = Number(quick);
    return { start: new Date(startOfDay(now).getTime() - (days - 1) * DAY), end: null, days, is24h: false };
  }, [quick, dates, customActive]);
  const range = resolved.days;
  const rangeLabel = customActive
    ? formatRangeLabel(dates)
    : resolved.is24h
      ? t(lang, "insRangeLabel24h")
      : t(lang, "insRangeLabel", range);

  useEffect(() => {
    inventoryApi
      .list()
      .then((rows) => setItems(Array.isArray(rows) ? rows : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Real sales for the range, straight from the activity log.
  useEffect(() => {
    if (preview) return undefined;
    let stale = false;
    setSales((s) => ({ ...s, loading: true }));
    const from = resolved.start.toISOString();
    const to = resolved.end ? resolved.end.toISOString() : undefined;
    (async () => {
      const list = [];
      let units = 0;
      let received = 0;
      try {
        for (let page = 1; page <= MAX_PAGES; page++) {
          const res = await inventoryApi.activity({ type: "SOLD", from, to, page, limit: 100 });
          units = res.stats?.unitsSold ?? 0;
          received = res.stats?.unitsReceived ?? 0;
          for (const e of res.content || []) {
            list.push({ partId: e.partId, partName: e.partName, qty: Math.max(0, e.qtyBefore - e.qtyAfter), at: new Date(e.createdAt) });
          }
          if (list.length >= (res.total || 0)) break;
        }
        if (!stale) setSales({ list, units, received, failed: false, loading: false });
      } catch {
        if (!stale) setSales({ list: [], units: 0, received: 0, failed: true, loading: false });
      }
    })();
    return () => {
      stale = true;
    };
  }, [resolved, preview]);

  const displayItems = preview ? DUMMY_ITEMS : items;
  const soldList = useMemo(() => {
    // The sample-data preview is a client-side fake, not filtered by the
    // backend — approximated here as "within the last `range` days", which
    // is exact for the 7/30/90 presets but only roughly right for 24h or a
    // custom range that doesn't end today.
    const raw = preview ? dummySales().filter((s) => Date.now() - s.at <= range * DAY) : sales.list;
    const price = new Map(displayItems.map((i) => [i.id, Number(i.sellingPrice) || 0]));
    return raw.map((s) => ({ ...s, amount: s.qty * (price.get(s.partId) || 0) }));
  }, [preview, sales.list, range, displayItems]);
  const unitsSold = preview ? soldList.reduce((n, s) => n + s.qty, 0) : sales.units;
  const unitsReceived = preview ? Math.round(unitsSold * 0.8) : sales.received;
  const salesLoading = !preview && sales.loading;

  const stats = useMemo(() => {
    const out = displayItems.filter((i) => stockOf(i) === "OUT_OF_STOCK");
    const low = displayItems.filter((i) => stockOf(i) === "LOW_STOCK");
    const inStock = displayItems.filter((i) => stockOf(i) === "IN_STOCK");
    const worth = (i) => (Number(i.quantity) || 0) * (Number(i.sellingPrice) || 0);
    const units = displayItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

    // In stock, but nothing sold for the whole range (and not added inside it).
    const soldIds = new Set(soldList.map((s) => s.partId));
    const cutoff = Date.now() - range * DAY;
    const idle = displayItems.filter(
      (i) => (Number(i.quantity) || 0) > 0 && !soldIds.has(i.id) && new Date(i.createdAt || i.updatedAt).getTime() < cutoff,
    );

    const perPart = new Map();
    for (const s of soldList) {
      const row = perPart.get(s.partId) || { id: s.partId, name: s.partName, units: 0 };
      row.units += s.qty;
      perPart.set(s.partId, row);
    }
    const top = [...perPart.values()].sort((a, b) => b.units - a.units).slice(0, 5);

    const byVehicle = VEHICLES.map((v) => ({
      ...v,
      value: displayItems.filter((i) => i.vehicleCategory === v.id).reduce((s, i) => s + worth(i), 0),
    })).filter((v) => v.value > 0);

    return {
      out,
      low,
      inStock,
      total: displayItems.length,
      units,
      worth: displayItems.reduce((s, i) => s + worth(i), 0),
      idle,
      idleWorth: idle.reduce((s, i) => s + worth(i), 0),
      top,
      maxTop: Math.max(1, ...top.map((r) => r.units)),
      byVehicle,
      maxVehicle: Math.max(1, ...byVehicle.map((v) => v.value)),
    };
  }, [displayItems, soldList, range]);

  const buckets = useMemo(() => bucketSales(soldList, range), [soldList, range]);
  const salesTotal = soldList.reduce((n, s) => n + s.amount, 0);

  const trendPart = displayItems.find((i) => i.id === trendPartId) || null;
  const trendSold = useMemo(() => soldList.filter((s) => s.partId === trendPartId), [soldList, trendPartId]);
  const trendBuckets = useMemo(() => bucketSales(trendSold, range), [trendSold, range]);
  const trendUnits = trendSold.reduce((n, s) => n + s.qty, 0);

  function namesLine(list) {
    const names = list.slice(0, 2).map((i) => i.partName).join(", ");
    const more = list.length - 2;
    return more > 0 ? `${names} ${t(lang, "andNMore", more)}` : names;
  }

  if (loading) return <div className="content ins">Loading…</div>;

  const restock = stats.out.length + stats.low.length;
  const pct = (n) => (stats.total ? (n / stats.total) * 100 : 0);
  const attention = [
    stats.out.length > 0 && { key: "out", tone: "crit", to: "/low-stocks", title: t(lang, "insOutOfStock", stats.out.length), meta: namesLine(stats.out) },
    stats.low.length > 0 && { key: "low", tone: "warn", to: "/low-stocks", title: t(lang, "insRunningLow", stats.low.length), meta: namesLine(stats.low) },
    stats.idle.length > 0 && {
      key: "idle",
      tone: "idle",
      to: "/inventory",
      title: t(lang, "insNotSold", stats.idle.length, rangeLabel),
      meta: `${namesLine(stats.idle)} · ${t(lang, "insTiedUp", formatPrice(stats.idleWorth))}`,
    },
  ].filter(Boolean);

  return (
    <div className="content ins">
      <PageHero
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
          </svg>
        }
        kicker={preview ? t(lang, "sampleDataBadge") : t(lang, "insKicker")}
        title={t(lang, "insights")}
      />
      <InfoNote id="insights">{t(lang, "insightsSub")}</InfoNote>

      <div className="ins-toolbar">
        <div className="ins-chips" role="group" aria-label={t(lang, "insRange")}>
          {QUICK_RANGES.map((q) => (
            <button
              key={q.id}
              type="button"
              className={`ins-chip${!customActive && quick === q.id ? " on" : ""}`}
              onClick={() => {
                setQuick(q.id);
                setDates({ from: "", to: "" });
              }}
            >
              {t(lang, q.key)}
            </button>
          ))}
        </div>
        <DateRangePicker value={dates} onChange={setDates} />
        <button type="button" className="ins-preview-btn" onClick={() => setPreview((v) => !v)}>
          {t(lang, preview ? "exitSampleData" : "previewSampleData")}
        </button>
      </div>

      <div className="ins-tiles">
        <Tile tone="worth" icon={<WalletIcon />} label={t(lang, "insWorth")} value={formatPrice(stats.worth)} sub={t(lang, "insWorthSub", stats.total, stats.units)} />
        <Tile tone="sold" icon={<MinusIcon />} label={t(lang, "insSoldLbl")} value={salesLoading ? "…" : unitsSold} sub={t(lang, "insInRange", rangeLabel)} />
        <Tile tone="recv" icon={<PlusIcon />} label={t(lang, "insRecvLbl")} value={salesLoading ? "…" : unitsReceived} sub={t(lang, "insInRange", rangeLabel)} />
        <Tile
          tone={restock ? "alert" : "ok"}
          icon={<BoxIcon />}
          label={t(lang, "insRestockLbl")}
          value={restock}
          sub={restock ? t(lang, "insRestockSub", stats.out.length, stats.low.length) : t(lang, "insAllStocked")}
        />
      </div>

      <div className="ins-grid">
        <section className="ins-card ins-span">
          <header className="ins-card-hd">
            <h2>{t(lang, "insSalesTtl")}</h2>
            <p>
              {t(lang, range === 90 ? "insSalesSub3" : "insSalesSub1")}
              {!salesLoading && unitsSold > 0 ? <b> · {t(lang, "insSalesTotal", formatPrice(salesTotal))}</b> : null}
            </p>
          </header>
          {sales.failed && !preview ? (
            <p className="ins-empty">{t(lang, "insSalesFail")}</p>
          ) : !salesLoading && unitsSold === 0 ? (
            <div className="ins-empty">
              <strong>{t(lang, "insSalesNone")}</strong>
              <span>{t(lang, "insSalesNoneSub")}</span>
              <Link to="/stock-update" className="ins-link">
                {t(lang, "insGoUpdate")}
              </Link>
            </div>
          ) : (
            <>
              <SalesChart lang={lang} buckets={buckets} size={range === 90 ? 3 : 1} />
              <p className="ins-foot">{t(lang, "insSalesNote")}</p>
            </>
          )}
        </section>

        <section className="ins-card ins-span ins-trend">
          <header className="ins-card-hd">
            <h2>{t(lang, "insTrendTtl")}</h2>
            <p>{t(lang, "insInRange", rangeLabel)}</p>
          </header>

          {trendPart ? (
            <div className="ins-trend-picked">
              <span>{trendPart.partName}</span>
              <button type="button" className="ins-trend-x" aria-label={t(lang, "insTrendClear")} onClick={() => setTrendPartId("")}>
                ×
              </button>
            </div>
          ) : (
            <PartPicker
              parts={displayItems}
              onChange={setTrendPartId}
              placeholder={t(lang, "insTrendSearch")}
              className="ins-trend-pick"
            />
          )}

          {!trendPart ? (
            <p className="ins-empty">{t(lang, "insTrendEmpty")}</p>
          ) : trendUnits === 0 ? (
            <p className="ins-empty">{t(lang, "insTrendNone", rangeLabel)}</p>
          ) : (
            <>
              <SalesChart lang={lang} buckets={trendBuckets} size={range === 90 ? 3 : 1} />
              <p className="ins-foot">{t(lang, "insUnitsSold", trendUnits)}</p>
            </>
          )}
        </section>

        <section className="ins-card">
          <header className="ins-card-hd">
            <h2>{t(lang, "stockHealth")}</h2>
            <p>{t(lang, "insHealthSub", stats.total)}</p>
          </header>
          <div className="ins-meter" role="img" aria-label={t(lang, "stockHealth")}>
            <span className="is-ok" style={{ width: `${pct(stats.inStock.length)}%` }} />
            <span className="is-low" style={{ width: `${pct(stats.low.length)}%` }} />
            <span className="is-out" style={{ width: `${pct(stats.out.length)}%` }} />
          </div>
          <ul className="ins-key">
            <li>
              <i className="is-ok" />
              {t(lang, "inStock")}
              <b>{stats.inStock.length}</b>
            </li>
            <li>
              <i className="is-low" />
              {t(lang, "low")}
              <b>{stats.low.length}</b>
            </li>
            <li>
              <i className="is-out" />
              {t(lang, "out")}
              <b>{stats.out.length}</b>
            </li>
          </ul>
        </section>

        <section className="ins-card">
          <header className="ins-card-hd">
            <h2>{t(lang, "insTopTtl")}</h2>
            <p>{t(lang, "insInRange", rangeLabel)}</p>
          </header>
          {stats.top.length ? (
            <ol className="ins-rank">
              {stats.top.map((r, i) => (
                <li key={r.id}>
                  <span className="ins-rank-n">{i + 1}</span>
                  <div className="ins-rank-main">
                    <div className="ins-rank-top">
                      <span className="ins-rank-name">{r.name}</span>
                      <b>{t(lang, "insUnitsSold", r.units)}</b>
                    </div>
                    <div className="ins-track">
                      <span className="is-sold" style={{ width: `${Math.max(6, (r.units / stats.maxTop) * 100)}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="ins-empty">{salesLoading ? "…" : t(lang, "insTopNone")}</p>
          )}
        </section>

        <section className="ins-card">
          <header className="ins-card-hd">
            <h2>{t(lang, "needsAttentionToday")}</h2>
          </header>
          {attention.length ? (
            <ul className="ins-attn">
              {attention.map((a) => (
                <li key={a.key}>
                  <Link to={a.to} className="ins-attn-row">
                    <span className={`ins-ic is-${a.tone}`}>{a.tone === "crit" ? <AlertIcon /> : a.tone === "warn" ? <BellIcon /> : <ClockIcon />}</span>
                    <span className="ins-attn-body">
                      <strong>{a.title}</strong>
                      <span>{a.meta}</span>
                    </span>
                    <ChevronIcon />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ins-empty">{t(lang, "attentionAllGood")}</p>
          )}
        </section>

        <section className="ins-card">
          <header className="ins-card-hd">
            <h2>{t(lang, "stockValueByVehicle")}</h2>
            <p>{t(lang, "insAtPrice")}</p>
          </header>
          {stats.byVehicle.length ? (
            <ul className="ins-veh">
              {stats.byVehicle.map((v) => (
                <li key={v.id}>
                  <div className="ins-rank-top">
                    <span className="ins-rank-name">{v.label}</span>
                    <b>{formatPrice(v.value)}</b>
                  </div>
                  <div className="ins-track">
                    <span style={{ width: `${Math.max(6, (v.value / stats.maxVehicle) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ins-empty">—</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Tile({ tone, icon, label, value, sub }) {
  return (
    <div className={`ins-tile is-${tone}`}>
      <span className="ins-tile-ic" aria-hidden="true">
        {icon}
      </span>
      <p className="ins-tile-lbl">{label}</p>
      <p className="ins-tile-val">{value}</p>
      <p className="ins-tile-sub">{sub}</p>
    </div>
  );
}

/* Units sold per day (per 3 days over 90) as an area line. The SVG is drawn at
   the plot's real pixel size so nothing stretches; dots and tooltips are HTML
   on top of it. The scale tops out on a round number and the labels name
   values the line actually reaches. */
function SalesChart({ lang, buckets, size }) {
  const max = niceMax(Math.max(0, ...buckets.map((b) => b.amount)));
  const n = buckets.length;
  const every = n <= 7 ? 1 : n <= 15 ? 2 : 5;
  const showLabel = (i) => (n - 1 - i) % every === 0;
  const tip = (b) => `${size === 1 ? fmtDay(b.end) : `${fmtDay(b.start)} – ${fmtDay(b.end)}`} · ${formatPrice(b.amount)} · ${t(lang, "insUnitsSold", b.units)}`;

  const plot = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = plot.current;
    if (!el) return undefined;
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pts = buckets.map((b, i) => [((i + 0.5) / n) * box.w, box.h - (b.amount / max) * box.h]);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = pts.length ? `${pts[0][0]},${box.h} ${line} ${pts[pts.length - 1][0]},${box.h}` : "";

  return (
    <div className="ins-chart">
      <div className="ins-plot" ref={plot}>
        {[0, 0.5, 1].map((f) => (
          <div className="ins-gl" key={f} style={{ bottom: `${f * 100}%` }}>
            <span>{compactMoney(Math.round(max * f))}</span>
          </div>
        ))}
        {box.w ? (
          <svg className="ins-svg" width={box.w} height={box.h} aria-hidden="true">
            <polygon points={area} className="ins-area" />
            <polyline points={line} className="ins-line" />
          </svg>
        ) : null}
        <div className={`ins-cols${n > 15 ? " is-dense" : ""}`}>
          {buckets.map((b, i) => (
            <div key={i} className={`ins-col${i < 3 ? " edge-l" : ""}${i >= n - 3 ? " edge-r" : ""}${i === n - 1 ? " is-last" : ""}`} data-tip={tip(b)} tabIndex={0} aria-label={tip(b)}>
              <span className="ins-dot" style={{ bottom: `${(b.amount / max) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="ins-xl">
        {buckets.map((b, i) => (
          <span key={i}>{showLabel(i) ? <em>{fmtDay(b.end)}</em> : null}</span>
        ))}
      </div>
    </div>
  );
}

const Ic = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const WalletIcon = () => (
  <Ic>
    <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
    <path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2Z" />
    <path d="M16 14h2" />
  </Ic>
);
const MinusIcon = () => (
  <Ic>
    <path d="M5 12h14" />
  </Ic>
);
const PlusIcon = () => (
  <Ic>
    <path d="M12 5v14M5 12h14" />
  </Ic>
);
const BoxIcon = () => (
  <Ic>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96 12 12l8.73-5.04M12 22.08V12" />
  </Ic>
);
const ClockIcon = () => (
  <Ic size={16}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </Ic>
);
const AlertIcon = () => (
  <Ic size={16}>
    <path d="M12 9v4M12 17h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </Ic>
);
const BellIcon = () => (
  <Ic size={16}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Ic>
);
const ChevronIcon = () => (
  <span className="ins-chev">
    <Ic size={16}>
      <path d="m9 6 6 6-6 6" />
    </Ic>
  </span>
);
