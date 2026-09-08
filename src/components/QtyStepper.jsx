export default function QtyStepper({ value, onChange, min = 1, disabled = false }) {
  const n = Number(value);
  const current = Number.isFinite(n) ? n : min;

  function bump(delta) {
    if (disabled) return;
    onChange(Math.max(min, current + delta));
  }

  function onType(raw) {
    const digits = String(raw).replace(/[^\d]/g, "");
    if (digits === "") {
      onChange("");
      return;
    }
    onChange(Math.max(min, Number(digits)));
  }

  return (
    <div className={`qty-stepper${disabled ? " is-disabled" : ""}`}>
      <button type="button" aria-label="Decrease" disabled={disabled || current <= min} onClick={() => bump(-1)}>
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        disabled={disabled}
        onChange={(e) => onType(e.target.value)}
      />
      <button type="button" aria-label="Increase" disabled={disabled} onClick={() => bump(1)}>
        +
      </button>
    </div>
  );
}
