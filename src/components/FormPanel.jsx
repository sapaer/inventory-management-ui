export default function FormPanel({ title, optional, children, className = "" }) {
  return (
    <section className={`form-panel ${className}`.trim()}>
      {title ? (
        <header className="form-panel-hd">
          <h2 className="form-panel-title">{title}</h2>
          {optional ? <span className="form-panel-opt">(Optional)</span> : null}
        </header>
      ) : null}
      <div className="form-panel-body">{children}</div>
    </section>
  );
}
