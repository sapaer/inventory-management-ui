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
      })
      .catch((e) => setError(formatApiError(e)));
    inventoryApi
      .history(id, 1, 20)
      .then((data) => setHistory(Array.isArray(data?.content) ? data.content : []))
      .catch(() => setHistory([]));
  }, [editing, id]);

  function set(key, value) {
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
    if (!editing) body.quantity = Number(form.quantity) || 0;
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
        <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>
          <button className="link muted" onClick={() => nav("/inventory")}>
            ← {t(lang, "inventory")}
          </button>
          {" / "}
          {editing ? t(lang, "edit") : t(lang, "addPart")}
        </div>
        <div className="add-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
            <div className="add-title">{t(lang, "partDetails")}</div>
            <span className="plan-pill" style={{ color: "#1a5c46", background: "#e6f7f1" }}>
              {t(lang, "freePlan")}
            </span>
          </div>

          <div className="field-grp">
            <div className="f-lbl">
              {t(lang, "partName")} <span className="req">*</span>
            </div>
            <input className="f-inp" value={form.partName} onChange={(e) => set("partName", e.target.value)} placeholder="Maruti Swift Brake Pad Set" />
            <div className="hint">{t(lang, "beSpecific")}</div>
          </div>

          <div className="two-col">
            <div className="field-grp">
              <div className="f-lbl">
                {t(lang, "localName")} <span className="hint">({t(lang, "optional")})</span>
              </div>
              <input className="f-inp" value={form.localName} onChange={(e) => set("localName", e.target.value)} />
            </div>
            <div className="field-grp">
              <div className="f-lbl">
                {t(lang, "spec")} <span className="hint">({t(lang, "optional")})</span>
              </div>
              <input className="f-inp" value={form.specification} onChange={(e) => set("specification", e.target.value)} />
            </div>
          </div>

          <div className="field-grp">
            <div className="f-lbl">
              {t(lang, "vehicle")} <span className="req">*</span>
            </div>
            <div className="veh-pills">
              {VEHICLES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`vp${form.vehicleCategory === v.id ? " on" : ""}`}
                  onClick={() => set("vehicleCategory", v.id)}
                >
                  {lang === "hi" ? v.hi : v.en}
                </button>
              ))}
            </div>
          </div>

          <div className="two-col">
            <div className="field-grp">
              <div className="f-lbl">{t(lang, "brandField")}</div>
              <input className="f-inp" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div className="field-grp">
              <div className="f-lbl">{t(lang, "model")}</div>
              <input className="f-inp" value={form.model} onChange={(e) => set("model", e.target.value)} />
            </div>
          </div>

          <div className="two-col">
            {!editing ? (
              <div className="field-grp">
                <div className="f-lbl">
                  {t(lang, "quantity")} <span className="req">*</span>
                </div>
                <div className="qty-ctrl">
                  <button type="button" onClick={() => set("quantity", Math.max(0, Number(form.quantity) - 1))}>
                    −
                  </button>
                  <input type="number" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
                  <button type="button" onClick={() => set("quantity", Number(form.quantity) + 1)}>
                    +
                  </button>
                </div>
              </div>
            ) : null}
            <div className="field-grp">
              <div className="f-lbl">{t(lang, "minQty")}</div>
              <input className="f-inp" type="number" min="0" value={form.minQuantity} onChange={(e) => set("minQuantity", e.target.value)} />
            </div>
            <div className="field-grp">
              <div className="f-lbl">{t(lang, "sellingPrice")}</div>
              <div className="pr-wrap">
                <span className="pr-pfx">₹</span>
                <input className="f-inp pr-inp" type="number" min="0" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} />
              </div>
            </div>
            <div className="field-grp">
              <div className="f-lbl">{t(lang, "costPrice")}</div>
              <div className="pr-wrap">
                <span className="pr-pfx">₹</span>
                <input className="f-inp pr-inp" type="number" min="0" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
              </div>
              <div className="hint">{t(lang, "costPrivate")}</div>
            </div>
          </div>

          <div className="field-grp">
            <div className="f-lbl">{t(lang, "description")}</div>
            <textarea className="f-inp" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="field-grp" style={{ marginBottom: 0 }}>
            <div className="f-lbl">
              {t(lang, "photo")} <span className="hint">({t(lang, "optional")})</span>
            </div>
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
              className="photo-zone"
              disabled={uploading || form.images.length >= 3}
              onClick={() => fileRef.current?.click()}
            >
              <div className="pz-title">{uploading ? t(lang, "uploading") : t(lang, "photoClick")}</div>
              <div className="pz-sub">{t(lang, "photoHint")}</div>
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
