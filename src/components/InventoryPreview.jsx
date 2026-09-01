import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { DUMMY_INVENTORY_PREVIEW } from "../data/inventoryPreviewDummy";

export default function InventoryPreview({ data = DUMMY_INVENTORY_PREVIEW }) {
  const { lang } = useLang();
  const { stats, chart, topParts } = data;
  const inventoryTo = "/inventory";

  return (
    <div className="lp-inv">
      <div className="lp-inv-head">
        <h3>{t(lang, "inventory")}</h3>
        <Link to={inventoryTo} className="lp-inv-view">
          {t(lang, "viewAll")}
        </Link>
      </div>
      <div className="lp-inv-stats">
        {stats.map((row) => (
          <div key={row.id} className="lp-inv-stat">
            <span className="lp-inv-stat-ic" aria-hidden="true">
              <StatIcon name={row.icon} />
            </span>
            <span className="lp-inv-stat-lbl">{t(lang, row.labelKey)}</span>
            <strong>{row.value}</strong>
            <em>{row.change}</em>
          </div>
        ))}
      </div>
      <div className="lp-inv-body">
        <div className="lp-inv-chart">
          <p className="lp-inv-chart-ttl">{t(lang, "lpPrevChart")}</p>
          <WeekChart labels={chart.labels} points={chart.points} max={chart.max} />
        </div>
        <div className="lp-inv-top">
          <p className="lp-inv-chart-ttl">{t(lang, "lpPrevTopParts")}</p>
          <ul>
            {topParts.map((part) => (
              <li key={part.id}>
                <img
                  className="lp-inv-thumb"
                  src={part.image || "/parts/default.svg"}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/parts/default.svg";
                  }}
                />
                <span className="lp-inv-part">
                  <strong>{part.name}</strong>
                  <em>{part.sku}</em>
                </span>
                <span className="lp-inv-qty">{part.qty}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function WeekChart({ labels, points, max }) {
  const w = 420;
  const h = 168;
  const pad = 8;
  const bottom = 22;
  const xs = points.map((_, i) => pad + (i * (w - pad * 2)) / (points.length - 1));
  const ys = points.map((v) => h - bottom - (v / max) * (h - bottom - pad));
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const area = `${line} L${xs[xs.length - 1]},${h - bottom} L${xs[0]},${h - bottom} Z`;

  return (
    <svg className="lp-inv-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={labels.join(", ")}>
      <defs>
        <linearGradient id="lpInvFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2bbc8a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2bbc8a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((n) => (
        <line
          key={n}
          x1={pad}
          x2={w - pad}
          y1={pad + n * (h - bottom - pad)}
          y2={pad + n * (h - bottom - pad)}
          stroke="rgba(244,250,247,0.12)"
        />
      ))}
      <path d={area} fill="url(#lpInvFill)" />
      <path d={line} fill="none" stroke="#2bbc8a" strokeWidth="2.5" />
      {xs.map((x, i) => (
        <circle key={labels[i]} cx={x} cy={ys[i]} r="4" fill="#0a2f24" stroke="#f4faf7" strokeWidth="2" />
      ))}
      {labels.map((d, i) => (
        <text key={d} x={xs[i]} y={h - 6} textAnchor="middle" fill="rgba(244,250,247,0.55)" fontSize="11">
          {d}
        </text>
      ))}
    </svg>
  );
}

function StatIcon({ name }) {
  if (name === "warn") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3 2 20h20L12 3z" />
        <path d="M12 9v5M12 17h.01" />
      </svg>
    );
  }
  if (name === "bell") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}
