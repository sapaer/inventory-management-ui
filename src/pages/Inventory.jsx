import { useEffect, useMemo, useRef, useState } from "react";
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

// Vehicle type is shown by icon shape, not color — one neutral forest tint
// for all of them (`.b-veh` / `.inv-thumb-ic`), so color stays reserved for
// stock status (green/amber/red) instead of a rainbow of category tags.
const VEHICLE_ICON = {
  TWO_WHEELER: BikeIcon,
  FOUR_WHEELER: CarIcon,
  THREE_WHEELER: AutoIcon,
  COMMERCIAL: TruckIcon,
  EV: BoltIcon,
};

const SORTS = [
  { id: "name", key: "sortName" },
  { id: "qtyAsc", key: "sortQtyLow" },
  { id: "recent", key: "sortRecent" },
];

function sortItems(items, sort) {
  const list = [...items];
  if (sort === "name") return list.sort((a, b) => a.partName.localeCompare(b.partName));
  if (sort === "qtyAsc") return list.sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0));
  return list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

// DEV ONLY: three candidate mobile-card layouts, switchable live. Pick a
// winner, then delete this picker plus the other two card bodies.
const CARD_STYLES = [
  { id: "minimal", label: "Minimal" },
  { id: "balanced", label: "Balanced" },
  { id: "imageForward", label: "Image-forward" },
];

function useDevStyle(storageKey, fallback) {
  const [style, setStyle] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || fallback;
    } catch {
      return fallback;
    }
  });
  const update = (next) => {
    setStyle(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* ignore */
    }
  };
  return [style, update];
}

