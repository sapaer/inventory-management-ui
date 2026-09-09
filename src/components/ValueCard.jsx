import GlassPanel from "./GlassPanel";

export default function ValueCard({ icon, title, body }) {
  return (
    <GlassPanel as="li" className="lp-value-card">
      <span className="lp-value-ic" aria-hidden="true">
        {icon}
      </span>
      <div className="lp-value-copy">
        <strong>{title}</strong>
        <span>{body}</span>
      </div>
    </GlassPanel>
  );
}
