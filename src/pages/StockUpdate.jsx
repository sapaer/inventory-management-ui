import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatApiError, inventoryApi } from "../api";
import { InfoNote, PageHero } from "../components/PageHero";
import SearchIcon from "../components/SearchIcon";
import StatusBadge from "../components/StatusBadge";
import { useLang } from "../context/LangContext";
import { t, vehicleLabel } from "../i18n";
import { stockOf } from "../utils";
import "./StockUpdate.css";

const PAGE = 24;
const PHONE_PAGE = 5;
const PHONE_STEP = 10;
const FILTERS = [
  { id: "all", key: "suFilterAll" },
  { id: "recent", key: "suFilterRecent" },
  { id: "low", key: "suFilterLow" },
];

const stockNow = (item) => Number(item.quantity) || 0;
const finalStock = (row) => stockNow(row.item) - row.sold + row.received;
const hasChange = (row) => row.sold > 0 || row.received > 0;
// Stock received during the day can be sold the same day, so what can be sold is
// today's stock plus whatever was received (received is applied first on save).
const sellCap = (item, received) => stockNow(item) + received;

/**
 * Record what was sold or received. Tap parts to add them, adjust the counts
 * on each row (a part can be both sold and received), review, then save.
 */
export default function StockUpdate() {
  const { lang } = useLang();
  const nav = useNavigate();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState("SOLD");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [pages, setPages] = useState(0);
  const [phone, setPhone] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );
  const [changesOpen, setChangesOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [pulse, setPulse] = useState("");
  const [hint, setHint] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const searchRef = useRef(null);

  function loadParts() {
    return inventoryApi
      .list()
      .then((list) => {
        const rows = Array.isArray(list) ? list : [];
        setParts(rows);
        return rows;
      })
      .catch((e) => {
        setLoadError(formatApiError(e));
        return [];
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadParts();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setPhone(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  function flashHint(message) {
    setHint(message);
    setTimeout(() => setHint(""), 2200);
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...parts];
    if (q) {
      list = list.filter((p) =>
        [p.partName, p.brand, p.partNumber, p.localName].some((v) => v && String(v).toLowerCase().includes(q)),
      );
      return list.sort((a, b) => a.partName.localeCompare(b.partName));
    }
    if (filter === "recent") {
      return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 12);
    }
    if (filter === "low") {
      return list.filter((p) => stockNow(p) <= (Number(p.minQuantity) || 0)).sort((a, b) => stockNow(a) - stockNow(b));
    }
    return list.sort((a, b) => a.partName.localeCompare(b.partName));
  }, [parts, query, filter]);

  // Phones show a short list until asked for more, so the parts never push the
  // changes out of reach; a search shows the full set of matches.
  const firstPage = query || !phone ? PAGE : PHONE_PAGE;
  const step = phone ? PHONE_STEP : PAGE;
  const shown = visible.slice(0, firstPage + pages * step);
  const active = rows.filter(hasChange);
  const totals = active.reduce(
    (sum, r) => ({ sold: sum.sold + r.sold, received: sum.received + r.received }),
    { sold: 0, received: 0 },
  );

  const modeField = mode === "SOLD" ? "sold" : "received";

  // Set how many of a part are sold / received. Used by the stepper on each card
  // (creates the row on first use, drops it again when both counts are back at 0).
  function setQty(item, field, value) {
    const wanted = Math.max(0, Number(value) || 0);
    setRows((list) => {
      const i = list.findIndex((r) => r.item.id === item.id);
      const base = i === -1 ? { item, sold: 0, received: 0 } : list[i];
      const updated = { ...base, [field]: wanted };
      if (field === "received") {
        // Fewer received → fewer units available to sell.
        updated.sold = Math.min(updated.sold, sellCap(item, updated.received));
      } else if (wanted > sellCap(item, base.received)) {
        flashHint(t(lang, "suOnlyInStock", sellCap(item, base.received)));
        updated.sold = sellCap(item, base.received);
      }
      if (updated.sold === 0 && updated.received === 0) return list.filter((r) => r.item.id !== item.id);
      return i === -1 ? [...list, updated] : list.map((r) => (r.item.id === item.id ? updated : r));
    });
    setPulse(item.id);
    setTimeout(() => setPulse(""), 700);
  }

  function setCount(id, field, value) {
    setRows((list) =>
      list.map((r) => {
        if (r.item.id !== id) return r;
        const wanted = Math.max(0, Number(value) || 0);
        const updated = { ...r, [field]: field === "sold" ? Math.min(wanted, sellCap(r.item, r.received)) : wanted };
        if (field === "received") updated.sold = Math.min(updated.sold, sellCap(r.item, updated.received));
        return updated;
      }),
    );
  }

  function removeRow(id) {
    setRows((list) => list.filter((r) => r.item.id !== id));
  }

  function onSearchKey(e) {
    if (e.key === "Enter" && shown[0]) {
      e.preventDefault();
      const row = rows.find((r) => r.item.id === shown[0].id);
      setQty(shown[0], modeField, (row ? row[modeField] : 0) + 1);
      setQuery("");
    }
  }

  async function confirmSave() {
    setBusy(true);
    setError("");
    // Received first, then sold, one part at a time: stock that came in today can
    // be sold today, and applying the sale last means the count never dips below
    // zero along the way. Two writes to the same part also can't overwrite each
    // other; different parts run in parallel.
    const results = await Promise.all(
      active.map(async (r) => {
        let receivedDone = false;
        try {
          if (r.received > 0) {
            await inventoryApi.quantity(r.item.id, {
              change: r.received,
              changeType: "RECEIVED",
              note: note.trim() || undefined,
            });
            receivedDone = true;
          }
          if (r.sold > 0) {
            await inventoryApi.quantity(r.item.id, {
              change: -Math.min(r.sold, sellCap(r.item, r.received)),
              changeType: "SOLD",
              note: note.trim() || undefined,
            });
          }
          return { row: r, ok: true };
        } catch (e) {
          return { row: r, ok: false, receivedDone, message: formatApiError(e) };
        }
      }),
    );
    setBusy(false);
    const saved = results.filter((x) => x.ok).map((x) => x.row);
    const failed = results.filter((x) => !x.ok);
    const fresh = saved.length || failed.some((x) => x.receivedDone) ? await loadParts() : parts;
    if (failed.length) {
      // Keep only what didn't save, against fresh stock figures, so it can be retried
      // without repeating a delivery that already went through.
      setRows(
        failed.map((x) => ({
          item: fresh.find((p) => p.id === x.row.item.id) || x.row.item,
          sold: x.row.sold,
          received: x.receivedDone ? 0 : x.row.received,
        })),
      );
      setError(failed[0].message);
      return;
    }
    setDone({
      parts: saved.length,
      sold: saved.reduce((n, r) => n + r.sold, 0),
      received: saved.reduce((n, r) => n + r.received, 0),
    });
    setRows([]);
    setNote("");
    setReviewing(false);
  }

  function startOver() {
    setDone(null);
    setQuery("");
    setFilter("all");
    setPages(0);
    setChangesOpen(false);
  }

  if (done) {
    return (
      <div className="content su">
        <div className="su-done">
          <span className="su-done-ic" aria-hidden="true">
            ✓
          </span>
          <h1>{t(lang, "suDoneTitle")}</h1>
          <p>{t(lang, "suDoneSub", done.parts)}</p>
          <div className="su-done-stats">
            <div>
              <strong>{done.sold}</strong>
              <span>{t(lang, "suSold")}</span>
            </div>
            <div>
              <strong>{done.received}</strong>
              <span>{t(lang, "suReceived")}</span>
            </div>
          </div>
          <div className="su-done-actions">
            <button type="button" className="btn btn-p" onClick={startOver}>
              {t(lang, "suUpdateMore")}
            </button>
            <Link to="/activity" className="btn btn-s">
              {t(lang, "suViewActivity")}
            </Link>
            <button type="button" className="btn btn-g" onClick={() => nav("/inventory")}>
              {t(lang, "suBackToInventory")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`content su${rows.length ? " has-bar" : ""}`}>
      <PageHero
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 4v14M3.5 14.5 7 18l3.5-3.5M17 20V6M13.5 9.5 17 6l3.5 3.5" />
          </svg>
        }
        kicker={t(lang, "suKicker")}
        title={t(lang, "updateStock")}
      />
      <InfoNote id="stock-update">{t(lang, "updateStockSub")}</InfoNote>

      {loading ? (
        <div className="su-empty">{t(lang, "loading")}</div>
      ) : loadError ? (
        <div className="err">{loadError}</div>
      ) : parts.length === 0 ? (
        <div className="su-empty su-empty-catalog">
          <h2>{t(lang, "suEmptyCatalogTitle")}</h2>
          <p>{t(lang, "suEmptyCatalogSub")}</p>
          <Link to="/inventory/new" className="btn btn-p">
            {t(lang, "addPart")}
          </Link>
        </div>
      ) : (
        <div className="su-grid">
          <section className="su-pick">
            <div className="su-search">
              <span className="su-search-ic" aria-hidden="true">
                <SearchIcon size={22} />
              </span>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPages(0);
                }}
                onKeyDown={onSearchKey}
                placeholder={t(lang, "suSearch")}
                aria-label={t(lang, "suSearch")}
              />
              {query ? (
                <button type="button" className="su-search-x" aria-label={t(lang, "suClearSearch")} onClick={() => setQuery("")}>
                  ×
                </button>
              ) : null}
            </div>

            <div className="su-mode" role="group" aria-label={t(lang, "suModeQuestion")}>
              <div className="su-mode-lbl">{t(lang, "suModeQuestion")}</div>
              <div className="su-tiles">
                <button
                  type="button"
                  className={`su-tile is-sold${mode === "SOLD" ? " on" : ""}`}
                  aria-pressed={mode === "SOLD"}
                  onClick={() => setMode("SOLD")}
                >
                  <span className="su-tile-sign" aria-hidden="true">
                    −
                  </span>
                  <span className="su-tile-txt">
                    <strong>{t(lang, "suSold")}</strong>
                    <small>{t(lang, "suSoldHint")}</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={`su-tile is-received${mode === "RECEIVED" ? " on" : ""}`}
                  aria-pressed={mode === "RECEIVED"}
                  onClick={() => setMode("RECEIVED")}
                >
                  <span className="su-tile-sign" aria-hidden="true">
                    +
                  </span>
                  <span className="su-tile-txt">
                    <strong>{t(lang, "suReceived")}</strong>
                    <small>{t(lang, "suReceivedHint")}</small>
                  </span>
                </button>
              </div>
            </div>

            {query ? null : (
              <div className="su-filters" role="tablist">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.id}
                    className={`chip${filter === f.id ? " on" : ""}`}
                    onClick={() => {
                      setFilter(f.id);
                      setPages(0);
                    }}
                  >
                    {t(lang, f.key)}
                  </button>
                ))}
              </div>
            )}

            {hint ? <div className="su-hint">{hint}</div> : null}

            {visible.length === 0 ? (
              <div className="su-empty">
                {query ? t(lang, "suNoMatch", query.trim()) : t(lang, "suNothingHere")}
                {query ? (
                  <Link to="/inventory/new" className="su-link">
                    {t(lang, "suAddNewPart")}
                  </Link>
                ) : null}
              </div>
            ) : (
              <>
                <div className="su-cards">
                  {shown.map((item) => (
                    <PartCard
                      key={item.id}
                      item={item}
                      lang={lang}
                      mode={mode}
                      row={rows.find((r) => r.item.id === item.id)}
                      onQty={(value) => setQty(item, modeField, value)}
                    />
                  ))}
                </div>
                {visible.length > shown.length ? (
                  <button type="button" className="su-more" onClick={() => setPages((n) => n + 1)}>
                    {t(lang, "suShowMore", visible.length - shown.length)}
                  </button>
                ) : null}
              </>
            )}
          </section>

          <aside className="su-side">
            <div className="su-panel">
              <div className="su-panel-hd">
                <h2>
                  {t(lang, "suYourChanges")}
                  {rows.length ? <span className="su-count">{rows.length}</span> : null}
                </h2>
                {rows.length ? (
                  <button type="button" className="su-clear" onClick={() => setRows([])}>
                    {t(lang, "suClearAll")}
                  </button>
                ) : null}
              </div>

              {rows.length === 0 ? (
                <div className="su-blank">
                  <span className="su-blank-ic" aria-hidden="true">
                    ⇅
                  </span>
                  <strong>{t(lang, "suNoChanges")}</strong>
                  <span>{t(lang, "suNoChangesSub")}</span>
                </div>
              ) : (
                <div className="su-rows">
                  {rows.map((row) => (
                    <ChangeRow
                      key={row.item.id}
                      row={row}
                      lang={lang}
                      pulse={pulse === row.item.id}
                      onCount={(field, v) => setCount(row.item.id, field, v)}
                      onRemove={() => removeRow(row.item.id)}
                    />
                  ))}
                </div>
              )}

              {error && !reviewing ? <div className="err su-err">{error}</div> : null}

              <div className="su-panel-ft">
                <Totals lang={lang} parts={active.length} sold={totals.sold} received={totals.received} />
                <button
                  type="button"
                  className="btn btn-p su-review"
                  disabled={!active.length}
                  onClick={() => {
                    setError("");
                    setReviewing(true);
                  }}
                >
                  {t(lang, "reviewChanges")}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {rows.length ? (
        <div className="su-bar">
          <button type="button" className="su-bar-sum" onClick={() => setChangesOpen(true)} aria-label={t(lang, "suOpenChanges")}>
            <Totals lang={lang} parts={active.length} sold={totals.sold} received={totals.received} compact />
            <span className="su-bar-open">
              {t(lang, "suYourChanges")} <span aria-hidden="true">▲</span>
            </span>
          </button>
          <button
            type="button"
            className="btn btn-p"
            disabled={!active.length}
            onClick={() => {
              setError("");
              setReviewing(true);
            }}
          >
            {t(lang, "suReview")}
          </button>
        </div>
      ) : null}

      {changesOpen && rows.length ? (
        <div className="su-overlay is-changes" onClick={() => setChangesOpen(false)}>
          <div className="su-sheet su-changes" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="su-changes-hd">
              <h3>
                {t(lang, "suYourChanges")}
                <span className="su-count">{rows.length}</span>
              </h3>
              <button type="button" className="su-clear" onClick={() => { setRows([]); setChangesOpen(false); }}>
                {t(lang, "suClearAll")}
              </button>
              <button type="button" className="su-changes-x" aria-label={t(lang, "suClose")} onClick={() => setChangesOpen(false)}>
                ×
              </button>
            </div>
            <div className="su-changes-body">
              {rows.map((row) => (
                <ChangeRow
                  key={row.item.id}
                  row={row}
                  lang={lang}
                  pulse={false}
                  onCount={(field, v) => setCount(row.item.id, field, v)}
                  onRemove={() => {
                    removeRow(row.item.id);
                    if (rows.length === 1) setChangesOpen(false);
                  }}
                />
              ))}
            </div>
            <div className="su-changes-ft">
              <Totals lang={lang} parts={active.length} sold={totals.sold} received={totals.received} />
              <button
                type="button"
                className="btn btn-p su-review"
                disabled={!active.length}
                onClick={() => {
                  setChangesOpen(false);
                  setError("");
                  setReviewing(true);
                }}
              >
                {t(lang, "reviewChanges")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reviewing ? (
        <ReviewSheet
          lang={lang}
          rows={active}
          note={note}
          onNote={setNote}
          busy={busy}
          error={error}
          onBack={() => setReviewing(false)}
          onConfirm={confirmSave}
        />
      ) : null}
    </div>
  );
}

