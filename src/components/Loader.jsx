/**
 * Shared spinner: page (default), overlay (full-screen), inline (buttons).
 * Visual only — no loading copy.
 */
export default function Loader({ variant = "page", noTranslate = false, className = "" }) {
  const classes = ["loader", `loader-${variant}`, className].filter(Boolean).join(" ");

  return (
    <div
      className={`${classes}${noTranslate ? " notranslate" : ""}`}
      translate={noTranslate ? "no" : undefined}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="loader-spinner" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
