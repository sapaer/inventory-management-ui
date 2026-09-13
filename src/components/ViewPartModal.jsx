import { useEffect, useState } from "react";
import { formatApiError, inventoryApi } from "../api";
import { t, vehicleLabel } from "../i18n";
import { formatPrice, formatDate, stockOf } from "../utils";
import StatusBadge from "./StatusBadge";

export default function ViewPartModal({ item, lang, thumb, onClose, onEdit, onHistory }) {
  const [detail, setDetail] = useState(item);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    inventoryApi
      .get(item.id)
      .then((full) => {
        if (alive && full) setDetail(full);
      })
      .catch((e) => {
        if (alive) setError(formatApiError(e));
      });
    return () => {
      alive = false;
    };
  }, [item.id]);

  const st = stockOf(detail);
  const margin =
    Number(detail.costPrice) > 0 ? (Number(detail.sellingPrice) || 0) - Number(detail.costPrice) : null;
  const compat = Array.isArray(detail.compatibleVehicles) ? detail.compatibleVehicles : [];

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal part-view-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="part-view-title"
      >
        <header className="qty-edit-hd">
          <div>
            <h3 id="part-view-title">{t(lang, "partDetails")}</h3>
          </div>
          <div className="part-view-hd-actions">
            <button type="button" className="part-view-icon-btn" aria-label={t(lang, "history")} onClick={onHistory}>
              <HistoryIcon />
            </button>
            <button type="button" className="part-view-icon-btn" aria-label={t(lang, "edit")} onClick={onEdit}>
              <PencilIcon />
            </button>
            <button
              type="button"
              className="qty-edit-x part-view-x"
              aria-label={t(lang, "cancel")}
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </header>

        <div className="part-view-summary">
          {thumb}
          <div className="part-view-summary-copy">
            <div className="part-view-name">{detail.partName}</div>
            <div className="part-view-badges">
              {detail.vehicleCategory ? (
                <span className="badge b-veh">{vehicleLabel(detail.vehicleCategory)}</span>
              ) : null}
              <StatusBadge status={st} lang={lang} />
            </div>
          </div>
        </div>

        <div className="part-view-body">
          <div className="part-view-grid">
            <ViewField label={t(lang, "quantity")} value={detail.quantity} />
            <ViewField label={t(lang, "minQty")} value={detail.minQuantity} />
            <ViewField label={t(lang, "sellingPrice")} value={formatPrice(detail.sellingPrice)} />
            <ViewField label={t(lang, "costPrice")} value={detail.costPrice ? formatPrice(detail.costPrice) : "—"} />
            <ViewField label={t(lang, "marginLbl")} value={margin != null ? formatPrice(margin) : "—"} />
            <ViewField label={t(lang, "partNumber")} value={detail.partNumber || "—"} />
            {detail.brand ? <ViewField label={t(lang, "brandField")} value={detail.brand} /> : null}
            {detail.model ? <ViewField label={t(lang, "model")} value={detail.model} /> : null}
            {detail.localName ? <ViewField label={t(lang, "localName")} value={detail.localName} /> : null}
            {detail.specification ? <ViewField label={t(lang, "spec")} value={detail.specification} /> : null}
            <ViewField label={t(lang, "updated")} value={formatDate(detail.updatedAt)} />
          </div>

          {compat.length ? (
            <section className="part-view-block">
              <div className="qty-edit-block-lbl">{t(lang, "compatibleVehicles")}</div>
              <div className="compat-chips" role="list">
                {compat.map((v, i) => (
                  <span className="compat-chip" role="listitem" key={`${v.make}-${v.model}-${i}`}>
                    <span className="compat-chip-text">{[v.make, v.model].filter(Boolean).join(" ")}</span>
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {detail.description ? (
            <section className="part-view-block">
              <div className="qty-edit-block-lbl">{t(lang, "description")}</div>
              <p className="part-view-desc">{detail.description}</p>
            </section>
          ) : null}

          {error ? <div className="err qty-edit-err part-view-block">{error}</div> : null}
        </div>
      </div>
    </div>
  );
}

function ViewField({ label, value }) {
  return (
    <div className="part-view-field">
      <span className="part-view-field-lbl">{label}</span>
      <span className="part-view-field-val">{value === "" || value === null || value === undefined ? "—" : value}</span>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4.5h4.5" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
