import { useEffect, useState } from "react";
import { formatApiError, inventoryApi } from "../api";
import { t, vehicleLabel } from "../i18n";
import { formatDate, formatPrice, stockOf } from "../utils";
import StatusBadge from "./StatusBadge";
import "./ViewPartModal.css";

/** Full read-only view of a part: photos, price, stock level and every detail we hold. */
export default function ViewPartModal({ item, lang, onClose, onEdit, onHistory }) {
  const [detail, setDetail] = useState(item);
  const [error, setError] = useState("");
  const [shot, setShot] = useState(0);

  useEffect(() => {
    let alive = true;
    inventoryApi
      .get(item.id)
      .then((full) => {
        if (alive && full) setDetail(full);
      })
      .catch((e) => {
        if (alive) setError(formatApiError(e));
      });
    return () => {
      alive = false;
    };
  }, [item.id]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const status = stockOf(detail);
  const qty = Number(detail.quantity) || 0;
  const min = Number(detail.minQuantity) || 0;
  const images = Array.isArray(detail.images) ? detail.images.filter(Boolean) : [];
  const compat = Array.isArray(detail.compatibleVehicles) ? detail.compatibleVehicles : [];
  const hasPrice = detail.sellingPrice !== null && detail.sellingPrice !== undefined && detail.sellingPrice !== "";
  // Meter runs from 0 to twice the alert level (or the current stock if higher),
  // with a tick where "low" begins so the level reads at a glance.
  const scale = Math.max(min * 2, qty, 1);
  const fill = Math.min(100, (qty / scale) * 100);
  const tick = Math.min(100, (min / scale) * 100);
  const subtitle = [detail.brand, detail.model].filter(Boolean).join(" · ");

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal vp" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="vp-title">
        <header className="vp-top">
          <h3 id="vp-title">{t(lang, "partDetails")}</h3>
          <button type="button" className="vp-x" aria-label={t(lang, "close")} onClick={onClose}>
            ×
          </button>
        </header>

        <div className="vp-body">
          <div className="vp-hero">
            <div className="vp-gallery">
              <div className="vp-photo">
                {images.length ? <img src={images[shot] || images[0]} alt={detail.partName} /> : <NoPhoto lang={lang} />}
              </div>
              {images.length > 1 ? (
                <div className="vp-thumbs">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      className={i === shot ? "on" : ""}
                      aria-label={`${detail.partName} ${i + 1}`}
                      onClick={() => setShot(i)}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="vp-main">
              <div className="vp-badges">
                {detail.vehicleCategory ? <span className="badge b-veh">{vehicleLabel(detail.vehicleCategory)}</span> : null}
                <StatusBadge status={status} lang={lang} />
              </div>
              <h2 className="vp-name">{detail.partName}</h2>
              {subtitle ? <p className="vp-sub">{subtitle}</p> : null}
              {detail.partNumber ? (
                <p className="vp-pn">
                  {t(lang, "partNumber")}: <strong>{detail.partNumber}</strong>
                </p>
              ) : null}

              <div className="vp-price">
                {hasPrice ? (
                  <>
                    <strong>{formatPrice(detail.sellingPrice)}</strong>
                    <span>{t(lang, "vpSellingPrice")}</span>
                  </>
                ) : (
                  <span className="vp-price-none">{t(lang, "vpNoPrice")}</span>
                )}
              </div>

              <div className={`vp-stock is-${status.toLowerCase()}`}>
                <div className="vp-stock-top">
                  <span className="vp-stock-num">{qty}</span>
                  <span className="vp-stock-lbl">{t(lang, "vpInStock")}</span>
                </div>
                <div className="vp-meter" aria-hidden="true">
                  <span className="vp-meter-fill" style={{ width: `${fill}%` }} />
                  <span className="vp-meter-tick" style={{ left: `${tick}%` }} />
                </div>
                <div className="vp-stock-foot">{t(lang, "vpAlertAt", min)}</div>
              </div>
            </div>
          </div>

          <section className="vp-sec">
            <h4>{t(lang, "vpDetails")}</h4>
            <div className="vp-grid">
              <Fact label={t(lang, "brandField")} value={detail.brand} />
              <Fact label={t(lang, "model")} value={detail.model} />
              <Fact label={t(lang, "partNumber")} value={detail.partNumber} />
              <Fact label={t(lang, "vehicle")} value={detail.vehicleCategory ? vehicleLabel(detail.vehicleCategory) : ""} />
              {detail.localName ? <Fact label={t(lang, "localName")} value={detail.localName} /> : null}
              {detail.specification ? <Fact label={t(lang, "spec")} value={detail.specification} /> : null}
              <Fact label={t(lang, "vpAdded")} value={detail.createdAt ? formatDate(detail.createdAt) : ""} />
              <Fact label={t(lang, "updated")} value={detail.updatedAt ? formatDate(detail.updatedAt) : ""} />
            </div>
          </section>

          {compat.length ? (
            <section className="vp-sec">
              <h4>{t(lang, "compatibleVehicles")}</h4>
              <div className="compat-chips" role="list">
                {compat.map((v, i) => (
                  <span className="compat-chip" role="listitem" key={`${v.make}-${v.model}-${i}`}>
                    <span className="compat-chip-text">{[v.make, v.model].filter(Boolean).join(" ")}</span>
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {detail.description ? (
            <section className="vp-sec">
              <h4>{t(lang, "description")}</h4>
              <p className="vp-desc">{detail.description}</p>
            </section>
          ) : null}

          {error ? <div className="err">{error}</div> : null}
        </div>

        <footer className="vp-foot">
          <button type="button" className="btn btn-g vp-foot-close" onClick={onClose}>
            {t(lang, "close")}
          </button>
          <button type="button" className="btn btn-s" onClick={onHistory}>
            {t(lang, "vpHistory")}
          </button>
          <button type="button" className="btn btn-p" onClick={onEdit}>
            {t(lang, "vpEditPart")}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Fact({ label, value }) {
  const empty = value === "" || value === null || value === undefined;
  return (
    <div className={`vp-fact${empty ? " is-empty" : ""}`}>
      <span className="vp-fact-lbl">{label}</span>
      <span className={`vp-fact-val${empty ? " is-empty" : ""}`}>{empty ? "—" : value}</span>
    </div>
  );
}

function NoPhoto({ lang }) {
  return (
    <div className="vp-nophoto">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
      </svg>
      <span>{t(lang, "vpNoPhoto")}</span>
    </div>
  );
}
