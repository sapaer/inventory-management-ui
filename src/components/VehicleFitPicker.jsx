import { useMemo, useState } from "react";
import { makesFor } from "../data/vehicleCatalog";
import Dropdown from "./Dropdown";
import VehicleChips from "./VehicleChips";

const OTHER = "__other__";
const MAX = 50;

const same = (a, b) => a.make === b.make && a.model === b.model;

/**
 * One picker for "which vehicle is this part for": the vehicle type first, then
 * (optionally) the exact makes and models from a ready-made list. Picks are
 * stored as [{ make, model }] — model "" means every model of that make.
 */
export default function VehicleFitPicker({
  options,
  category,
  onCategory,
  value = [],
  onChange,
  labels,
}) {
  const [make, setMake] = useState("");
  const [otherMake, setOtherMake] = useState("");
  const [otherModel, setOtherModel] = useState("");

  const makes = useMemo(() => makesFor(category), [category]);
  const current = makes.find((m) => m.make === make);
  const has = (fit) => value.some((v) => same(v, fit));

  function toggle(fit) {
    if (has(fit)) onChange(value.filter((v) => !same(v, fit)));
    else if (value.length < MAX) onChange([...value, fit]);
  }

  function addOther() {
    const fit = { make: otherMake.trim(), model: otherModel.trim() };
    if (!fit.make && !fit.model) return;
    if (!has(fit) && value.length < MAX) onChange([...value, fit]);
    setOtherMake("");
    setOtherModel("");
  }

  return (
    <div className="fit-picker">
      <VehicleChips options={options} value={category} onChange={(id) => { onCategory(id); setMake(""); }} />

      {value.length ? (
        <div className="fit-chosen" role="list" aria-label={labels.chosen}>
          {value.map((v, i) => (
            <span className="compat-chip" role="listitem" key={`${v.make}-${v.model}-${i}`}>
              <span className="compat-chip-text">{[v.make, v.model || labels.all].filter(Boolean).join(" ")}</span>
              <button
                type="button"
                className="compat-chip-x"
                aria-label={labels.remove}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="fit-step">
        <div className="fit-step-lbl">{labels.makeLabel}</div>
        <Dropdown
          value={make}
          onChange={setMake}
          placeholder={labels.chooseMake}
          ariaLabel={labels.makeLabel}
          options={[
            ...makes.map((m) => ({ value: m.make, label: m.make })),
            { value: OTHER, label: labels.other, separated: true },
          ]}
        />
      </div>

      {current ? (
        <div className="fit-step">
          <div className="fit-step-lbl">{labels.modelsOf(current.make)}</div>
          <div className="fit-models">
            <button
              type="button"
              className={`fit-model${has({ make: current.make, model: "" }) ? " on" : ""}`}
              aria-pressed={has({ make: current.make, model: "" })}
              onClick={() => toggle({ make: current.make, model: "" })}
            >
              {labels.allOf(current.make)}
            </button>
            {current.models.map((model) => {
              const fit = { make: current.make, model };
              return (
                <button
                  key={model}
                  type="button"
                  className={`fit-model${has(fit) ? " on" : ""}`}
                  aria-pressed={has(fit)}
                  onClick={() => toggle(fit)}
                >
                  {model}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {make === OTHER ? (
        <div className="fit-other">
          <input
            className="f-inp"
            value={otherMake}
            onChange={(e) => setOtherMake(e.target.value)}
            placeholder={labels.makePh}
            aria-label={labels.makePh}
          />
          <input
            className="f-inp"
            value={otherModel}
            onChange={(e) => setOtherModel(e.target.value)}
            placeholder={labels.modelPh}
            aria-label={labels.modelPh}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOther();
              }
            }}
          />
          <button type="button" className="btn btn-s" disabled={!otherMake.trim() && !otherModel.trim()} onClick={addOther}>
            {labels.add}
          </button>
        </div>
      ) : null}
    </div>
  );
}
