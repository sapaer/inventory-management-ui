import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { markTourSeen, shouldStartTour } from "../utils";

const STEPS = [
  { path: "/dashboard", title: "tour1Title", body: "tour1Body" },
  { path: "/inventory/new", title: "tour2Title", body: "tour2Body" },
  { path: "/inventory", title: "tour3Title", body: "tour3Body" },
  { path: "/low-stocks", title: "tour4Title", body: "tour4Body" },
];

/**
 * Interactive guide — one step at a time.
 * New users: navigates pages. Sidebar User guide: stays on current page.
 */
export default function AppTour({ open = false, onClose }) {
  const { user } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const loc = useLocation();
  const [autoOpen, setAutoOpen] = useState(false);
  const [step, setStep] = useState(0);

  const navigating = autoOpen;
  const visible = open || autoOpen;

  useEffect(() => {
    if (!user) {
      setAutoOpen(false);
      return;
    }
    if (shouldStartTour(user)) {
      setStep(0);
      setAutoOpen(true);
    }
  }, [user?.phone]);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!navigating) return;
    const target = STEPS[step]?.path;
    if (target && loc.pathname !== target) nav(target);
  }, [navigating, step, loc.pathname, nav]);

  if (!visible || !STEPS[step]) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  function close() {
    markTourSeen(user);
    setAutoOpen(false);
    setStep(0);
    onClose?.();
    if (navigating) nav("/dashboard");
  }

  function next() {
    if (isLast) {
      close();
      return;
    }
    setStep((s) => s + 1);
  }

  function back() {
    if (!isFirst) setStep((s) => s - 1);
  }

  return (
    <div
      className={`tour-layer${navigating ? " tour-layer--nav" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, "userGuide")}
    >
      <div className="tour-backdrop" aria-hidden="true" />
      <div className={`tour-panel${navigating ? " tour-panel--dock" : ""}`}>
        <div className="tour-panel-hd">
          <span className="tour-progress">{t(lang, "tourProgress", step + 1, STEPS.length)}</span>
          <button type="button" className="tour-panel-skip" onClick={close}>
            {t(lang, "tourSkip")}
          </button>
        </div>
        <strong className="tour-panel-title">{t(lang, current.title)}</strong>
        <p className="tour-panel-body">{t(lang, current.body)}</p>
        <div className="tour-panel-actions">
          {!isFirst ? (
            <button type="button" className="btn tour-panel-back" onClick={back}>
              {t(lang, "tourBack")}
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="btn btn-p tour-panel-next" onClick={next}>
            {isLast ? t(lang, "tourDone") : t(lang, "tourNext")}
          </button>
        </div>
      </div>
    </div>
  );
}
