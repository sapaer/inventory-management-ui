export default function QtyStepper({ value, onChange, min = 1, disabled = false }) {
  const n = Number(value);
  const current = Number.isFinite(n) ? n : min;

  function bump(delta) {
    if (disabled) return;
    onChange(Math.max(min, current + delta));
  }

  return (
    <div className={`qty-stepper${disabled ? " is-disabled" : ""}`}>
      <button type="button" aria-label="Decrease" disabled={disabled || current <= min} onClick={() => bump(-1)}>
        −
      </button>
      <input
        type="number"
        min={min}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" aria-label="Increase" disabled={disabled} onClick={() => bump(1)}>
        +
      </button>
    </div>
  );
}
