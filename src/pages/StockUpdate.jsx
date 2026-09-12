import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatApiError, inventoryApi } from "../api";
import FormPanel from "../components/FormPanel";
import QtyStepper from "../components/QtyStepper";
import { useLang } from "../context/LangContext";
import { t, vehicleLabel } from "../i18n";

// DEV ONLY: sample parts for trying out search/autocomplete without real
// inventory. Opt-in via the "Use dummy data" button below — never shown
// automatically. Remove once the flow doesn't need testing data anymore.
const DUMMY_PARTS = [
  { id: "d1", partName: "Brake Pad Set — Front", vehicleCategory: "FOUR_WHEELER", quantity: 8 },
  { id: "d2", partName: "Engine Oil Filter", vehicleCategory: "TWO_WHEELER", quantity: 20 },
  { id: "d3", partName: "Clutch Plate", vehicleCategory: "TWO_WHEELER", quantity: 5 },
  { id: "d4", partName: "Headlight Assembly", vehicleCategory: "FOUR_WHEELER", quantity: 3 },
  { id: "d5", partName: "Battery 12V 35Ah", vehicleCategory: "FOUR_WHEELER", quantity: 6 },
  { id: "d6", partName: "Chain Sprocket Kit", vehicleCategory: "TWO_WHEELER", quantity: 12 },
  { id: "d7", partName: "Air Filter", vehicleCategory: "COMMERCIAL", quantity: 15 },
  { id: "d8", partName: "Wiper Blade Pair", vehicleCategory: "FOUR_WHEELER", quantity: 10 },
];

/**
 * Quick sold/restocked capture — search a part, say how many moved, repeat
 * for as many parts as needed, then review the before/after quantities in
 * one confirmation before anything is actually saved.
 */
