import "./PageSection.css";

/** Constrained landing/info section with consistent padding at every breakpoint. */
export default function PageSection({
  id,
  as: Tag = "section",
  className = "",
  innerClassName = "",
  compact = false,
  kicker,
  kickerClassName = "",
  title,
  titleClassName = "",
  body,
  children,
}) {
  return (
    <Tag id={id} className={`page-section ${className}`.trim()}>
      <div className={`page-section-inner${compact ? " is-compact" : ""} ${innerClassName}`.trim()}>
        {kicker ? <p className={`page-section-kicker ${kickerClassName}`.trim()}>{kicker}</p> : null}
        {title ? <h2 className={`page-section-title ${titleClassName}`.trim()}>{title}</h2> : null}
        {body ? <p className="page-section-body">{body}</p> : null}
        {children}
      </div>
    </Tag>
  );
}