function statusText(lang, st) {
  if (st === "OUT_OF_STOCK") return t(lang, "outBadge");
  if (st === "LOW_STOCK") return t(lang, "lowBadge");
  return t(lang, "inStockBadge");
}

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
  const [sort, setSort] = useState("recent");
  const [cardStyle, setCardStyle] = useDevStyle("pn_dev_invcard", "balanced");

  const sortedItems = useMemo(() => sortItems(items, sort), [items, sort]);

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
        <div className="inv-toolbar-left">
          <SortMenu lang={lang} sort={sort} onChange={setSort} />
          <button type="button" className="inv-dummy-btn" disabled={seeding} onClick={addDummyData}>
            {seeding ? t(lang, "saving") : t(lang, "useDummyData")}
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
          <p>{q.trim() ? t(lang, "noParts") : t(lang, "hintAdd")}</p>
        </div>
      ) : (
        <>
          <div className="inv-dev-switches">
            <span className="inv-dev-switch-label">Card design (dev):</span>
            <div className="inv-dev-switch-btns">
              {CARD_STYLES.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`inv-dev-chip${cardStyle === opt.id ? " on" : ""}`}
                  onClick={() => setCardStyle(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="inv-list" role="list">
            {sortedItems.map((item) => (
              <PartCard
                key={item.id}
                item={item}
                lang={lang}
                cardStyle={cardStyle}
                deletingId={deletingId}
                onView={() => setQtyItem(item)}
                onEdit={() => openEdit(item)}
                onDelete={() => setDeleteItem(item)}
              />
            ))}
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
                    <th>{t(lang, "marginLbl")}</th>
                    <th>{t(lang, "status")}</th>
                    <th>{t(lang, "updated")}</th>
                    <th className="tbl-actions-hd">{t(lang, "actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => {
                    const st = stockOf(item);
                    const margin = Number(item.costPrice) > 0 ? (Number(item.sellingPrice) || 0) - Number(item.costPrice) : null;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="tbl-part">
                            <PartThumb item={item} />
                            <div>
                              <div className="pname">{item.partName}</div>
                              <div className="pspec">
                                {item.partNumber ? `${t(lang, "skuLbl")}: ${item.partNumber}` : item.specification || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge b-veh">{vehicleLabel(item.vehicleCategory)}</span>
                        </td>
                        <td>
                          <span
                            className={`qty-text${st === "LOW_STOCK" ? " low" : ""}${st === "OUT_OF_STOCK" ? " out" : ""}`}
                          >
                            {item.quantity}
                          </span>
                          <span className="qty-min"> · {t(lang, "qtyMinLbl", item.minQuantity)}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatPrice(item.sellingPrice)}</td>
                        <td className="tbl-margin">{margin != null ? formatPrice(margin) : "—"}</td>
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
    </div>
  );
}

/* Custom dropdown instead of a native <select> — the browser's own option
   list can't be restyled and looks out of place next to the rest of the
   app's own panel/menu design (same recipe as the shop-switch menu). */
function SortMenu({ lang, sort, onChange }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => !root.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = SORTS.find((s) => s.id === sort) || SORTS[0];

  return (
    <div className="inv-sort" ref={root}>
      <button
        type="button"
        className="inv-sort-btn"
        aria-label={t(lang, "sortBy")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <SortIcon />
        <span>{t(lang, current.key)}</span>
        <CaretDownIcon />
      </button>
      {open ? (
        <div className="inv-sort-menu" role="menu">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="menuitem"
              className={`inv-sort-item${s.id === sort ? " on" : ""}`}
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
            >
              {t(lang, s.key)}
              {s.id === sort ? <CheckIcon /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SortIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h11M4 12h7M4 17h4" />
      <path d="M18 6v13m0 0 3-3m-3 3-3-3" />
    </svg>
  );
}
function CaretDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

/* DEV: three candidate card bodies sharing the same actions row — pick a
   winner via the chip picker above the list, then delete the other two
   branches and this comment. */
function PartCard({ item, lang, cardStyle, deletingId, onView, onEdit, onDelete }) {
  const st = stockOf(item);
  const margin = Number(item.costPrice) > 0 ? (Number(item.sellingPrice) || 0) - Number(item.costPrice) : null;
  const qtyCls = `${st === "LOW_STOCK" ? " low" : ""}${st === "OUT_OF_STOCK" ? " out" : ""}`;

  return (
    <div className="inv-list-row" role="listitem">
      <button type="button" className={`inv-list-body inv-card-${cardStyle}`} onClick={onView}>
        {cardStyle === "imageForward" ? (
          <span className="inv-thumb-wrap">
            <PartThumb item={item} big />
            <span className={`inv-thumb-qty${qtyCls}`}>{item.quantity}</span>
          </span>
        ) : (
          <PartThumb item={item} />
        )}

        {cardStyle === "minimal" ? (
          <div className="inv-list-main">
            <div className="inv-list-name">{item.partName}</div>
            <div className={`inv-list-status${qtyCls}`}>{statusText(lang, st)}</div>
            <div className="inv-list-price">{formatPrice(item.sellingPrice)}</div>
          </div>
        ) : cardStyle === "balanced" ? (
          <div className="inv-list-main">
            <div className="inv-list-name">
              {item.partName} <span className="inv-list-veh">· {vehicleLabel(item.vehicleCategory)}</span>
            </div>
            {item.partNumber ? (
              <div className="inv-list-sku">
                {t(lang, "skuLbl")}: {item.partNumber}
              </div>
            ) : null}
            <div className="inv-list-price">
              {formatPrice(item.sellingPrice)}
              {margin != null ? <span className="inv-list-margin">{t(lang, "marginPlus", formatPrice(margin))}</span> : null}
            </div>
          </div>
        ) : (
          <div className="inv-list-main">
            <div className="inv-list-name-row">
              <span className="inv-list-name">{item.partName}</span>
              <span className="inv-list-price">{formatPrice(item.sellingPrice)}</span>
            </div>
            <div className="inv-list-meta">
              {vehicleLabel(item.vehicleCategory)} · {statusText(lang, st)} · {t(lang, "qtyMinLbl", item.minQuantity)}
            </div>
          </div>
        )}

        {cardStyle !== "imageForward" ? (
          <div className="inv-list-right">
            <span className={`inv-list-qty${qtyCls}`}>{item.quantity}</span>
            {cardStyle === "balanced" ? (
              <span className="inv-list-qty-lbl">
                {t(lang, "quantity")} · {t(lang, "qtyMinLbl", item.minQuantity)}
              </span>
            ) : (
              <span className="inv-list-qty-lbl">{t(lang, "quantity")}</span>
            )}
          </div>
        ) : null}
      </button>
      <div className="inv-list-actions">
        <button type="button" className="act-btn act-view" aria-label={t(lang, "view")} onClick={onView}>
          <ViewIcon />
          <span>{t(lang, "view")}</span>
        </button>
        <button type="button" className="act-btn act-edit" aria-label={t(lang, "edit")} onClick={onEdit}>
          <EditIcon />
          <span>{t(lang, "edit")}</span>
        </button>
        <button
          type="button"
          className="act-btn act-delete"
          aria-label={t(lang, "delete")}
          disabled={deletingId === item.id}
          onClick={onDelete}
        >
          <TrashIcon />
          <span>{t(lang, "delete")}</span>
        </button>
      </div>
    </div>
  );
}

/* A part's own photo when it has one, otherwise a vehicle-category icon so
   rows never sit as bare text — cheap visual anchor for scanning a list. */
function PartThumb({ item, big }) {
  const cls = `inv-thumb${big ? " inv-thumb-big" : ""}`;
  if (item.images?.[0]) {
    return <img className={cls} src={item.images[0]} alt="" />;
  }
  const Icon = VEHICLE_ICON[item.vehicleCategory] || CarIcon;
  return (
    <span className={`${cls} inv-thumb-ic`}>
      <Icon />
    </span>
  );
}

function BikeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-9.5 11.5L9 10h4l3 4h3.5M9 10 7 6h3" />
    </svg>
  );
}
function CarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" />
      <circle cx="7.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function AutoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16V9a1 1 0 0 1 1-1h6l4 4h4a1 1 0 0 1 1 1v3" />
      <path d="M4 16h16" />
      <circle cx="7" cy="18.3" r="1.7" />
      <circle cx="17" cy="18.3" r="1.7" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h10v9H3z" />
      <path d="M13 11h4l3 3v2h-7" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
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
