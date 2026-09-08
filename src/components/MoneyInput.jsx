/** Format a numeric value with Indian grouping (57888 → 57,888). */
export function formatInrDigits(value) {
  if (value === "" || value == null) return "";
  const raw = String(value).replace(/[^\d]/g, "");
  if (!raw) return "";
  return Number(raw).toLocaleString("en-IN");
}

/** Strip formatting; keep digits only for form state. */
export function parseInrDigits(display) {
  return String(display ?? "").replace(/[^\d]/g, "");
}

export default function MoneyInput({ value, onChange, placeholder = "0", disabled = false }) {
  const display = formatInrDigits(value);

  return (
    <div className="money-input">
      <span className="money-pfx" aria-hidden="true">
        ₹
      </span>
      <input
        className="f-inp money-inp"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(parseInrDigits(e.target.value))}
      />
    </div>
  );
}