function Totals({ lang, parts, sold, received, compact }) {
  return (
    <div className={`su-totals${compact ? " is-compact" : ""}`}>
      <span>
        <strong>{parts}</strong> {t(lang, parts === 1 ? "suPart" : "suParts")}
      </span>
      <span className="is-sold">
        <strong>{sold}</strong> {t(lang, "suSold")}
      </span>
      <span className="is-received">
        <strong>{received}</strong> {t(lang, "suReceived")}
      </span>
    </div>
  );
}

function PartCard({ item, lang, mode, row, onQty }) {
  const stock = stockNow(item);
  const field = mode === "SOLD" ? "sold" : "received";
  const count = row ? row[field] : 0;
  const after = row ? finalStock(row) : stock;
  const blocked = mode === "SOLD" && sellCap(item, row ? row.received : 0) <= 0;
  const status = stockOf(item);
  const tone = mode.toLowerCase();
  return (
    <div className={`su-card is-${status.toLowerCase()}${row ? " is-added" : ""}${blocked ? " is-blocked" : ""}`}>
      <div className="su-card-info">
        <span className="su-card-name">{item.partName}</span>
        <span className="su-card-meta">
          {[vehicleLabel(item.vehicleCategory), item.brand].filter(Boolean).join(" · ")}
        </span>
        <span className="su-card-stock">
          {stock <= 0 && !row ? (
            t(lang, "suOutOfStock")
          ) : row && after !== stock ? (
            <>
              {stock} <span className="su-card-arrow">→</span>{" "}
              <strong className={after < stock ? "is-sold" : "is-received"}>{after}</strong>{" "}
              {t(lang, "suInStockWord")}
            </>
          ) : (
            t(lang, "suInStockCount", stock)
          )}
        </span>
      </div>
      <div className={`su-cstep is-${tone}`}>
        <span className="su-cstep-cap">{mode === "SOLD" ? `− ${t(lang, "suSold")}` : `+ ${t(lang, "suReceived")}`}</span>
        <div className="su-cstep-ctl">
          <button type="button" disabled={count <= 0} onClick={() => onQty(count - 1)} aria-label={`− ${item.partName}`}>
            −
          </button>
          <input
            inputMode="numeric"
            value={count}
            disabled={blocked}
            aria-label={`${mode === "SOLD" ? t(lang, "suSold") : t(lang, "suReceived")}: ${item.partName}`}
            onChange={(e) => onQty(e.target.value.replace(/\D/g, ""))}
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            disabled={blocked || (mode === "SOLD" && count >= sellCap(item, row ? row.received : 0))}
            onClick={() => onQty(count + 1)}
            aria-label={`+ ${item.partName}`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function Stepper({ value, max, disabled, label, tone, onChange }) {
  return (
    <div className={`su-step is-${tone}${disabled ? " is-off" : ""}`}>
      <span className="su-step-lbl">{label}</span>
      <div className="su-step-ctl">
        <button type="button" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} aria-label="−">
          −
        </button>
        <input
          inputMode="numeric"
          value={value}
          disabled={disabled}
          aria-label={label}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          onFocus={(e) => e.target.select()}
        />
        <button type="button" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label="+">
          +
        </button>
      </div>
    </div>
  );
}

function ChangeRow({ row, lang, pulse, onCount, onRemove }) {
  const { item, sold, received } = row;
  const stock = stockNow(item);
  const after = finalStock(row);
  const status = stockOf({ quantity: after, minQuantity: item.minQuantity });
  return (
    <div className={`su-row${pulse ? " is-pulse" : ""}`}>
      <div className="su-row-top">
        <div className="su-row-name">
          <strong>{item.partName}</strong>
          <span>{t(lang, "suStockNow", stock)}</span>
        </div>
        <button type="button" className="su-row-x" aria-label={t(lang, "suRemove")} onClick={onRemove}>
          ×
        </button>
      </div>
      <div className="su-steps">
        <Stepper
          tone="sold"
          label={`− ${t(lang, "suSold")}`}
          value={sold}
          max={sellCap(item, received)}
          disabled={sellCap(item, received) <= 0}
          onChange={(v) => onCount("sold", v)}
        />
        <Stepper
          tone="received"
          label={`+ ${t(lang, "suReceived")}`}
          value={received}
          max={99999}
          onChange={(v) => onCount("received", v)}
        />
      </div>
      <div className="su-row-after">
        <span className="su-after-eq">
          {stock}
          {sold > 0 ? <span className="is-sold"> − {sold}</span> : null}
          {received > 0 ? <span className="is-received"> + {received}</span> : null}
          <span className="su-after-arrow"> → </span>
          <strong>{after}</strong>
        </span>
        <StatusBadge status={status} lang={lang} />
      </div>
      {sellCap(item, received) > 0 && sold >= sellCap(item, received) ? (
        <div className="su-row-note">{t(lang, "suOnlyInStock", sellCap(item, received))}</div>
      ) : null}
    </div>
  );
}

function ReviewSheet({ lang, rows, note, onNote, busy, error, onBack, onConfirm }) {
  return (
    <div className="su-overlay" onClick={busy ? undefined : onBack}>
      <div className="su-sheet" role="dialog" aria-modal="true" aria-labelledby="su-review-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="su-review-title">{t(lang, "reviewChanges")}</h3>
        <p className="su-sheet-sub">{t(lang, "suReviewSub")}</p>

        <div className="su-sheet-list">
          {rows.map((r) => {
            const stock = stockNow(r.item);
            return (
              <div className="su-sheet-row" key={r.item.id}>
                <span className="su-sheet-name">{r.item.partName}</span>
                <span className="su-sheet-calc">
                  <span>{stock}</span>
                  {r.sold > 0 ? <span className="is-sold">− {r.sold}</span> : null}
                  {r.received > 0 ? <span className="is-received">+ {r.received}</span> : null}
                  <span className="su-sheet-eq">=</span>
                  <strong>{finalStock(r)}</strong>
                </span>
              </div>
            );
          })}
        </div>

        <label className="su-note">
          <span>{t(lang, "suNoteLabel")}</span>
          <input
            value={note}
            maxLength={120}
            onChange={(e) => onNote(e.target.value)}
            placeholder={t(lang, "suNotePlaceholder")}
          />
        </label>

        {error ? <div className="err">{error}</div> : null}

        <div className="su-sheet-actions">
          <button type="button" className="btn btn-g" disabled={busy} onClick={onBack}>
            {t(lang, "suGoBack")}
          </button>
          <button type="button" className="btn btn-p" disabled={busy} onClick={onConfirm}>
            {busy ? t(lang, "saving") : t(lang, "suConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
