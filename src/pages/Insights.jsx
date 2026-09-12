import { useEffect, useMemo, useState } from "react";
import { inventoryApi } from "../api";
import { useLang } from "../context/LangContext";
import { t, VEHICLES, vehicleLabel } from "../i18n";
import { formatPrice, stockOf } from "../utils";
import "./Insights.css";

const RANGE_DAYS = [7, 30, 90];

// Fake catalog so a new/empty shop can see what this page looks like with
// real numbers on it — never sent anywhere, purely a client-side preview.
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const DUMMY_ITEMS = [
  { id: "d1", partName: "Brake Pad Set — Front", quantity: 2, minQuantity: 6, costPrice: 480, sellingPrice: 650, vehicleCategory: "FOUR_WHEELER", updatedAt: daysAgo(2) },
  { id: "d2", partName: "Engine Oil Filter", quantity: 0, minQuantity: 10, costPrice: 90, sellingPrice: 150, vehicleCategory: "TWO_WHEELER", updatedAt: daysAgo(1) },
  { id: "d3", partName: "Clutch Plate", quantity: 5, minQuantity: 4, costPrice: 620, sellingPrice: 850, vehicleCategory: "TWO_WHEELER", updatedAt: daysAgo(5) },
  { id: "d4", partName: "Headlight Assembly", quantity: 0, minQuantity: 3, costPrice: 1450, sellingPrice: 1950, vehicleCategory: "FOUR_WHEELER", updatedAt: daysAgo(3) },
  { id: "d5", partName: "Battery 12V 35Ah", quantity: 8, minQuantity: 5, costPrice: 2400, sellingPrice: 3100, vehicleCategory: "FOUR_WHEELER", updatedAt: daysAgo(40) },
  { id: "d6", partName: "Chain Sprocket Kit", quantity: 12, minQuantity: 5, costPrice: 850, sellingPrice: 1150, vehicleCategory: "TWO_WHEELER", updatedAt: daysAgo(1) },
  { id: "d7", partName: "Air Filter", quantity: 3, minQuantity: 8, costPrice: 150, sellingPrice: 250, vehicleCategory: "COMMERCIAL", updatedAt: daysAgo(4) },
  { id: "d8", partName: "Wiper Blade Pair", quantity: 15, minQuantity: 6, costPrice: 220, sellingPrice: 350, vehicleCategory: "FOUR_WHEELER", updatedAt: daysAgo(60) },
  { id: "d9", partName: "Auto Rickshaw Tyre", quantity: 6, minQuantity: 4, costPrice: 1100, sellingPrice: 1450, vehicleCategory: "THREE_WHEELER", updatedAt: daysAgo(7) },
  { id: "d10", partName: "EV Charging Cable", quantity: 4, minQuantity: 3, costPrice: 1800, sellingPrice: 2400, vehicleCategory: "EV", updatedAt: daysAgo(2) },
  { id: "d11", partName: "Spark Plug (Set of 4)", quantity: 20, minQuantity: 8, costPrice: 320, sellingPrice: 480, vehicleCategory: "FOUR_WHEELER", updatedAt: daysAgo(10) },
  { id: "d12", partName: "Radiator Coolant 1L", quantity: 18, minQuantity: 6, costPrice: 180, sellingPrice: 280, vehicleCategory: "COMMERCIAL", updatedAt: daysAgo(95) },
];

function restockCost(list) {
  return list.reduce((sum, i) => {
    const gap = Math.max((Number(i.minQuantity) || 0) - (Number(i.quantity) || 0), 0);
    return sum + gap * (Number(i.costPrice) || 0);
  }, 0);
}

