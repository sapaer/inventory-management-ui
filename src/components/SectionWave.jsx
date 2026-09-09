/** Soft color join between stacked landing bands. */
export default function SectionWave({ className = "", fill = "var(--lp-fog, #e8f1ed)" }) {
  return (
    <svg
      className={`section-wave ${className}`.trim()}
      viewBox="0 0 1440 72"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path fill={fill} d="M0 44C200 12 420 0 640 16C900 36 1100 72 1440 32V72H0Z" />
    </svg>
  );
}
