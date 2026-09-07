import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { formatApiError, inventoryApi, uploadApi } from "../api";
import FormField from "../components/FormField";
import FormPanel from "../components/FormPanel";
import MoneyInput from "../components/MoneyInput";
import PhotoUploader from "../components/PhotoUploader";
import QtyStepper from "../components/QtyStepper";
import VehicleChips from "../components/VehicleChips";
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
          item.localName || item.specification || item.brand || item.model || item.description;
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
    }
  }

  async function save(addAnother) {
    if (!form.partName.trim()) {
      setError(`${t(lang, "partName")} ${t(lang, "required")}`);
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
    <div className="content part-form-page">
      <div className="part-form">
        <header className="part-form-top">
          <button type="button" className="part-form-back" onClick={() => nav("/inventory")} aria-label={t(lang, "inventory")}>
            ←
          </button>
          <div>
            <h1 className="part-form-title">{editing ? t(lang, "edit") : t(lang, "addPart")}</h1>
            <p className="part-form-sub part-form-sub-desktop">{t(lang, "addPartSub")}</p>
          </div>
        </header>

        <div className="part-form-grid">
          <FormPanel title={t(lang, "basicInfo")} className="part-form-basics">
            <FormField label={t(lang, "partName")} required>
              <input
                className="f-inp"
                value={form.partName}
                onChange={(e) => set("partName", e.target.value)}
                placeholder="Maruti Swift Brake Pad Set"
              />
            </FormField>

            <FormField label={t(lang, "vehicle")} required>
              <VehicleChips
                options={VEHICLES}
                value={form.vehicleCategory}
                onChange={(id) => set("vehicleCategory", id)}
              />
            </FormField>

            <div className="part-form-row">
              {!editing ? (
                <FormField label={t(lang, "quantity")} required>
                  <QtyStepper value={form.quantity} min={1} onChange={(v) => set("quantity", v)} />
                </FormField>
              ) : null}
              <FormField label={t(lang, "sellingPrice")}>
                <MoneyInput value={form.sellingPrice} onChange={(v) => set("sellingPrice", v)} />
              </FormField>
            </div>
          </FormPanel>

          <FormPanel title={t(lang, "addPhotos")} optional className="part-form-photos">
            <PhotoUploader
              images={form.images}
              uploading={uploading}
              onAddFiles={onFiles}
              onRemove={(url) => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }))}
              chooseLabel={t(lang, "chooseFiles")}
              emptyTitle={t(lang, "photoClick")}
              emptyHint={t(lang, "photoHint")}
              uploadingLabel={t(lang, "uploading")}
            />
          </FormPanel>
        </div>

        <FormPanel className="part-form-more">
          <button type="button" className="more-toggle" onClick={() => setMoreOpen((v) => !v)}>
            {moreOpen ? t(lang, "hideMore") : t(lang, "showMore")}
          </button>

          {moreOpen ? (
            <div className="more-panel">
              <div className="part-form-row">
                <FormField label={t(lang, "brandField")}>
                  <input className="f-inp" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
                </FormField>
                <FormField label={t(lang, "model")}>
                  <input className="f-inp" value={form.model} onChange={(e) => set("model", e.target.value)} />
                </FormField>
              </div>
              <div className="part-form-row">
                <FormField label={t(lang, "localName")}>
                  <input className="f-inp" value={form.localName} onChange={(e) => set("localName", e.target.value)} />
                </FormField>
                <FormField label={t(lang, "spec")}>
                  <input
                    className="f-inp"
                    value={form.specification}
                    onChange={(e) => set("specification", e.target.value)}
                  />
                </FormField>
              </div>
              <div className="part-form-row">
                <FormField label={t(lang, "minQty")}>
                  <input
                    className="f-inp"
                    type="number"
                    min="0"
                    value={form.minQuantity}
                    onChange={(e) => set("minQuantity", e.target.value)}
                  />
                </FormField>
                <FormField label={t(lang, "costPrice")}>
                  <MoneyInput value={form.costPrice} onChange={(v) => set("costPrice", v)} />
                </FormField>
              </div>
              <FormField label={t(lang, "description")}>
                <textarea
                  className="f-inp"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </FormField>
            </div>
          ) : null}
        </FormPanel>

        {error ? <div className="err part-form-err">{error}</div> : null}

        {editing && history.length ? (
          <FormPanel title={t(lang, "history")} className="part-form-history">
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
          </FormPanel>
        ) : null}

        <div className="part-form-actions">
          <button type="button" className="btn btn-g part-form-cancel" onClick={() => nav("/inventory")}>
            {t(lang, "cancel")}
          </button>
          {!editing ? (
            <button type="button" className="btn btn-s part-form-another" disabled={busy || uploading} onClick={() => save(true)}>
              {t(lang, "saveAnother")}
            </button>
          ) : (
            <button type="button" className="btn btn-d part-form-delete" disabled={busy} onClick={remove}>
              {t(lang, "delete")}
            </button>
          )}
          <button
            type="button"
            className="btn btn-p part-form-save"
            disabled={busy || uploading}
            onClick={() => save(false)}
          >
            {busy ? t(lang, "saving") : t(lang, "savePart")}
          </button>
        </div>
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