export default function Insights() {
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    inventoryApi
      .list()
      .then((rows) => setItems(Array.isArray(rows) ? rows : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const displayItems = preview ? DUMMY_ITEMS : items;

  const stats = useMemo(() => {
    const out = displayItems.filter((i) => stockOf(i) === "OUT_OF_STOCK");
    const low = displayItems.filter((i) => stockOf(i) === "LOW_STOCK");
    const inStock = displayItems.filter((i) => stockOf(i) === "IN_STOCK");
    const total = displayItems.length;

    const costValue = displayItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.costPrice) || 0), 0);
    const sellValue = displayItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.sellingPrice) || 0), 0);
    const margin = sellValue - costValue;
    const marginPct = sellValue ? Math.round((margin / sellValue) * 1000) / 10 : 0;

    const outCost = restockCost(out);
    const lowCost = restockCost(low);

    const cutoff = Date.now() - range * 86400000;
    const dead = displayItems.filter(
      (i) => (Number(i.quantity) || 0) > 0 && new Date(i.updatedAt).getTime() < cutoff,
    );
    const deadValue = dead.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.costPrice) || 0), 0);

    const byValue = displayItems
      .map((i) => ({ ...i, value: (Number(i.quantity) || 0) * (Number(i.costPrice) || 0) }))
      .filter((i) => i.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const maxItemValue = Math.max(1, ...byValue.map((i) => i.value));

    const byVehicle = VEHICLES.map((v) => ({
      ...v,
      value: displayItems
        .filter((i) => i.vehicleCategory === v.id)
        .reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.costPrice) || 0), 0),
    }));
    const maxVehicleValue = Math.max(1, ...byVehicle.map((v) => v.value));

    return {
      out,
      low,
      inStock,
      total,
      costValue,
      sellValue,
      margin,
      marginPct,
      outCost,
      lowCost,
      dead,
      deadValue,
      byValue,
      maxItemValue,
      byVehicle,
      maxVehicleValue,
    };
  }, [displayItems, range]);

  function namesLine(list) {
    const names = list.slice(0, 2).map((i) => i.partName).join(", ");
    const more = list.length - 2;
    return more > 0 ? `${names} ${t(lang, "andNMore", more)}` : names;
  }

  if (loading) return <div className="content insights-page">Loading…</div>;

  const noAttention = !stats.out.length && !stats.low.length && !stats.dead.length;
  const pct = (n) => (stats.total ? Math.max(n > 0 ? 3 : 0, (n / stats.total) * 100) : 0);

  return (
    <div className="content insights-page">
      <div className="ins-hd">
        <div className="ins-hd-id">
          <div className="ins-kicker ins-kicker-lg">
            {t(lang, "insights")}
            {preview ? <span className="ins-sample-badge">{t(lang, "sampleDataBadge")}</span> : null}
          </div>
        </div>
        <button type="button" className="ins-preview-btn" onClick={() => setPreview((v) => !v)}>
          {t(lang, preview ? "exitSampleData" : "previewSampleData")}
        </button>
      </div>

      <div className="ins-chips" role="group" aria-label="Date range">
        {RANGE_DAYS.map((d) => (
          <button
            key={d}
            type="button"
            className={`ins-chip${range === d ? " on" : ""}`}
            onClick={() => setRange(d)}
          >
            {t(lang, d === 7 ? "last7" : d === 30 ? "last30" : "last90")}
          </button>
        ))}
      </div>

      <div className="ins-sec">
        <div className="ins-money-grid">
          <div className="ins-tile">
            <span className="ins-ic">
              <WalletIcon />
            </span>
            <div className="ins-tile-lbl">{t(lang, "stockValueToday")}</div>
            <div className="ins-tile-val-row">
              <div className="ins-tile-val ins-num-blue">{formatPrice(stats.costValue)}</div>
            </div>
          </div>
          <div className="ins-tile">
            <span className="ins-ic">
              <TrendIcon />
            </span>
            <div className="ins-tile-lbl">{t(lang, "potentialMargin")}</div>
            <div className="ins-tile-val-row">
              <div className="ins-tile-val">{formatPrice(stats.margin)}</div>
              <TrendTag tone={stats.margin >= 0 ? "green" : "grey"} dir={stats.margin >= 0 ? "up" : "down"} />
            </div>
          </div>
          <div className="ins-tile">
            <span className="ins-ic">
              <RestockIcon />
            </span>
            <div className="ins-tile-lbl">{t(lang, "restockCostNeeded")}</div>
            <div className="ins-tile-val-row">
              <div className="ins-tile-val">{formatPrice(stats.outCost + stats.lowCost)}</div>
              <TrendTag
                tone={stats.outCost + stats.lowCost > 0 ? "grey" : "green"}
                dir={stats.outCost + stats.lowCost > 0 ? "down" : "up"}
              />
            </div>
          </div>
          <div className="ins-tile">
            <span className="ins-ic">
              <ClockIcon />
            </span>
            <div className="ins-tile-lbl">{t(lang, "deadStockValue")}</div>
            <div className="ins-tile-val-row">
              <div className="ins-tile-val">{formatPrice(stats.deadValue)}</div>
              <TrendTag tone={stats.deadValue > 0 ? "grey" : "green"} dir={stats.deadValue > 0 ? "down" : "up"} />
            </div>
          </div>
        </div>
      </div>

      <div className="ins-sec">
        <div className="ins-sec-hd">
          <div className="ins-sec-ttl">{t(lang, "revenueTrend")}</div>
        </div>
        <div className="ins-card">
          <RevenueTrendChart items={displayItems} days={range} />
        </div>
      </div>

      <div className="ins-sec">
        <div className="ins-sec-hd">
          <div className="ins-sec-ttl">{t(lang, "needsAttentionToday")}</div>
        </div>
        <div className="ins-card">
          {stats.out.length ? (
            <div className="ins-attn-row">
              <span className="ins-ic crit">
                <AlertIcon />
              </span>
              <div className="ins-attn-body">
                <div className="ins-attn-ttl">{t(lang, "partsOutOfStock", stats.out.length)}</div>
                <div className="ins-attn-meta">{namesLine(stats.out)}</div>
              </div>
              <div className="ins-attn-right">
                <div className="ins-attn-cost">{formatPrice(stats.outCost)}</div>
                <div className="ins-attn-cost-lbl">{t(lang, "toReachMinStock")}</div>
              </div>
            </div>
          ) : null}
          {stats.low.length ? (
            <div className="ins-attn-row">
              <span className="ins-ic warn">
                <BellIcon />
              </span>
              <div className="ins-attn-body">
                <div className="ins-attn-ttl">{t(lang, "partsRunningLow", stats.low.length)}</div>
                <div className="ins-attn-meta">{namesLine(stats.low)}</div>
              </div>
              <div className="ins-attn-right">
                <div className="ins-attn-cost">{formatPrice(stats.lowCost)}</div>
                <div className="ins-attn-cost-lbl">{t(lang, "toReachMinStock")}</div>
              </div>
            </div>
          ) : null}
          {stats.dead.length ? (
            <div className="ins-attn-row">
              <span className="ins-ic dead">
                <MoonIcon />
              </span>
              <div className="ins-attn-body">
                <div className="ins-attn-ttl">{t(lang, "partsUnchanged", stats.dead.length)}</div>
                <div className="ins-attn-meta">{namesLine(stats.dead)}</div>
              </div>
              <div className="ins-attn-right">
                <div className="ins-attn-cost">{formatPrice(stats.deadValue)}</div>
                <div className="ins-attn-cost-lbl">{t(lang, "tiedUp")}</div>
              </div>
            </div>
          ) : null}
          {noAttention ? <div className="ins-attn-empty">{t(lang, "attentionAllGood")}</div> : null}
        </div>
      </div>

      <div className="ins-two-col">
        <div className="ins-sec">
          <div className="ins-sec-hd">
            <div className="ins-sec-ttl">{t(lang, "highestValueHeld")}</div>
          </div>
          <div className="ins-card">
            {stats.byValue.length ? (
              stats.byValue.map((item, idx) => (
                <div className="ins-rank-row" key={item.id}>
                  <div className="ins-rank-n">{idx + 1}</div>
                  <div className="ins-rank-main">
                    <div className="ins-rank-name">{item.partName}</div>
                    <div className="ins-rank-meta">
                      {vehicleLabel(item.vehicleCategory)} · {item.quantity} {t(lang, "inStock").toLowerCase()}
                    </div>
                    <div className="ins-rank-track">
                      <div
                        className="ins-rank-fill"
                        style={{ width: `${Math.max(6, (item.value / stats.maxItemValue) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="ins-rank-val">
                    <div className="ins-rank-val-n">{formatPrice(item.value)}</div>
                    <div className="ins-rank-val-lbl">{t(lang, "valueLbl")}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="ins-attn-empty">—</div>
            )}
          </div>
        </div>

        <div className="ins-sec">
          <div className="ins-sec-hd">
            <div className="ins-sec-ttl">{t(lang, "stockValueByVehicle")}</div>
          </div>
          <div className="ins-card">
            {stats.byVehicle.map((v) => (
              <div className="ins-veh-row" key={v.id}>
                <div className="ins-veh-top">
                  <span className="ins-veh-name">{v.label}</span>
                  <span className="ins-veh-val">{formatPrice(v.value)}</span>
                </div>
                <div className="ins-veh-track">
                  <div
                    className="ins-veh-fill"
                    style={{ width: v.value > 0 ? `${Math.max(6, (v.value / stats.maxVehicleValue) * 100)}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ins-sec">
        <div className="ins-sec-hd">
          <div className="ins-sec-ttl">{t(lang, "stockHealth")}</div>
        </div>
        <div className="ins-card">
          <div className="ins-meter-wrap">
            <div className="ins-meter">
              <span className="seg-good" style={{ width: `${pct(stats.inStock.length)}%` }} />
              <span className="seg-warn" style={{ width: `${pct(stats.low.length)}%` }} />
              <span className="seg-crit" style={{ width: `${pct(stats.out.length)}%` }} />
            </div>
            <div className="ins-meter-key">
              <div className="ins-meter-key-item">
                <span className="sw" style={{ background: "#16a34a" }} />
                {t(lang, "inStock")} <b>{stats.inStock.length}</b>{" "}
                <span className="pct">({Math.round(pct(stats.inStock.length))}%)</span>
              </div>
              <div className="ins-meter-key-item">
                <span className="sw" style={{ background: "#b45309" }} />
                {t(lang, "low")} <b>{stats.low.length}</b>{" "}
                <span className="pct">({Math.round(pct(stats.low.length))}%)</span>
              </div>
              <div className="ins-meter-key-item">
                <span className="sw" style={{ background: "#c0392b" }} />
                {t(lang, "out")} <b>{stats.out.length}</b>{" "}
                <span className="pct">({Math.round(pct(stats.out.length))}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendTag({ tone, dir }) {
  return (
    <span className={`ins-trend ins-trend-${tone}`}>
      {dir === "up" ? <ArrowUpIcon /> : <ArrowDownIcon />}
    </span>
  );
}

/* Revenue trend — buckets each item's sell value (qty × sellingPrice) into
   12 slices across the selected date range, keyed off when it was last
   updated. There's no order/sales history in this app to chart real revenue
   over time, so this is the closest real-data proxy: recent stock activity
   valued at selling price, not a fabricated series. */
function buildRevenueTrend(items, days, buckets = 12) {
  const now = Date.now();
  const rangeMs = days * 86400000;
  const bucketMs = rangeMs / buckets;
  const data = Array.from({ length: buckets }, () => 0);
  items.forEach((it) => {
    const ts = new Date(it.updatedAt).getTime();
    if (!ts || Number.isNaN(ts)) return;
    const age = now - ts;
    if (age < 0 || age > rangeMs) return;
    const idx = Math.min(buckets - 1, Math.floor((rangeMs - age) / bucketMs));
    data[idx] += (Number(it.quantity) || 0) * (Number(it.sellingPrice) || 0);
  });
  return data;
}

function RevenueTrendChart({ items, days }) {
  const data = useMemo(() => buildRevenueTrend(items, days), [items, days]);
  const total = data.reduce((s, v) => s + v, 0);
  const max = Math.max(1, ...data);
  const w = 300;
  const h = 100;
  const stepX = w / (data.length - 1 || 1);
  const points = data.map((v, i) => [i * stepX, h - (v / max) * (h - 6) - 2]);
  const linePoints = points.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPoints = `0,${h} ${linePoints} ${w},${h}`;

  return (
    <div className="ins-revenue">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="ins-revenue-chart">
        <polygon points={areaPoints} className="ins-revenue-area" />
        <polyline points={linePoints} className="ins-revenue-line" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.2" className="ins-revenue-dot" />
        ))}
      </svg>
      <div className="ins-revenue-total">{formatPrice(total)}</div>
    </div>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}
function ArrowDownIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
      <path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2Z" />
      <path d="M16 14h2" />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  );
}
function RestockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12l8.73-5.04M12 22.08V12" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 9v4M12 17h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  );
}
