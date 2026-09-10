import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { formatApiError, inventoryApi, uploadApi } from "../api";
import CompatibleVehiclesEditor from "../components/CompatibleVehiclesEditor";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
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
  partNumber: "",
  compatibleVehicles: [],
  quantity: 1,
  minQuantity: 2,
  sellingPrice: "",
  costPrice: "",
  images: [],
};

function normalizeCompat(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((v) => ({
      make: String(v?.make || "").trim(),
      model: String(v?.model || "").trim(),
    }))
    .filter((v) => v.make || v.model);
}

export default function PartForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { lang } = useLang();
  const nav = useNavigate();
  const loc = useLocation();
  const viewOnly = Boolean(loc.state?.viewOnly);
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
  const [moreOpen, setMoreOpen] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
          partNumber: item.partNumber || "",
          compatibleVehicles: normalizeCompat(item.compatibleVehicles),
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
      partNumber: form.partNumber.trim(),
      compatibleVehicles: normalizeCompat(form.compatibleVehicles),
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
        setMoreOpen(true);
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
    setBusy(true);
    try {
      await inventoryApi.remove(id);
      nav("/inventory");
    } catch (e) {
      setError(formatApiError(e));
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className={`content part-form-page${viewOnly ? " is-view" : ""}`}>
      <div className="part-form">
        <header className="part-form-top">
          <button type="button" className="part-form-back" onClick={() => nav("/inventory")} aria-label={t(lang, "inventory")}>
            ←
          </button>
          <div>
            <h1 className="part-form-title">
              {viewOnly ? t(lang, "view") : editing ? t(lang, "edit") : t(lang, "addPart")}
            </h1>
            <p className="part-form-sub part-form-sub-desktop">{t(lang, "addPartSub")}</p>
          </div>
        </header>

        <div className={`part-form-grid${viewOnly ? " is-readonly" : ""}`}>
          <FormPanel title={t(lang, "basicInfo")} className="part-form-basics">
            <FormField label={t(lang, "partName")} required>
              <input
                className="f-inp"
                value={form.partName}
                disabled={viewOnly}
                onChange={(e) => set("partName", e.target.value)}
                placeholder="Maruti Swift Brake Pad Set"
              />
            </FormField>

            <FormField label={t(lang, "vehicle")} required>
              <VehicleChips
                options={VEHICLES}
                value={form.vehicleCategory}
                disabled={viewOnly}
                onChange={(id) => set("vehicleCategory", id)}
              />
            </FormField>

            <div className="part-form-row part-form-row-3">
              {!editing ? (
                <FormField label={t(lang, "quantity")} required>
                  <QtyStepper value={form.quantity} min={1} disabled={viewOnly} onChange={(v) => set("quantity", v)} />
                </FormField>
              ) : null}
              <FormField label={t(lang, "minQty")} tooltip={t(lang, "minQtyHint")}>
                <QtyStepper value={form.minQuantity} min={0} disabled={viewOnly} onChange={(v) => set("minQuantity", v)} />
              </FormField>
              <FormField label={t(lang, "sellingPrice")}>
                <MoneyInput value={form.sellingPrice} disabled={viewOnly} onChange={(v) => set("sellingPrice", v)} />
              </FormField>
            </div>
          </FormPanel>

          <FormPanel title={t(lang, "addPhotos")} optional className="part-form-photos">
            <PhotoUploader
              images={form.images}
              uploading={uploading}
              disabled={viewOnly}
              onAddFiles={viewOnly ? undefined : onFiles}
              onRemove={viewOnly ? undefined : (url) => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }))}
              chooseLabel={t(lang, "chooseFiles")}
              emptyTitle={t(lang, "photoClick")}
              emptyHint={t(lang, "photoHint")}
              uploadingLabel={t(lang, "uploading")}
            />
          </FormPanel>
        </div>

        <FormPanel className="part-form-more">
          <button
            type="button"
            className={`more-toggle${moreOpen ? " is-open" : ""}`}
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
          >
            <span className="more-toggle-label">{moreOpen ? t(lang, "hideMore") : t(lang, "showMore")}</span>
            <span className="more-toggle-arrow" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>

          {moreOpen ? (
            <div className="more-panel">
              <FormField label={t(lang, "partNumber")}>
                <input
                  className="f-inp"
                  value={form.partNumber}
                  disabled={viewOnly}
                  onChange={(e) => set("partNumber", e.target.value)}
                  placeholder={t(lang, "partNumberPlaceholder")}
                />
              </FormField>

              <FormField label={t(lang, "compatibleVehicles")}>
                <CompatibleVehiclesEditor
                  value={form.compatibleVehicles}
                  disabled={viewOnly}
                  onChange={(next) => set("compatibleVehicles", next)}
                  makeLabel={t(lang, "vehicleMake")}
                  modelLabel={t(lang, "vehicleModel")}
                  addLabel={t(lang, "addVehicle")}
                  emptyHint={t(lang, "compatibleVehiclesHint")}
                  makePlaceholder={t(lang, "vehicleMakePlaceholder")}
                  modelPlaceholder={t(lang, "vehicleModelPlaceholder")}
                />
              </FormField>

              <div className="part-form-row">
                <FormField label={t(lang, "brandField")}>
                  <input className="f-inp" value={form.brand} disabled={viewOnly} onChange={(e) => set("brand", e.target.value)} />
                </FormField>
                <FormField label={t(lang, "model")}>
                  <input className="f-inp" value={form.model} disabled={viewOnly} onChange={(e) => set("model", e.target.value)} />
                </FormField>
              </div>
              <div className="part-form-row">
                <FormField label={t(lang, "localName")}>
                  <input className="f-inp" value={form.localName} disabled={viewOnly} onChange={(e) => set("localName", e.target.value)} />
                </FormField>
                <FormField label={t(lang, "spec")}>
                  <input
                    className="f-inp"
                    value={form.specification}
                    disabled={viewOnly}
                    onChange={(e) => set("specification", e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label={t(lang, "costPrice")}>
                <MoneyInput value={form.costPrice} disabled={viewOnly} onChange={(v) => set("costPrice", v)} />
              </FormField>
              <FormField label={t(lang, "description")}>
                <textarea
                  className="f-inp"
                  rows={3}
                  value={form.description}
                  disabled={viewOnly}
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
          {viewOnly ? (
            <button type="button" className="btn btn-p part-form-save" onClick={() => nav("/inventory")}>
              {t(lang, "back")}
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-g part-form-cancel" onClick={() => nav("/inventory")}>
                {t(lang, "cancel")}
              </button>
              {!editing ? (
                <button type="button" className="btn btn-s part-form-another" disabled={busy || uploading} onClick={() => save(true)}>
                  {t(lang, "saveAnother")}
                </button>
              ) : (
                <button type="button" className="btn btn-d part-form-delete" disabled={busy} onClick={() => setConfirmDelete(true)}>
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
            </>
          )}
        </div>
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
      {confirmDelete ? (
        <ConfirmDeleteModal
          title={t(lang, "confirmDeleteTitle")}
          message={t(lang, "confirmDelete")}
          itemName={form.partName}
          cancelLabel={t(lang, "cancel")}
          deleteLabel={busy ? t(lang, "deleting") : t(lang, "delete")}
          busy={busy}
          onCancel={() => {
            if (!busy) setConfirmDelete(false);
          }}
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}