export default function StockUpdate() {
  const { lang } = useLang();
  const nav = useNavigate();
  const [mode, setMode] = useState("SOLD");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [usingDummy, setUsingDummy] = useState(false);
  const [soldRows, setSoldRows] = useState([]);
  const [restockRows, setRestockRows] = useState([]);
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  useEffect(() => {
    const q = query.trim();
    if (usingDummy) {
      const list = q ? DUMMY_PARTS.filter((p) => p.partName.toLowerCase().includes(q.toLowerCase())) : DUMMY_PARTS;
      setResults(list);
      setSearching(false);
      return;
    }
    if (!q) {
      setSearching(true);
      inventoryApi
        .list()
        .then((rows) => setResults(Array.isArray(rows) ? rows.slice(0, 8) : []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
      return;
    }
    setSearching(true);
    const id = setTimeout(() => {
      inventoryApi
        .list({ q })
        .then((rows) => setResults(Array.isArray(rows) ? rows.slice(0, 8) : []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(id);
  }, [query, usingDummy]);

  function addPart(item) {
    if (mode === "SOLD" && (Number(item.quantity) || 0) <= 0) {
      flash(t(lang, "outBadge"));
      return;
    }
    const setRows = mode === "SOLD" ? setSoldRows : setRestockRows;
    setRows((list) => {
      const existing = list.find((r) => r.item.id === item.id);
      if (existing) {
        const bumped = existing.qty + 1;
        const capped = mode === "SOLD" ? Math.min(bumped, item.quantity || 1) : bumped;
        return list.map((r) => (r.item.id === item.id ? { ...r, qty: capped } : r));
      }
      return [...list, { item, qty: 1 }];
    });
    setQuery("");
  }

  const totalRows = soldRows.length + restockRows.length;

  async function confirmSave() {
    setBusy(true);
    setError("");

    // Sample parts don't exist on the server — nothing to actually save.
    if (usingDummy) {
      setBusy(false);
      setSoldRows([]);
      setRestockRows([]);
      setReviewing(false);
      flash(t(lang, "sampleUpdateDone"));
      return;
    }

    const jobs = [
      ...soldRows.map((r) => ({ id: r.item.id, change: -Math.min(r.qty, r.item.quantity || r.qty), changeType: "SOLD" })),
      ...restockRows.map((r) => ({ id: r.item.id, change: r.qty, changeType: "RECEIVED" })),
    ];
    const outcomes = await Promise.allSettled(
      jobs.map((j) => inventoryApi.quantity(j.id, { change: j.change, changeType: j.changeType })),
    );
    setBusy(false);
    const failed = outcomes.find((o) => o.status === "rejected");
    if (failed) {
      setError(formatApiError(failed.reason));
      return;
    }
    setSoldRows([]);
    setRestockRows([]);
    setReviewing(false);
    flash(t(lang, "saved"));
    nav("/inventory");
  }

  return (
    <div className={`content stock-update-page${totalRows ? " has-actions" : ""}`}>
      <div className="part-form">
        <header className="part-form-top stock-update-hd">
          <div>
            <h1 className="part-form-title">{t(lang, "updateStock")}</h1>
            <p className="part-form-sub part-form-sub-desktop">{t(lang, "updateStockSub")}</p>
          </div>
          <button type="button" className="stock-dummy-btn" onClick={() => setUsingDummy((v) => !v)}>
            {t(lang, usingDummy ? "useRealData" : "useDummyData")}
          </button>
        </header>

        <div className="seg-row stock-update-mode">
          <button type="button" className={`seg${mode === "SOLD" ? " on" : ""}`} onClick={() => setMode("SOLD")}>
            {t(lang, "markSold")}
          </button>
          <button
            type="button"
            className={`seg${mode === "RECEIVED" ? " on" : ""}`}
            onClick={() => setMode("RECEIVED")}
          >
            {t(lang, "markRestocked")}
          </button>
        </div>

        <FormPanel className="stock-search-panel">
          <div className="stock-search-box">
            <input
              className="f-inp"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 120)}
              placeholder={t(lang, "searchPartPlaceholder")}
            />
            {focused ? (
              <div className="stock-search-results">
                {searching ? (
                  <div className="stock-search-empty">{t(lang, "loading")}</div>
                ) : results.length === 0 ? (
                  <div className="stock-search-empty">{t(lang, "noPartsFound")}</div>
                ) : (
                  results.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="stock-search-row"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addPart(item);
                      }}
                    >
                      <span className="pname">{item.partName}</span>
                      <span className="pspec">
                        {vehicleLabel(item.vehicleCategory)} · {item.quantity} {t(lang, "inStock").toLowerCase()}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
          {usingDummy ? <p className="form-field-hint stock-search-dummy-hint">{t(lang, "usingSampleParts")}</p> : null}
        </FormPanel>

        {soldRows.length ? (
          <StockRowsPanel
            title={t(lang, "soldLbl")}
            rows={soldRows}
            lang={lang}
            cap
            onQty={(id, qty) => setSoldRows((list) => list.map((r) => (r.item.id === id ? { ...r, qty } : r)))}
            onRemove={(id) => setSoldRows((list) => list.filter((r) => r.item.id !== id))}
          />
        ) : null}
        {restockRows.length ? (
          <StockRowsPanel
            title={t(lang, "restockedLbl")}
            rows={restockRows}
            lang={lang}
            onQty={(id, qty) => setRestockRows((list) => list.map((r) => (r.item.id === id ? { ...r, qty } : r)))}
            onRemove={(id) => setRestockRows((list) => list.filter((r) => r.item.id !== id))}
          />
        ) : null}

        {!totalRows ? <p className="form-field-hint stock-update-hint">{t(lang, "noChangesYet")}</p> : null}
      </div>

      {totalRows ? (
        <div className="stock-update-actions">
          <button type="button" className="btn btn-g" onClick={() => nav(-1)}>
            {t(lang, "cancel")}
          </button>
          <button type="button" className="btn btn-p" onClick={() => setReviewing(true)}>
            {t(lang, "reviewChanges")}
          </button>
        </div>
      ) : null}

      {reviewing ? (
        <ReviewModal
          lang={lang}
          soldRows={soldRows}
          restockRows={restockRows}
          busy={busy}
          error={error}
          onBack={() => setReviewing(false)}
          onConfirm={confirmSave}
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function StockRowsPanel({ title, rows, lang, onQty, onRemove, cap }) {
  return (
    <FormPanel title={`${title} (${rows.length})`} className="stock-rows-panel">
      {rows.map(({ item, qty }) => (
        <div className="stock-row" key={item.id}>
          <div className="stock-row-main">
            <div className="pname">{item.partName}</div>
            <div className="pspec">
              {vehicleLabel(item.vehicleCategory)} · {t(lang, "currentStock")}: {item.quantity}
            </div>
          </div>
          <QtyStepper
            value={qty}
            min={1}
            max={cap ? Math.max(item.quantity || 0, 1) : Infinity}
            onChange={(v) => onQty(item.id, v === "" ? "" : Number(v))}
          />
          <button
            type="button"
            className="stock-row-remove"
            aria-label={t(lang, "remove")}
            onClick={() => onRemove(item.id)}
          >
            ×
          </button>
        </div>
      ))}
    </FormPanel>
  );
}

function ReviewModal({ lang, soldRows, restockRows, busy, error, onBack, onConfirm }) {
  return (
    <div className="overlay" onClick={busy ? undefined : onBack}>
      <div
        className="modal stock-review-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-review-title"
      >
        <h3 id="stock-review-title" className="stock-review-title">
          {t(lang, "reviewChanges")}
        </h3>
        <p className="stock-review-sub">{t(lang, "reviewChangesSub")}</p>

        {soldRows.length ? (
          <ReviewGroup lang={lang} label={t(lang, "soldLbl")} rows={soldRows} sign={-1} />
        ) : null}
        {restockRows.length ? (
          <ReviewGroup lang={lang} label={t(lang, "restockedLbl")} rows={restockRows} sign={1} />
        ) : null}

        {error ? <div className="err">{error}</div> : null}

        <div className="stock-review-actions">
          <button type="button" className="btn btn-g" disabled={busy} onClick={onBack}>
            {t(lang, "backToEdit")}
          </button>
          <button type="button" className="btn btn-p" disabled={busy} onClick={onConfirm}>
            {busy ? t(lang, "saving") : t(lang, "confirmUpdate")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewGroup({ label, rows, sign }) {
  return (
    <div className="stock-review-group">
      <div className="stock-review-group-hd">{label}</div>
      {rows.map(({ item, qty }) => {
        const current = Number(item.quantity) || 0;
        const next = Math.max(0, current + sign * qty);
        return (
          <div className="stock-review-row" key={item.id}>
            <span className="pname">{item.partName}</span>
            <span className="stock-review-delta">
              <span className="qty-old">{current}</span>
              <span className="stock-review-arrow">→</span>
              <span className="qty-new">{next}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
