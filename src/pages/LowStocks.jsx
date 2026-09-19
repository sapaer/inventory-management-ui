import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatApiError, inventoryApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t, vehicleLabel } from "../i18n";
import { formatPrice, formatWhen, stockOf } from "../utils";
import StatusBadge from "../components/StatusBadge";
import "./LowStocks.css";

export default function LowStocks() {
  const { user } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [minEdit, setMinEdit] = useState(null);
  const [minValue, setMinValue] = useState("");
  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      const rows = await inventoryApi.lowStock();
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Out of stock first, then the fewest left — the order you'd phone a supplier in.
  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const oa = stockOf(a) === "OUT_OF_STOCK" ? 0 : 1;
        const ob = stockOf(b) === "OUT_OF_STOCK" ? 0 : 1;
        return oa - ob || a.quantity - b.quantity || a.partName.localeCompare(b.partName);
      }),
    [items],
  );
  const outCount = sorted.filter((i) => stockOf(i) === "OUT_OF_STOCK").length;
  const lowCount = sorted.length - outCount;
  const shown = sorted.filter((i) =>
    filter === "out" ? stockOf(i) === "OUT_OF_STOCK" : filter === "low" ? stockOf(i) === "LOW_STOCK" : true,
  );

  async function saveMin(item) {
    try {
      await inventoryApi.update(item.id, { minQuantity: Number(minValue) || 0 });
      setMinEdit(null);
      await load();
    } catch (e) {
      setError(formatApiError(e));
    }
  }

  async function copyList() {
    const lines = sorted.map(
      (i) => `• ${i.partName}${i.brand ? ` (${i.brand})` : ""} — ${t(lang, "copyLine", i.quantity)}`,
    );
    const text = `${t(lang, "reorderListTitle")}${user?.shopName ? ` — ${user.shopName}` : ""}\n${lines.join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t(lang, "copyFailed"));
    }
  }

  return (
    <div className="content lowstock">
      <header className="ls-hd">
        <div>
          <h1 className="ls-title">{t(lang, "lowStocks")}</h1>
          <p className="ls-sub">
            {sorted.length ? t(lang, "lowSummary", sorted.length) : t(lang, "lowSubClear")}
          </p>
          {sorted.length ? <p className="ls-hint">{t(lang, "lowHint")}</p> : null}
        </div>
        {sorted.length ? (
          <button type="button" className="btn btn-s ls-copy" onClick={copyList}>
            {copied ? t(lang, "copied") : t(lang, "copyReorderList")}
          </button>
        ) : null}
      </header>

      {sorted.length ? (
        <div className="ls-filters" role="tablist">
          {[
            ["all", t(lang, "filterAll"), sorted.length],
            ["out", t(lang, "out"), outCount],
            ["low", t(lang, "low"), lowCount],
          ].map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              className={`chip${filter === id ? " on" : ""}`}
              onClick={() => setFilter(id)}
            >
              {label} · {n}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <div className="err">{error}</div> : null}

      {loading ? (
        <div>Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="empty ls-empty">
          <span className="ls-empty-ic" aria-hidden="true">
            ✓
          </span>
          <h2>{t(lang, "allStockedTitle")}</h2>
          <p>{t(lang, "nothingBelowMin")}</p>
          <Link to="/inventory" className="btn btn-p">
            {t(lang, "viewInventory")}
          </Link>
        </div>
      ) : shown.length === 0 ? (
        <div className="empty ls-empty">
          <p>{t(lang, "lowFilterEmpty")}</p>
        </div>
      ) : (
        <div className="ls-list">
          {shown.map((item) => {
            const isOut = stockOf(item) === "OUT_OF_STOCK";
            const meta = [vehicleLabel(item.vehicleCategory, lang), item.brand, item.partNumber && `#${item.partNumber}`]
              .filter(Boolean)
              .join(" · ");
            return (
              <article className={`ls-row ${isOut ? "is-out" : "is-low"}`} key={item.id}>
                <div className="ls-item">
                  {item.images?.[0] ? (
                    <img className="inv-thumb" src={item.images[0]} alt="" />
                  ) : (
                    <span className="inv-thumb inv-thumb-ic">
                      <BoxIcon />
                    </span>
                  )}
                  <div className="ls-main">
                    <button type="button" className="ls-name" onClick={() => nav(`/inventory/${item.id}/edit`)}>
                      {item.partName}
                    </button>
                    {meta ? <div className="pspec">{meta}</div> : null}
                  </div>
                </div>

                <div className="ls-facts">
                  <div className="ls-fact is-qty">
                    <span className="ls-fact-lbl">{t(lang, "inStock")}</span>
                    <span className="ls-fact-val">
                      <strong>{item.quantity}</strong>
                      <StatusBadge status={stockOf(item)} lang={lang} />
                    </span>
                  </div>

                  <div className="ls-fact is-level">
                    <span className="ls-fact-lbl">{t(lang, "lowLevel")}</span>
                    {minEdit === item.id ? (
                      <span className="ls-fact-val ls-level-edit">
                        <input
                          className="inp ls-min-inp"
                          type="number"
                          min="0"
                          autoFocus
                          aria-label={t(lang, "lowLevel")}
                          value={minValue}
                          onChange={(e) => setMinValue(e.target.value)}
                        />
                        <button type="button" className="btn btn-p" onClick={() => saveMin(item)}>
                          {t(lang, "saveChanges")}
                        </button>
                        <button type="button" className="btn btn-g" onClick={() => setMinEdit(null)}>
                          {t(lang, "cancel")}
                        </button>
                      </span>
                    ) : (
                      <span className="ls-fact-val">
                        <strong>{item.minQuantity}</strong>
                        <button
                          type="button"
                          className="link ls-alert-change"
                          onClick={() => {
                            setMinEdit(item.id);
                            setMinValue(String(item.minQuantity));
                          }}
                        >
                          {t(lang, "changeShort")}
                        </button>
                      </span>
                    )}
                  </div>

                  <div className="ls-fact">
                    <span className="ls-fact-lbl">{t(lang, "sellingPrice")}</span>
                    <span className="ls-fact-val">{formatPrice(item.sellingPrice)}</span>
                  </div>

                  <div className="ls-fact">
                    <span className="ls-fact-lbl">{t(lang, "updated")}</span>
                    <span className="ls-fact-val">{formatWhen(item.updatedAt)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BoxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}
