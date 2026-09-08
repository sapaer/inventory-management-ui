export default function FormField({ label, required, hint, tooltip, children, className = "" }) {
  return (
    <div className={`form-field ${className}`.trim()}>
      {label ? (
        <div className="form-field-lbl-row">
          <label className="form-field-lbl">
            {label}
            {required ? <span className="req"> *</span> : null}
          </label>
          {tooltip ? (
            <span className="field-tip" tabIndex={0} aria-label={tooltip}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 10v6" />
                <circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
              </svg>
              <span className="field-tip-bubble" role="tooltip">
                {tooltip}
              </span>
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
      {hint ? <p className="form-field-hint">{hint}</p> : null}
    </div>
  );
}
