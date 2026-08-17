import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { formatApiError, inventoryApi, uploadApi } from "../api";
import { useLang } from "../context/LangContext";
import { t, VEHICLES } from "../i18n";
import { formatWhen } from "../utils";

const empty = {
  partName: "",
  localName: "",
  specification: "",
  description: "",
  vehicleCategory: "FOUR_WHEELER",
  brand: "",
  model: "",
  quantity: 1,
  minQuantity: 2,
  sellingPrice: "",
  costPrice: "",
  images: [],
};

export default function PartForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { lang } = useLang();
  const nav = useNavigate();
  const loc = useLocation();
  const fileRef = useRef(null);
  const [form, setForm] = useState(() => ({
    ...empty,
    partName: loc.state?.partName || "",
    vehicleCategory: loc.state?.vehicleCategory || "FOUR_WHEELER",
  }));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [history, setHistory] = useState([]);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!editing) return;
    inventoryApi
      .get(id)
      .then((item) => {
        setForm({
          partName: item.partName || "",
          localName: item.localName || "",
          specification: item.specification || "",
          description: item.description || "",
          vehicleCategory: item.vehicleCategory || "FOUR_WHEELER",
          brand: item.brand || "",
          model: item.model || "",
          quantity: item.quantity ?? 1,
          minQuantity: item.minQuantity ?? 2,
          sellingPrice: item.sellingPrice ?? "",
          costPrice: "",
          images: item.images || [],
        });
        const hasExtra =
          item.localName || item.specification || item.brand || item.model || item.description || (item.images || []).length;
        if (hasExtra) setMoreOpen(true);
      })
      .catch((e) => setError(formatApiError(e)));
    inventoryApi
      .history(id, 1, 20)
      .then((data) => setHistory(Array.isArray(data?.content) ? data.content : []))
      .catch(() => setHistory([]));
  }, [editing, id]);

  function set(key, value) {
    setError("");
    setForm((f) => ({ ...f, [key]: value }));
  }

  function payload() {
    const body = {
      partName: form.partName.trim(),
      localName: form.localName.trim() || undefined,
      specification: form.specification.trim() || undefined,
      description: form.description.trim() || undefined,
      vehicleCategory: form.vehicleCategory,
      brand: form.brand.trim() || undefined,
      model: form.model.trim() || undefined,
      minQuantity: Number(form.minQuantity) || 2,
      sellingPrice: form.sellingPrice === "" ? undefined : Number(form.sellingPrice),
      costPrice: form.costPrice === "" ? undefined : Number(form.costPrice),
      images: form.images.slice(0, 3),
    };
    if (!editing) body.quantity = Number(form.quantity);
    return body;
  }

  async function onFiles(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    if (form.images.length + list.length > 3) {
      setError(t(lang, "maxPhotos"));
      return;
    }
    setUploading(true);
    setError("");
    try {
      const urls = [];
      for (const file of list) {
        urls.push(await uploadApi.uploadFile(file));
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, 3) }));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(addAnother) {
    if (!form.partName.trim()) {
      setError(t(lang, "partName") + " " + t(lang, "required"));
      return;
    }
    if (!editing) {
      const qty = Number(form.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        setError(t(lang, "quantityMustBePositive"));
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await inventoryApi.update(id, payload());
        nav("/inventory");
        return;
      }
      const created = await inventoryApi.add(payload());
      if (created?.isDuplicate) setToast(t(lang, "duplicateWarn"));
      if (addAnother) {
        setForm(empty);
        setMoreOpen(false);
        setToast(created?.isDuplicate ? t(lang, "duplicateWarn") : t(lang, "saved"));
        setTimeout(() => setToast(""), 2200);
      } else {
        nav("/inventory");
      }
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(t(lang, "confirmDelete"))) return;
    setBusy(true);
    try {
      await inventoryApi.remove(id);
      nav("/inventory");
    } catch (e) {
      setError(formatApiError(e));
      setBusy(false);
    }
  }

  return (
    <div className="content">
      <div className="add-wrap">
        <button type="button" className="link muted add-back" onClick={() => nav("/inventory")}>
          ← {t(lang, "inventory")}
        </button>

        <div className="add-card">
          <h1 className="add-title">{editing ? t(lang, "edit") : t(lang, "addPart")}</h1>
          <p className="add-sub">{t(lang, "addPartSub")}</p>

          <div className="field-grp">
            <label className="f-lbl">
              {t(lang, "partName")} <span className="req">*</span>
            </label>
            <input
              className="f-inp"
              value={form.partName}
              onChange={(e) => set("partName", e.target.value)}
              placeholder="Maruti Swift Brake Pad Set"
            />
          </div>

          <div className="field-grp">
            <label className="f-lbl">
              {t(lang, "vehicle")} <span className="req">*</span>
            </label>
            <div className="veh-pills">
              {VEHICLES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`vp${form.vehicleCategory === v.id ? " on" : ""}`}
                  onClick={() => set("vehicleCategory", v.id)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="two-col">
            {!editing ? (
              <div className="field-grp">
                <label className="f-lbl">
                  {t(lang, "quantity")} <span className="req">*</span>
                </label>
                <div className="qty-ctrl">
                  <button type="button" onClick={() => set("quantity", Math.max(1, Number(form.quantity) - 1 || 1))}>
                    −
                  </button>
                  <input type="number" min="1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
                  <button type="button" onClick={() => set("quantity", Math.max(1, Number(form.quantity) || 0) + 1)}>
                    +
                  </button>
                </div>
              </div>
            ) : null}
            <div className="field-grp">
              <label className="f-lbl">{t(lang, "minQty")}</label>
              <input
                className="f-inp"
                type="number"
                min="0"
                value={form.minQuantity}
                onChange={(e) => set("minQuantity", e.target.value)}
              />
            </div>
            <div className="field-grp">
              <label className="f-lbl">{t(lang, "sellingPrice")}</label>
              <div className="pr-wrap">
                <span className="pr-pfx">₹</span>
                <input
                  className="f-inp pr-inp"
                  type="number"
                  min="0"
                  value={form.sellingPrice}
                  onChange={(e) => set("sellingPrice", e.target.value)}
                />
              </div>
            </div>
          </div>

          <button type="button" className="more-toggle" onClick={() => setMoreOpen((v) => !v)}>
            {moreOpen ? t(lang, "hideMore") : t(lang, "showMore")}
          </button>

          {moreOpen ? (
            <div className="more-panel">
              <div className="two-col">
                <div className="field-grp">
                  <label className="f-lbl">{t(lang, "localName")}</label>
                  <input className="f-inp" value={form.localName} onChange={(e) => set("localName", e.target.value)} />
                </div>
                <div className="field-grp">
                  <label className="f-lbl">{t(lang, "spec")}</label>
                  <input className="f-inp" value={form.specification} onChange={(e) => set("specification", e.target.value)} />
                </div>
              </div>
              <div className="two-col">
                <div className="field-grp">
                  <label className="f-lbl">{t(lang, "brandField")}</label>
                  <input className="f-inp" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
                </div>
                <div className="field-grp">
                  <label className="f-lbl">{t(lang, "model")}</label>
                  <input className="f-inp" value={form.model} onChange={(e) => set("model", e.target.value)} />
                </div>
              </div>
              <div className="field-grp">
                <label className="f-lbl">{t(lang, "costPrice")}</label>
                <div className="pr-wrap">
                  <span className="pr-pfx">₹</span>
                  <input
                    className="f-inp pr-inp"
                    type="number"
                    min="0"
                    value={form.costPrice}
                    onChange={(e) => set("costPrice", e.target.value)}
                  />
                </div>
              </div>
              <div className="field-grp">
                <label className="f-lbl">{t(lang, "description")}</label>
                <textarea className="f-inp" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div className="field-grp" style={{ marginBottom: 0 }}>
                <label className="f-lbl">{t(lang, "photo")}</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  hidden
                  onChange={(e) => onFiles(e.target.files)}
                />
                <button
                  type="button"
                  className="photo-zone photo-zone-sm"
                  disabled={uploading || form.images.length >= 3}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? t(lang, "uploading") : t(lang, "photoClick")}
                </button>
                {form.images.length ? (
                  <div className="thumbs">
                    {form.images.map((url) => (
                      <div className="thumb" key={url}>
                        <img src={url} alt="" />
                        <button
                          type="button"
                          className="thumb-x"
                          onClick={() => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {error ? <div className="err">{error}</div> : null}
        <div className="add-actions">
          <button className="btn btn-p" disabled={busy || uploading} onClick={() => save(false)}>
            {busy ? t(lang, "saving") : t(lang, "saveCatalog")}
          </button>
          {!editing ? (
            <button className="btn btn-s" disabled={busy || uploading} onClick={() => save(true)}>
              {t(lang, "saveAnother")}
            </button>
          ) : (
            <button className="btn btn-d" disabled={busy} onClick={remove}>
              {t(lang, "delete")}
            </button>
          )}
          <button className="btn btn-g" onClick={() => nav("/inventory")}>
            {t(lang, "cancel")}
          </button>
        </div>

        {editing && history.length ? (
          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-hd">
              <div className="card-ttl">{t(lang, "history")}</div>
            </div>
            {history.map((h) => (
              <div className="list-row" key={h.id}>
                <div style={{ flex: 1 }}>
                  <strong>{h.changeType}</strong>
                  <div className="pspec">
                    {h.qtyBefore} → {h.qtyAfter} ({h.qtyChange > 0 ? "+" : ""}
                    {h.qtyChange}) {h.note ? `· ${h.note}` : ""}
                  </div>
                </div>
                <span className="time">{formatWhen(h.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
