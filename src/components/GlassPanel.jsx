import "./GlassPanel.css";

/**
 * Frosted glass surface used on public pages (nav, cards, bands).
 * `tone`: nav | light | band | dark | chip
 */
export default function GlassPanel({
  as: Tag = "div",
  tone = "light",
  className = "",
  children,
  ...rest
}) {
  return (
    <Tag className={`glass glass-${tone} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
