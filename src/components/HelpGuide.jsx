import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";

export default function HelpGuide({ title, steps, onClose }) {
  const { lang } = useLang();
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
  }, [title]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!steps?.length) return null;

  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  return (
    <div className="tour-layer help-guide" role="dialog" aria-modal="true" aria-label={t(lang, title)}>
      <div className="tour-backdrop" aria-hidden="true" onClick={onClose} />
      <div className="tour-panel">
        <div className="tour-panel-hd">
          <span className="tour-progress">{t(lang, "tourProgress", step + 1, steps.length)}</span>
          <button type="button" className="tour-panel-skip" onClick={onClose}>
            {t(lang, "tourSkip")}
          </button>
        </div>
        <strong className="tour-panel-title">{t(lang, current.title)}</strong>
        <p className="tour-panel-body">{t(lang, current.body)}</p>
        <div className="tour-panel-actions">
          {!isFirst ? (
            <button type="button" className="btn tour-panel-back" onClick={() => setStep((s) => s - 1)}>
              {t(lang, "tourBack")}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="btn btn-p tour-panel-next"
            onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
          >
            {isLast ? t(lang, "tourDone") : t(lang, "tourNext")}
          </button>
        </div>
      </div>
    </div>
  );
}
