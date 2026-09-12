import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatApiError, inventoryApi } from "../api";
import { useLang } from "../context/LangContext";
import { t, vehicleLabel } from "../i18n";
import { formatPrice, formatDate, stockOf } from "../utils";
import StatusBadge from "../components/StatusBadge";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import SetQuantityModal from "../components/SetQuantityModal";

// DEV ONLY: one-tap sample catalog for trying the page out without adding
// parts by hand. Creates real inventory rows via the normal add-part API.
const DUMMY_PARTS = [
  { partName: "Brake Pad Set — Front", vehicleCategory: "FOUR_WHEELER", quantity: 8, minQuantity: 4, costPrice: 480, sellingPrice: 650 },
  { partName: "Engine Oil Filter", vehicleCategory: "TWO_WHEELER", quantity: 20, minQuantity: 8, costPrice: 90, sellingPrice: 150 },
  { partName: "Clutch Plate", vehicleCategory: "TWO_WHEELER", quantity: 5, minQuantity: 4, costPrice: 620, sellingPrice: 850 },
  { partName: "Headlight Assembly", vehicleCategory: "FOUR_WHEELER", quantity: 3, minQuantity: 3, costPrice: 1450, sellingPrice: 1950 },
  { partName: "Battery 12V 35Ah", vehicleCategory: "FOUR_WHEELER", quantity: 6, minQuantity: 5, costPrice: 2400, sellingPrice: 3100 },
  { partName: "Chain Sprocket Kit", vehicleCategory: "TWO_WHEELER", quantity: 12, minQuantity: 5, costPrice: 850, sellingPrice: 1150 },
];

export default function Inventory() {
  const { lang } = useLang();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState(() => params.get("q") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [qtyItem, setQtyItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState("");

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  async function load() {
    setError("");
    try {
      const rows = await inventoryApi.list({ q: q.trim() || undefined });
      setItems(Array.isArray(rows) ? rows : []);
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
  }, [q]);

  async function addDummyData() {
    setSeeding(true);
    try {
      await Promise.allSettled(DUMMY_PARTS.map((p) => inventoryApi.add(p)));
      await load();
      flash(t(lang, "saved"));
    } finally {
      setSeeding(false);
    }
  }

  async function removeItem() {
    if (!deleteItem) return;
    setDeletingId(deleteItem.id);
    setError("");
    try {
      await inventoryApi.remove(deleteItem.id);
      setItems((rows) => rows.filter((r) => r.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(item) {
    nav(`/inventory/${item.id}/edit`);
  }

  return (
    <div className="content">
      <div className="inv-search">
        <span>⌕</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "search")} />
      </div>
      <div className="inv-toolbar">
        <button type="button" className="inv-dummy-btn" disabled={seeding} onClick={addDummyData}>
          {seeding ? t(lang, "saving") : t(lang, "useDummyData")}
        </button>
        <button type="button" className="btn btn-p inv-add" onClick={() => nav("/inventory/new")}>
          + {t(lang, "addPart")}
        </button>
      </div>
      {error ? <div className="err" style={{ marginBottom: 10 }}>{error}</div> : null}
      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty">
          <p>{q.trim() ? t(lang, "noParts") : t(lang, "hintAdd")}</p>
        </div>
      ) : (
        <>
          <div className="inv-list" role="list">
            {items.map((item) => {
              const st = stockOf(item);
              return (
                <div key={item.id} className="inv-list-row" role="listitem">
                  <button type="button" className="inv-list-body" onClick={() => setQtyItem(item)}>
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
                      onClick={() => setQtyItem(item)}
                    >
                      <ViewIcon />
                      <span>{t(lang, "view")}</span>
                    </button>
                    <button
                      type="button"
                      className="act-btn act-edit"
                      aria-label={t(lang, "edit")}
                      onClick={() => openEdit(item)}
                    >
                      <EditIcon />
                      <span>{t(lang, "edit")}</span>
                    </button>
                    <button
                      type="button"
                      className="act-btn act-delete"
                      aria-label={t(lang, "delete")}
                      disabled={deletingId === item.id}
                      onClick={() => setDeleteItem(item)}
                    >
                      <TrashIcon />
                      <span>{t(lang, "delete")}</span>
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="inv-list-foot">{t(lang, "partsCount", items.length)}</div>
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
                              onClick={() => setQtyItem(item)}
                            >
                              <ViewIcon />
                              <span>{t(lang, "view")}</span>
                            </button>
                            <button
                              type="button"
                              className="act-btn act-edit"
                              onClick={() => openEdit(item)}
                            >
                              <EditIcon />
                              <span>{t(lang, "edit")}</span>
                            </button>
                            <button
                              type="button"
                              className="act-btn act-delete"
                              disabled={deletingId === item.id}
                              onClick={() => setDeleteItem(item)}
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
            <div className="tbl-foot">{t(lang, "partsCount", items.length)}</div>
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
            setQtyItem(null);
          }}
        />
      ) : null}
      {deleteItem ? (
        <ConfirmDeleteModal
          title={t(lang, "confirmDeleteTitle")}
          message={t(lang, "confirmDelete")}
          itemName={deleteItem.partName}
          cancelLabel={t(lang, "cancel")}
          deleteLabel={deletingId ? t(lang, "deleting") : t(lang, "delete")}
          busy={Boolean(deletingId)}
          onCancel={() => {
            if (!deletingId) setDeleteItem(null);
          }}
          onConfirm={removeItem}
        />
      ) : null}
      {toast ? <div className="toast">{toast}</div> : null}
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
