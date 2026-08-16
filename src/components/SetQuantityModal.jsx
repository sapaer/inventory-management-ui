import { useState } from "react";
import { formatApiError, inventoryApi } from "../api";
import { CHANGE_TYPES, t } from "../i18n";

export default function SetQuantityModal({ item, lang, onClose, onSaved }) {
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
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t(lang, "setQty")}</h3>
        <div className="muted" style={{ fontSize: 13 }}>
          {item.partName}
        </div>
        <input className="big-qty" type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} />
        <div className="field-lbl">{t(lang, "reason")}</div>
        <div className="chips">
          {CHANGE_TYPES.map((c) => (
            <button key={c.id} className={`chip${reason === c.id ? " on" : ""}`} onClick={() => setReason(c.id)}>
              {lang === "hi" ? c.hi : c.en}
            </button>
          ))}
        </div>
        <label className="field-lbl">{t(lang, "note")}</label>
        <input className="inp" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="hint">{t(lang, "cannotBelowZero")}</div>
        {error ? <div className="err">{error}</div> : null}
        <div className="modal-actions">
          <button className="btn btn-s" onClick={onClose}>
            {t(lang, "cancel")}
          </button>
          <button className="btn btn-p" disabled={busy} onClick={save}>
            {busy ? t(lang, "saving") : t(lang, "updateStock")}
          </button>
        </div>
      </div>
    </div>
  );
}
