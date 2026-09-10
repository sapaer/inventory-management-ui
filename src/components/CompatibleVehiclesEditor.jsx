import { useState } from "react";

/**
 * Editable list of { make, model } vehicle fitments.
 */
export default function CompatibleVehiclesEditor({
  value = [],
  onChange,
  disabled = false,
  makeLabel = "Make",
  modelLabel = "Model",
  addLabel = "Add",
  emptyHint = "Add vehicles this part fits",
  makePlaceholder = "Maruti Suzuki",
  modelPlaceholder = "Swift",
}) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  function add() {
    const m = make.trim();
    const mo = model.trim();
    if (!m && !mo) return;
    onChange([...(value || []), { make: m, model: mo }]);
    setMake("");
    setModel("");
  }

  function remove(index) {
    onChange((value || []).filter((_, i) => i !== index));
  }

  return (
    <div className={`compat-editor${disabled ? " is-readonly" : ""}`}>
      {(value || []).length ? (
        <div className="compat-chips" role="list">
          {value.map((v, i) => (
            <span className="compat-chip" role="listitem" key={`${v.make}-${v.model}-${i}`}>
              <span className="compat-chip-text">
                {[v.make, v.model].filter(Boolean).join(" ")}
              </span>
              {!disabled ? (
                <button type="button" className="compat-chip-x" aria-label="Remove" onClick={() => remove(i)}>
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : (
        <p className="compat-empty">{emptyHint}</p>
      )}

      {!disabled ? (
        <div className="compat-add-row">
          <input
            className="f-inp"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder={makePlaceholder}
            aria-label={makeLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <input
            className="f-inp"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={modelPlaceholder}
            aria-label={modelLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className="btn btn-s compat-add-btn" onClick={add} disabled={!make.trim() && !model.trim()}>
            {addLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
