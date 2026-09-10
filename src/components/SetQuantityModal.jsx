import { useState } from "react";
import { formatApiError, inventoryApi } from "../api";
import QtyStepper from "./QtyStepper";
import { CHANGE_TYPES, t, vehicleLabel } from "../i18n";

export default function SetQuantityModal({ item, lang, onClose, onSaved, onEditProduct }) {
  const current = Number(item.quantity ?? 0);
  const [qty, setQty] = useState(current);
  const [reason, setReason] = useState("SOLD");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const next = Number(qty);
  const valid = Number.isInteger(next) && next >= 0;
  const change = valid ? next - current : 0;
  const changed = valid && change !== 0;

  async function save() {
    if (!valid) {
      setError(t(lang, "cannotBelowZero"));
      return;
    }
    if (!changed) {
      onClose();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await inventoryApi.quantity(item.id, {
        change,
        changeType: reason,
        note: note.trim() || undefined,
      });
      onSaved(updated);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={busy ? undefined : onClose}>
      <div
        className="modal qty-edit-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qty-edit-title"
      >
        <header className="qty-edit-hd">
          <div>
            <h3 id="qty-edit-title">{t(lang, "editQuantity")}</h3>
            <p className="qty-edit-lead">{t(lang, "editQuantityHint")}</p>
          </div>
          <button type="button" className="qty-edit-x" aria-label={t(lang, "cancel")} disabled={busy} onClick={onClose}>
            ×
          </button>
        </header>

        <div className="qty-edit-product">
          <div className="qty-edit-product-top">
            <div className="qty-edit-product-copy">
              <div className="qty-edit-name">{item.partName}</div>
              {item.vehicleCategory ? (
                <span className="qty-edit-pill">{vehicleLabel(item.vehicleCategory)}</span>
              ) : null}
            </div>
            {onEditProduct ? (
              <button type="button" className="qty-edit-product-link" onClick={onEditProduct}>
                {t(lang, "editProduct")}
              </button>
            ) : null}
          </div>
          <div className="qty-edit-stock">
            <span>{t(lang, "currentStock")}</span>
            <strong>{current}</strong>
          </div>
        </div>

        <section className="qty-edit-block">
          <div className="qty-edit-block-lbl">{t(lang, "setQty")}</div>
          <QtyStepper
            value={qty}
            min={0}
            disabled={busy}
            onChange={(v) => {
              setError("");
              setQty(v === "" ? "" : Number(v));
            }}
          />
          {valid ? (
            <div className={`qty-edit-delta${changed ? (change > 0 ? " up" : " down") : ""}`}>
              {changed
                ? t(lang, "qtyChangePreview", current, next, change > 0 ? `+${change}` : String(change))
                : t(lang, "qtyNoChange")}
            </div>
          ) : null}
        </section>

        <section className="qty-edit-block">
          <div className="qty-edit-block-lbl">{t(lang, "reason")}</div>
          <div className="qty-edit-reasons" role="group" aria-label={t(lang, "reason")}>
            {CHANGE_TYPES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`qty-edit-reason${reason === c.id ? " on" : ""}`}
                disabled={busy}
                onClick={() => {
                  setError("");
                  setReason(c.id);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <section className="qty-edit-block">
          <label className="qty-edit-block-lbl" htmlFor="qty-edit-note">
            {t(lang, "note")}
          </label>
          <input
            id="qty-edit-note"
            className="inp qty-edit-note"
            value={note}
            disabled={busy}
            placeholder={t(lang, "notePlaceholder")}
            onChange={(e) => {
              setError("");
              setNote(e.target.value);
            }}
          />
        </section>

        {error ? <div className="err qty-edit-err">{error}</div> : null}

        <div className="qty-edit-actions">
          <button type="button" className="btn btn-g" disabled={busy} onClick={onClose}>
            {t(lang, "cancel")}
          </button>
          <button type="button" className="btn btn-p" disabled={busy || !valid} onClick={save}>
            {busy ? t(lang, "saving") : t(lang, "updateStock")}
          </button>
        </div>
      </div>
    </div>
  );
}
