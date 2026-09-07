export default function MoneyInput({ value, onChange, placeholder = "0", disabled = false }) {
  return (
    <div className="money-input">
      <span className="money-pfx" aria-hidden="true">
        ₹
      </span>
      <input
        className="f-inp money-inp"
        type="number"
        min="0"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
