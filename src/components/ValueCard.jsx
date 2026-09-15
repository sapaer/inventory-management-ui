import GlassPanel from "./GlassPanel";

export default function ValueCard({ icon, title, body }) {
  return (
    <GlassPanel as="li" className="lp-value-card">
      <div className="lp-value-head">
        <span className="lp-value-ic" aria-hidden="true">
          {icon}
        </span>
        <strong>{title}</strong>
      </div>
      <span className="lp-value-body">{body}</span>
    </GlassPanel>
  );
}
