import { useEffect, useState } from "react";
import { formatApiError, inventoryApi } from "../api";
import { useLang } from "../context/LangContext";
import { t, vehicleLabel } from "../i18n";
import { stockOf } from "../utils";
import StatusBadge from "../components/StatusBadge";
import SetQuantityModal from "../components/SetQuantityModal";

export default function LowStocks() {
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalItem, setModalItem] = useState(null);
  const [minEdit, setMinEdit] = useState(null);

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

  const out = items.filter((i) => stockOf(i) === "OUT_OF_STOCK");
  const low = items.filter((i) => stockOf(i) === "LOW_STOCK");

  async function markReceived(item) {
    try {
      await inventoryApi.quantity(item.id, { change: Math.max(item.minQuantity - item.quantity, 1), changeType: "RECEIVED" });
      await load();
    } catch (e) {
      setError(formatApiError(e));
    }
  }

  async function saveMin(item, minQuantity) {
    try {
      await inventoryApi.update(item.id, { minQuantity: Number(minQuantity) || 0 });
      setMinEdit(null);
      await load();
    } catch (e) {
      setError(formatApiError(e));
    }
  }

  return (
    <div className="content">
      <div className="muted" style={{ marginBottom: 12 }}>
        {t(lang, "reorder")}
      </div>
      <div className="chips">
        <span className="chip warn">
          {out.length} {t(lang, "outCount")}
        </span>
        <span className="chip">
          {low.length} {t(lang, "belowMin")}
        </span>
      </div>
      {error ? <div className="err">{error}</div> : null}
      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty">
          <h2>{t(lang, "inStockBadge")}</h2>
          <p>{lang === "hi" ? "कोई पार्ट मिनिमम से नीचे नहीं है।" : "Nothing is at or below minimum right now."}</p>
        </div>
      ) : (
        <div className="card">
          {items.map((item) => (
            <div className="alert-card" key={item.id}>
              <div className="alert-top">
                <div>
                  <div className="pname">{item.partName}</div>
                  <div className="pspec">
                    {vehicleLabel(item.vehicleCategory, lang)} · {item.quantity} left · min {item.minQuantity}
                  </div>
                  <div className="hint">{t(lang, "alertSent")}</div>
                </div>
                <StatusBadge status={stockOf(item)} lang={lang} />
              </div>
              <div className="alert-actions">
                <button className="btn btn-p" onClick={() => markReceived(item)}>
                  {t(lang, "markReceived")}
                </button>
                <button className="btn btn-s" onClick={() => setModalItem(item)}>
                  {t(lang, "setQty")}
                </button>
                {minEdit === item.id ? (
                  <>
                    <input
                      className="inp"
                      style={{ width: 80, marginBottom: 0 }}
                      type="number"
                      min="0"
                      defaultValue={item.minQuantity}
                      id={`min-${item.id}`}
                    />
                    <button
                      className="btn btn-s"
                      onClick={() => saveMin(item, document.getElementById(`min-${item.id}`).value)}
                    >
                      {t(lang, "saveChanges")}
                    </button>
                  </>
                ) : (
                  <button className="btn btn-g" onClick={() => setMinEdit(item.id)}>
                    {t(lang, "editMin")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {modalItem ? (
        <SetQuantityModal
          item={modalItem}
          lang={lang}
          onClose={() => setModalItem(null)}
          onSaved={() => {
            setModalItem(null);
            load();
          }}
        />
      ) : null}
    </div>
  );
}
