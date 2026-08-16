import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatApiError, inventoryApi } from "../api";
import { useLang } from "../context/LangContext";
import { t, vehicleLabel, VEHICLES } from "../i18n";
import { formatPrice, formatWhen, stockOf } from "../utils";
import StatusBadge from "../components/StatusBadge";
import SetQuantityModal from "../components/SetQuantityModal";

export default function Inventory() {
  const { lang } = useLang();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [q, setQ] = useState(() => params.get("q") || "");
  const [vehicle, setVehicle] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalItem, setModalItem] = useState(null);

  async function load() {
    setError("");
    try {
      const params = { q: q.trim() || undefined };
      const countRows = await inventoryApi.list(params);
      const counted = Array.isArray(countRows) ? countRows : [];
      setAllItems(counted);
      if (vehicle || status) {
        const filtered = await inventoryApi.list({
          ...params,
          vehicle: vehicle || undefined,
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
  }, [q, vehicle, status]);

  const counts = useMemo(() => {
    const c = { ALL: allItems.length };
    for (const v of VEHICLES) c[v.id] = allItems.filter((i) => i.vehicleCategory === v.id).length;
    c.LOW = allItems.filter((i) => stockOf(i) !== "IN_STOCK").length;
    return c;
  }, [allItems]);

  async function bump(item, delta) {
    try {
      const updated = await inventoryApi.quantity(item.id, {
        change: delta,
        changeType: delta > 0 ? "RECEIVED" : "SOLD",
      });
      setItems((rows) => rows.map((r) => (r.id === item.id ? updated : r)));
      setAllItems((rows) => rows.map((r) => (r.id === item.id ? updated : r)));
    } catch (e) {
      setError(formatApiError(e));
    }
  }

  return (
    <div className="content">
      <div className="srch" style={{ marginBottom: 14, maxWidth: 320 }}>
        <span>⌕</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "search")} />
      </div>
      <div className="chips">
        <button className={`chip${!vehicle && !status ? " on" : ""}`} onClick={() => { setVehicle(""); setStatus(""); }}>
          {t(lang, "all")} ({counts.ALL})
        </button>
        {VEHICLES.map((v) => (
          <button
            key={v.id}
            className={`chip${vehicle === v.id ? " on" : ""}`}
            onClick={() => { setVehicle(v.id); setStatus(""); }}
          >
            {lang === "hi" ? v.hi : v.en} ({counts[v.id] || 0})
          </button>
        ))}
        <button
          className={`chip warn${status === "LOW_STOCK" ? " on" : ""}`}
          onClick={() => { setVehicle(""); setStatus(status === "LOW_STOCK" ? "" : "LOW_STOCK"); }}
        >
          {t(lang, "lowBadge")} ({counts.LOW})
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
        <div className="card">
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
                  <th />
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
                          {vehicleLabel(item.vehicleCategory, lang)}
                        </span>
                      </td>
                      <td>
                        <div className="qty-row">
                          <button className="qb" onClick={() => bump(item, -1)} disabled={item.quantity <= 0}>
                            −
                          </button>
                          <button
                            className={`qv${st === "LOW_STOCK" ? " low" : ""}${st === "OUT_OF_STOCK" ? " out" : ""}`}
                            onClick={() => setModalItem(item)}
                            title={t(lang, "setQty")}
                          >
                            {item.quantity}
                          </button>
                          <button className="qb" onClick={() => bump(item, 1)}>
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatPrice(item.sellingPrice)}</td>
                      <td>
                        <StatusBadge status={st} lang={lang} />
                      </td>
                      <td style={{ fontSize: 12, color: "#9ca3af" }}>{formatWhen(item.updatedAt)}</td>
                      <td>
                        <button className="btn btn-g" onClick={() => nav(`/inventory/${item.id}/edit`)}>
                          {t(lang, "edit")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="tbl-foot">{t(lang, "showing", items.length, allItems.length)}</div>
        </div>
      )}
      {modalItem ? (
        <SetQuantityModal
          item={modalItem}
          lang={lang}
          onClose={() => setModalItem(null)}
          onSaved={(updated) => {
            setItems((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
            setAllItems((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
            setModalItem(null);
          }}
        />
      ) : null}
    </div>
  );
}
