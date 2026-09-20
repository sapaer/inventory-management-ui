import { t, vehicleLabel } from "../i18n";
import { formatPrice, formatWhen } from "../utils";
import "../pages/Activity.css";

const TYPE_KEY = {
  ADD: "actAdded",
  SOLD: "actSold",
  RECEIVED: "actReceived",
  ADJUSTMENT: "actAdjusted",
  RETURNED: "actReturned",
  EDIT: "actEdited",
};

// What an EDIT event says for each field the backend tracks.
const EDIT_TITLE = {
  partName: "editName",
  vehicleCategory: "editVehicle",
  brand: "editBrand",
  sellingPrice: "editPrice",
  minQuantity: "editLevel",
  localName: "editAlias",
  specification: "editSize",
  description: "editNotes",
  images: "editPhotos",
  compatibleVehicles: "editFits",
};

const NONE = "—";
const plain = (v) => (v == null || v === "" ? NONE : String(v));

function editValue(field, v) {
  if (field === "sellingPrice") return v == null || v === "" ? NONE : formatPrice(v);
  if (field === "vehicleCategory") return v ? vehicleLabel(v) : NONE;
  return plain(v);
}

/** { title, detail } for a history entry — a stock change or an edit to the part's details. */
export function describeEvent(e, lang) {
  if (e.changeType !== "EDIT") {
    return {
      title: t(lang, TYPE_KEY[e.changeType] || "actAdjusted"),
      detail: `${e.qtyBefore} → ${e.qtyAfter}${e.note ? ` · ${e.note}` : ""}`,
    };
  }
  const title = t(lang, EDIT_TITLE[e.field] || "actEdited");
  if (e.field === "description") return { title, detail: "" };
  if (e.field === "images") return { title, detail: t(lang, "editCount", "photo", e.oldValue, e.newValue) };
  if (e.field === "compatibleVehicles") return { title, detail: t(lang, "editCount", "vehicle", e.oldValue, e.newValue) };
  return { title, detail: `${editValue(e.field, e.oldValue)} → ${editValue(e.field, e.newValue)}` };
}

export function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

/**
 * One line of history. `onPart` makes the part name a link (hidden when the
 * list is already about one part); `showDate` adds the day above the time, for
 * lists that aren't grouped by day.
 */
export default function ActivityRow({ e, lang, onPart, showDate = false }) {
  const isEdit = e.changeType === "EDIT";
  const change = e.qtyChange;
  const { title, detail } = describeEvent(e, lang);
  return (
    <div className="act-row">
      <span className={`act-ic is-${e.changeType.toLowerCase()}`} aria-hidden="true">
        <TypeIcon type={e.changeType} />
      </span>
      <div className="act-main">
        <div className="act-line">
          <strong>{title}</strong>
          {onPart ? (
            <button type="button" className="act-part-link" onClick={onPart} title={t(lang, "actShowPart")}>
              {e.partName}
            </button>
          ) : null}
        </div>
        {detail ? <div className="act-detail">{detail}</div> : null}
      </div>
      <div className="act-side">
        {isEdit || !change ? null : (
          <span className={`act-delta ${change > 0 ? "is-up" : "is-down"}`}>
            {change > 0 ? `+${change}` : `−${Math.abs(change)}`}
          </span>
        )}
        {showDate ? <span className="act-time">{formatWhen(e.createdAt)}</span> : null}
        <span className="act-time">{formatTime(e.createdAt)}</span>
      </div>
    </div>
  );
}

function TypeIcon({ type }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "ADD")
    return (
      <svg {...p}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  if (type === "SOLD")
    return (
      <svg {...p}>
        <path d="M12 5v14M6 13l6 6 6-6" />
      </svg>
    );
  if (type === "RECEIVED")
    return (
      <svg {...p}>
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    );
  if (type === "RETURNED")
    return (
      <svg {...p}>
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
      </svg>
    );
  if (type === "EDIT")
    return (
      <svg {...p}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}
