export default function FormField({ label, required, hint, children, className = "" }) {
  return (
    <div className={`form-field ${className}`.trim()}>
      {label ? (
        <label className="form-field-lbl">
          {label}
          {required ? <span className="req"> *</span> : null}
        </label>
      ) : null}
      {children}
      {hint ? <p className="form-field-hint">{hint}</p> : null}
    </div>
  );
}
