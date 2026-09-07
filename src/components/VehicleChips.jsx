export default function VehicleChips({ options, value, onChange, disabled = false }) {
  return (
    <div className="vehicle-chips" role="group" aria-label="Vehicle category">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          disabled={disabled}
          className={`vehicle-chip${value === opt.id ? " on" : ""}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
