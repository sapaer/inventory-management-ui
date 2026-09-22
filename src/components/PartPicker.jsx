import { useEffect, useRef, useState } from "react";
import SearchIcon from "./SearchIcon";
import "./PartPicker.css";

/**
 * Search-as-you-type part picker: a plain text box that drops down up to 8
 * name matches. Selecting one calls `onChange(id)` and clears the box —
 * showing the pick itself (a chip, a filled field, ...) is the caller's job,
 * since that looks different on every page that uses this.
 */
export default function PartPicker({ parts, onChange, placeholder, className = "" }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    function onDoc(ev) {
      if (box.current && !box.current.contains(ev.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = text.trim().toLowerCase();
  const matches = parts.filter((p) => !q || p.partName.toLowerCase().includes(q)).slice(0, 8);

  return (
    <div className={`pp${className ? ` ${className}` : ""}`} ref={box}>
      <span className="pp-ic" aria-hidden="true">
        <SearchIcon size={18} />
      </span>
      <input
        value={text}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(ev) => {
          setText(ev.target.value);
          setOpen(true);
        }}
      />
      {open && matches.length ? (
        <ul className="pp-list" role="listbox">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                onClick={() => {
                  setOpen(false);
                  setText("");
                  onChange(p.id);
                }}
              >
                {p.partName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
