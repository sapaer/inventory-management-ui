import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { formatApiError, inventoryApi, uploadApi } from "../api";
import ActivityRow from "../components/ActivityRow";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import FormField from "../components/FormField";
import FormPanel from "../components/FormPanel";
import MoneyInput from "../components/MoneyInput";
import PhotoUploader from "../components/PhotoUploader";
import QtyStepper from "../components/QtyStepper";
import StatusBadge from "../components/StatusBadge";
import VehicleFitPicker from "../components/VehicleFitPicker";
import { useLang } from "../context/LangContext";
import { t, vehicleLabel, VEHICLES } from "../i18n";
import { stockOf } from "../utils";

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
  const [form, setForm] = useState(() => ({
    ...empty,
    partName: loc.state?.partName || "",
    vehicleCategory: loc.state?.vehicleCategory || "FOUR_WHEELER",
  }));
  const [original, setOriginal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [history, setHistory] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Most parts have just one name, so the "also called" box stays hidden
  // behind a link unless the part already has one.
  const [nameOpen, setNameOpen] = useState(false);

  // Save stays disabled until something's actually changed from what was
  // loaded — nothing to save otherwise.
  const dirty = editing ? original !== null && JSON.stringify(form) !== JSON.stringify(original) : true;

  useEffect(() => {
    if (!editing) return;
    inventoryApi
      .get(id)
      .then((item) => {
        const loaded = {
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
          images: item.images || [],
        };
        setForm(loaded);
        setOriginal(loaded);
        setNameOpen(Boolean(loaded.localName));
      })
      .catch((e) => setError(formatApiError(e)));
    inventoryApi
      .history(id, 1, 8)
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
        setNameOpen(false);
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

  const fitLabels = {
    chosen: t(lang, "fitsChosen"),
    remove: t(lang, "remove"),
    all: t(lang, "allModels"),
    makeLabel: t(lang, "vehicleMake"),
    chooseMake: t(lang, "chooseMake"),
    other: t(lang, "otherMake"),
    modelsOf: (make) => t(lang, "modelsOf", make),
    allOf: (make) => t(lang, "allOfMake", make),
    makePh: t(lang, "vehicleMake"),
    modelPh: t(lang, "vehicleModel"),
    add: t(lang, "addVehicle"),
  };

  return (
    <div className="content part-form-page">
      <div className="part-form">
        <header className="pf-head">
          {editing && original ? (
            <>
              {original.images[0] ? (
                <img className="inv-thumb pf-head-thumb" src={original.images[0]} alt="" />
              ) : (
                <span className="inv-thumb inv-thumb-ic pf-head-thumb" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
                  </svg>
                </span>
              )}
              <div className="pf-head-text">
                <span className="pf-kicker">{t(lang, "editPartTitle")}</span>
                <h1 className="pf-head-title">{original.partName}</h1>
                <div className="pf-head-meta">
                  <span>{[vehicleLabel(original.vehicleCategory), original.brand].filter(Boolean).join(" · ")}</span>
                  <StatusBadge status={stockOf(original)} lang={lang} />
                </div>
              </div>
            </>
          ) : (
            <div className="pf-head-text">
              <span className="pf-kicker">{editing ? t(lang, "editPartTitle") : t(lang, "newPart")}</span>
              <h1 className="pf-head-title">{editing ? "…" : t(lang, "addPartTitle")}</h1>
              {editing ? null : <div className="pf-head-meta">{t(lang, "addPartSub")}</div>}
            </div>
          )}
        </header>

        <div className="pf-cols">
          <div className="pf-col">
            <FormPanel title={t(lang, "partDetails")}>
              <FormField label={t(lang, "partName")} required>
                <input
                  className="f-inp"
                  value={form.partName}
                  onChange={(e) => set("partName", e.target.value)}
                  placeholder="Maruti Swift Brake Pad Set"
                />
              </FormField>
              {nameOpen ? (
                <FormField label={t(lang, "alsoCalled")} hint={t(lang, "alsoCalledHint")}>
                  <input
                    className="f-inp"
                    autoFocus={!form.localName}
                    value={form.localName}
                    onChange={(e) => set("localName", e.target.value)}
                  />
                </FormField>
              ) : (
                <button type="button" className="pf-link pf-addname" onClick={() => setNameOpen(true)}>
                  + {t(lang, "addAnotherName")}
                </button>
              )}
            </FormPanel>

            <FormPanel title={t(lang, "whichVehicle")}>
              <VehicleFitPicker
                options={VEHICLES}
                category={form.vehicleCategory}
                onCategory={(id) => set("vehicleCategory", id)}
                value={form.compatibleVehicles}
                onChange={(next) => set("compatibleVehicles", next)}
                labels={fitLabels}
              />
              <p className="form-field-hint pf-fit-hint">{t(lang, "fitsHint")}</p>
            </FormPanel>

            <FormPanel title={t(lang, "stockPrice")}>
              <div className="part-form-row part-form-row-3">
                {editing ? (
                  <FormField label={t(lang, "inStockNow")}>
                    <div className="pf-static">
                      <strong>{form.quantity}</strong>
                      <Link to="/stock-update" className="pf-link">
                        {t(lang, "updateStock")}
                      </Link>
                    </div>
                  </FormField>
                ) : (
                  <FormField label={t(lang, "quantity")} required>
                    <QtyStepper value={form.quantity} min={1} onChange={(v) => set("quantity", v)} />
                  </FormField>
                )}
                <FormField label={t(lang, "minQty")}>
                  <QtyStepper value={form.minQuantity} min={0} onChange={(v) => set("minQuantity", v)} />
                </FormField>
                <FormField label={t(lang, "sellingPrice")}>
                  <MoneyInput value={form.sellingPrice} onChange={(v) => set("sellingPrice", v)} />
                </FormField>
              </div>
              <p className="form-field-hint pf-level-hint">{t(lang, "minQtyHint")}</p>
            </FormPanel>
          </div>

          <div className="pf-col">
            <FormPanel title={t(lang, "photosTitle")} optional>
              <PhotoUploader
                images={form.images}
                uploading={uploading}
                onAddFiles={onFiles}
                onRemove={(url) => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }))}
                addLabel={t(lang, "addPhotoShort")}
                mainLabel={t(lang, "mainPhoto")}
                uploadingLabel={t(lang, "uploading")}
                hint={t(lang, "photoHint")}
              />
            </FormPanel>

            <FormPanel title={t(lang, "extraDetails")} optional>
              <div className="part-form-row">
                <FormField label={t(lang, "brandField")}>
                  <input
                    className="f-inp"
                    value={form.brand}
                    onChange={(e) => set("brand", e.target.value)}
                    placeholder={t(lang, "brandPlaceholder")}
                  />
                </FormField>
                <FormField label={t(lang, "partNumber")}>
                  <input
                    className="f-inp"
                    value={form.partNumber}
                    onChange={(e) => set("partNumber", e.target.value)}
                    placeholder={t(lang, "partNumberPlaceholder")}
                  />
                </FormField>
              </div>
              <FormField label={t(lang, "sizeType")}>
                <input
                  className="f-inp"
                  value={form.specification}
                  onChange={(e) => set("specification", e.target.value)}
                  placeholder={t(lang, "specPlaceholder")}
                />
              </FormField>
              <FormField label={t(lang, "notes")}>
                <textarea
                  className="f-inp"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </FormField>
            </FormPanel>
          </div>
        </div>

        {error ? <div className="err part-form-err">{error}</div> : null}

        {editing ? (
          <FormPanel className="part-form-history">
            <div className="pf-history-hd">
              <h2 className="form-panel-title">{t(lang, "changeHistory")}</h2>
              <Link className="pf-link" to={`/activity?part=${id}`}>
                {t(lang, "viewAll")} →
              </Link>
            </div>
            {history.length ? (
              <div className="pf-history">
                {history.map((h) => (
                  <ActivityRow key={h.id} e={h} lang={lang} showDate />
                ))}
              </div>
            ) : (
              <p className="pf-history-empty">{t(lang, "changeHistoryEmpty")}</p>
            )}
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
            <button type="button" className="btn btn-d part-form-delete" disabled={busy} onClick={() => setConfirmDelete(true)}>
              {t(lang, "delete")}
            </button>
          )}
          <button
            type="button"
            className="btn btn-p part-form-save"
            disabled={busy || uploading || !dirty}
            onClick={() => save(false)}
          >
            {busy ? t(lang, "saving") : t(lang, "savePart")}
          </button>
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
