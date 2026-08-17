import { useEffect, useMemo, useState } from "react";
import { inventoryApi } from "../api";
import { useLang } from "../context/LangContext";
import { t, VEHICLES, vehicleLabel } from "../i18n";
import { stockOf } from "../utils";
import StatusBadge from "../components/StatusBadge";

export default function Insights() {
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [range, setRange] = useState(30);

  useEffect(() => {
    inventoryApi.list().then((rows) => setItems(Array.isArray(rows) ? rows : [])).catch(() => setItems([]));
  }, []);

  const stats = useMemo(() => {
    const cutoff = Date.now() - range * 86400000;
    const inRange = items.filter((i) => new Date(i.updatedAt).getTime() >= cutoff);
    const out = items.filter((i) => stockOf(i) === "OUT_OF_STOCK");
    const low = items.filter((i) => stockOf(i) === "LOW_STOCK");
    const inStock = items.filter((i) => stockOf(i) === "IN_STOCK");
    const byVehicle = VEHICLES.map((v) => ({
      ...v,
      count: items.filter((i) => i.vehicleCategory === v.id).length,
    }));
    const max = Math.max(1, ...byVehicle.map((v) => v.count));
    const dead = items.filter((i) => {
      const created = new Date(i.createdAt).getTime();
      const updated = new Date(i.updatedAt).getTime();
      return i.quantity > 0 && Math.abs(updated - created) < 60 * 1000 && Date.now() - created > 7 * 86400000;
    });
    const fast = inRange.filter((i) => stockOf(i) !== "IN_STOCK" || new Date(i.updatedAt).getTime() >= cutoff);
    const share = items.length ? Math.round(((low.length + out.length) / items.length) * 100) : 0;
    return { out, low, inStock, byVehicle, max, dead, fast: fast.length, share, total: items.length };
  }, [items, range]);

  return (
    <div className="content">
      <div className="chips">
        {[7, 30, 90].map((d) => (
          <button key={d} className={`chip${range === d ? " on" : ""}`} onClick={() => setRange(d)}>
            {t(lang, d === 7 ? "last7" : d === 30 ? "last30" : "last90")}
          </button>
        ))}
      </div>
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-lbl">{t(lang, "partsMoved")}</div>
          <div className="stat-val">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{t(lang, "fastMoving")}</div>
          <div className="stat-val">{stats.fast}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{t(lang, "deadStock")}</div>
          <div className="stat-val">{stats.dead.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{t(lang, "avgDays")}</div>
          <div className="stat-val">{stats.share}%</div>
        </div>
      </div>
      <div className="split">
        <div className="card">
          <div className="card-hd">
            <div className="card-ttl">{t(lang, "mostMoved")}</div>
          </div>
          <div style={{ padding: "8px 17px 16px" }}>
            {stats.byVehicle.map((v) => (
              <div className="bar-row" key={v.id}>
                <span style={{ width: 90 }}>{v.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(v.count / stats.max) * 100}%` }} />
                </div>
                <span style={{ width: 28, textAlign: "right" }}>{v.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-hd">
            <div className="card-ttl">{t(lang, "zeroMovement")}</div>
          </div>
          {[...stats.out, ...stats.low, ...stats.dead].slice(0, 8).map((item) => (
            <div className="list-row" key={item.id}>
              <div style={{ flex: 1 }}>
                <div className="pname">{item.partName}</div>
                <div className="pspec">{vehicleLabel(item.vehicleCategory, lang)}</div>
              </div>
              <StatusBadge status={stockOf(item)} lang={lang} />
            </div>
          ))}
          {stats.out.length + stats.low.length + stats.dead.length === 0 ? (
            <div className="list-row muted">All good.</div>
          ) : null}
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-hd">
          <div className="card-ttl">{t(lang, "stockHealth")}</div>
        </div>
        <div style={{ padding: "8px 17px 18px" }}>
          <div className="health">
            <span className="h-g" style={{ width: `${pct(stats.inStock.length, stats.total)}%` }} />
            <span className="h-a" style={{ width: `${pct(stats.low.length, stats.total)}%` }} />
            <span className="h-r" style={{ width: `${pct(stats.out.length, stats.total)}%` }} />
          </div>
          <div className="hint">
            {stats.inStock.length} {t(lang, "inStock")} · {stats.low.length} {t(lang, "low")} · {stats.out.length} {t(lang, "out")}
          </div>
        </div>
      </div>
    </div>
  );
}

function pct(n, total) {
  if (!total) return 0;
  return (n / total) * 100;
}
