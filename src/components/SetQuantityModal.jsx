import { useState } from "react";
import { formatApiError, inventoryApi } from "../api";
import { CHANGE_TYPES, t, vehicleLabel } from "../i18n";

export default function SetQuantityModal({ item, lang, onClose, onSaved, onEditProduct }) {
  const [qty, setQty] = useState(String(item.quantity ?? 0));
  const [reason, setReason] = useState("SOLD");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const next = Number(qty);
    if (!Number.isInteger(next) || next < 0) {
      setError(t(lang, "cannotBelowZero"));
      return;
    }
    const change = next - item.quantity;
    if (change === 0) {
      onClose();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await inventoryApi.quantity(item.id, { change, changeType: reason, note: note || undefined });
      onSaved(updated);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal qty-edit-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{t(lang, "editQuantity")}</h3>

        <div className="qty-edit-product">
          <div className="field-lbl">{t(lang, "partName")}</div>
          <div className="qty-edit-name">{item.partName}</div>
          {item.vehicleCategory ? (
            <div className="qty-edit-sub">{vehicleLabel(item.vehicleCategory)}</div>
          ) : null}
          {onEditProduct ? (
            <button type="button" className="btn btn-s qty-edit-product-btn" onClick={onEditProduct}>
              {t(lang, "editProduct")}
            </button>
          ) : null}
        </div>

        <label className="field-lbl">{t(lang, "setQty")}</label>
        <input
          className="big-qty"
          type="number"
          min="0"
          value={qty}
          onChange={(e) => {
            setError("");
            setQty(e.target.value);
          }}
        />
        <div className="field-lbl">{t(lang, "reason")}</div>
        <div className="chips">
          {CHANGE_TYPES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip${reason === c.id ? " on" : ""}`}
              onClick={() => {
                setError("");
                setReason(c.id);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="field-lbl">{t(lang, "note")}</label>
        <input
          className="inp"
          value={note}
          onChange={(e) => {
            setError("");
            setNote(e.target.value);
          }}
        />
        <div className="hint">{t(lang, "cannotBelowZero")}</div>
        {error ? <div className="err">{error}</div> : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-s" onClick={onClose}>
            {t(lang, "cancel")}
          </button>
          <button type="button" className="btn btn-p" disabled={busy} onClick={save}>
            {busy ? t(lang, "saving") : t(lang, "updateStock")}
          </button>
        </div>
      </div>
    </div>
  );
}
