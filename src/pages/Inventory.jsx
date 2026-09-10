import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatApiError, inventoryApi } from "../api";
import { useLang } from "../context/LangContext";
import { t, vehicleLabel, VEHICLES } from "../i18n";
import { formatPrice, formatDate, stockOf } from "../utils";
import StatusBadge from "../components/StatusBadge";
import SetQuantityModal from "../components/SetQuantityModal";

export default function Inventory() {
  const { lang } = useLang();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [q, setQ] = useState(() => params.get("q") || "");
  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [qtyItem, setQtyItem] = useState(null);

  async function load() {
    setError("");
    try {
      const listParams = { q: q.trim() || undefined };
      const countRows = await inventoryApi.list(listParams);
      const counted = Array.isArray(countRows) ? countRows : [];
      setAllItems(counted);
      if (vehicles.length || status) {
        const filtered = await inventoryApi.list({
          ...listParams,
          vehicles: vehicles.length ? vehicles : undefined,
          status: status || undefined,
        });
        setItems(Array.isArray(filtered) ? filtered : []);
      } else {
        setItems(counted);
      }
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, vehicles, status]);

  const counts = useMemo(() => {
    const c = { ALL: allItems.length };
    for (const v of VEHICLES) c[v.id] = allItems.filter((i) => i.vehicleCategory === v.id).length;
    c.LOW = allItems.filter((i) => stockOf(i) !== "IN_STOCK").length;
    return c;
  }, [allItems]);

  function clearFilters() {
    setVehicles([]);
    setStatus("");
  }

  function toggleVehicle(id) {
    setVehicles((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function toggleLowStock() {
    setStatus((prev) => (prev === "LOW_STOCK" ? "" : "LOW_STOCK"));
  }

  async function removeItem(item) {
    if (!confirm(t(lang, "confirmDelete"))) return;
    setDeletingId(item.id);
    setError("");
    try {
      await inventoryApi.remove(item.id);
      setItems((rows) => rows.filter((r) => r.id !== item.id));
      setAllItems((rows) => rows.filter((r) => r.id !== item.id));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setDeletingId(null);
    }
  }

  function openProduct(item) {
    nav(`/inventory/${item.id}/edit`, { state: { viewOnly: true } });
  }

  return (
    <div className="content">
      <div className="srch" style={{ marginBottom: 14, maxWidth: 320 }}>
        <span>⌕</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "search")} />
      </div>
      <div className="inv-toolbar">
        <div className="chips">
          <button className={`chip${!vehicles.length && !status ? " on" : ""}`} onClick={clearFilters}>
            {t(lang, "all")} ({counts.ALL})
          </button>
          {VEHICLES.map((v) => (
            <button
              key={v.id}
              className={`chip${vehicles.includes(v.id) ? " on" : ""}`}
              onClick={() => toggleVehicle(v.id)}
            >
              {v.label} ({counts[v.id] || 0})
            </button>
          ))}
          <button
            className={`chip warn${status === "LOW_STOCK" ? " on" : ""}`}
            onClick={toggleLowStock}
          >
            {t(lang, "lowBadge")} ({counts.LOW})
          </button>
        </div>
        <button type="button" className="btn btn-p inv-add" onClick={() => nav("/inventory/new")}>
          + {t(lang, "addPart")}
        </button>
      </div>
      {error ? <div className="err" style={{ marginBottom: 10 }}>{error}</div> : null}
      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty">
          <p>{t(lang, "noParts")}</p>
          <button className="btn btn-p" onClick={() => nav("/inventory/new")}>
            + {t(lang, "addPart")}
          </button>
        </div>
      ) : (
        <>
          <div className="inv-list" role="list">
            {items.map((item) => {
              const st = stockOf(item);
              return (
                <div key={item.id} className="inv-list-row" role="listitem">
                  <button type="button" className="inv-list-body" onClick={() => openProduct(item)}>
                    <div className="inv-list-main">
                      <div className="inv-list-name">{item.partName}</div>
                      <div className="inv-list-price">{formatPrice(item.sellingPrice)}</div>
                      <span className="inv-list-cat">{vehicleLabel(item.vehicleCategory)}</span>
                    </div>
                    <div className="inv-list-right">
                      <span
                        className={`inv-list-qty${st === "LOW_STOCK" ? " low" : ""}${st === "OUT_OF_STOCK" ? " out" : ""}`}
                      >
                        {item.quantity}
                      </span>
                      <span className="inv-list-qty-lbl">{t(lang, "quantity")}</span>
                    </div>
                  </button>
                  <div className="inv-list-actions">
                    <button
                      type="button"
                      className="act-btn act-view"
                      aria-label={t(lang, "view")}
                      onClick={() => openProduct(item)}
                    >
                      <ViewIcon />
                      <span>{t(lang, "view")}</span>
                    </button>
                    <button
                      type="button"
                      className="act-btn act-edit"
                      aria-label={t(lang, "edit")}
                      onClick={() => setQtyItem(item)}
                    >
                      <EditIcon />
                      <span>{t(lang, "edit")}</span>
                    </button>
                    <button
                      type="button"
                      className="act-btn act-delete"
                      aria-label={t(lang, "delete")}
                      disabled={deletingId === item.id}
                      onClick={() => removeItem(item)}
                    >
                      <TrashIcon />
                      <span>{t(lang, "delete")}</span>
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="inv-list-foot">{t(lang, "showing", items.length, allItems.length)}</div>
          </div>

          <div className="card inv-table">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t(lang, "partName")}</th>
                    <th>{t(lang, "vehicle")}</th>
                    <th>{t(lang, "quantity")}</th>
                    <th>{t(lang, "price")}</th>
                    <th>{t(lang, "status")}</th>
                    <th>{t(lang, "updated")}</th>
                    <th className="tbl-actions-hd">{t(lang, "actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const st = stockOf(item);
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="pname">{item.partName}</div>
                          <div className="pspec">{item.specification || item.localName || item.brand || ""}</div>
                        </td>
                        <td>
                          <span className={`badge ${item.vehicleCategory === "FOUR_WHEELER" ? "b-bl" : "b-gr"}`}>
                            {vehicleLabel(item.vehicleCategory)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`qty-text${st === "LOW_STOCK" ? " low" : ""}${st === "OUT_OF_STOCK" ? " out" : ""}`}
                          >
                            {item.quantity}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatPrice(item.sellingPrice)}</td>
                        <td>
                          <StatusBadge status={st} lang={lang} />
                        </td>
                        <td style={{ fontSize: 12, color: "#9ca3af" }}>{formatDate(item.updatedAt)}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="act-btn act-view"
                              onClick={() => openProduct(item)}
                            >
                              <ViewIcon />
                              <span>{t(lang, "view")}</span>
                            </button>
                            <button
                              type="button"
                              className="act-btn act-edit"
                              onClick={() => setQtyItem(item)}
                            >
                              <EditIcon />
                              <span>{t(lang, "edit")}</span>
                            </button>
                            <button
                              type="button"
                              className="act-btn act-delete"
                              disabled={deletingId === item.id}
                              onClick={() => removeItem(item)}
                            >
                              <TrashIcon />
                              <span>{t(lang, "delete")}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="tbl-foot">{t(lang, "showing", items.length, allItems.length)}</div>
          </div>
        </>
      )}
      {qtyItem ? (
        <SetQuantityModal
          item={qtyItem}
          lang={lang}
          onClose={() => setQtyItem(null)}
          onEditProduct={() => {
            const id = qtyItem.id;
            setQtyItem(null);
            nav(`/inventory/${id}/edit`);
          }}
          onSaved={(updated) => {
            setItems((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
            setAllItems((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
            setQtyItem(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
