import { useEffect, useRef, useState } from "react";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import "./DateRangePicker.css";

const pad = (n) => String(n).padStart(2, "0");
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromKey = (k) => {
  if (!k) return null;
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const dayShift = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

function short(d, withYear) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });
}

/** Human label for a {from,to} pair (yyyy-mm-dd strings), e.g. "12 Sep" or
 * "12 Sep – 18 Sep" — the year only shows up if it isn't the current one. */
export function formatRangeLabel({ from, to }) {
  const s = fromKey(from);
  const e = fromKey(to) || s;
  if (!s) return "";
  const now = new Date().getFullYear();
  const fmt = (d) => short(d, d.getFullYear() !== now);
  return e && toKey(e) !== toKey(s) ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
}

/**
 * Calendar-popover date range. `value` is { from, to } as yyyy-mm-dd strings
 * ("" = open); a single picked day means that one day. Future days are disabled.
 */
export default function DateRangePicker({ value, onChange }) {
  const { lang } = useLang();
  const today = fromKey(toKey(new Date()));
  const box = useRef(null);
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const applied = Boolean(value.from || value.to);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openPanel() {
    const s = fromKey(value.from);
    const e = fromKey(value.to);
    setStart(s);
    setEnd(e);
    const anchor = e || s || today;
    setView(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    setOpen((v) => !v);
  }

  function commit(s, e) {
    onChange({ from: s ? toKey(s) : "", to: e ? toKey(e) : s ? toKey(s) : "" });
    setOpen(false);
  }

  function pick(day) {
    if (!start || end) {
      setStart(day);
      setEnd(null);
    } else if (day < start) {
      setStart(day);
    } else {
      setEnd(day);
    }
  }

  const presets = [
    [t(lang, "actToday"), () => commit(today, today)],
    [t(lang, "act7Days"), () => commit(dayShift(today, -6), today)],
    [t(lang, "act30Days"), () => commit(dayShift(today, -29), today)],
    [t(lang, "actThisMonth"), () => commit(new Date(today.getFullYear(), today.getMonth(), 1), today)],
  ];

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = first.getDay();
  const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  const atCurrentMonth = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, 1 + i).toLocaleDateString("en-IN", { weekday: "narrow" }),
  );

  const sameYear = (d) => d.getFullYear() === today.getFullYear();
  let label = t(lang, "actAnyTime");
  if (applied) {
    const s = fromKey(value.from);
    const e = fromKey(value.to) || s;
    label = s && e && toKey(s) !== toKey(e) ? `${short(s, !sameYear(s))} – ${short(e, !sameYear(e))}` : short(s || e, !sameYear(s || e));
  }

  return (
    <div className="dr" ref={box}>
      <button type="button" className={`dr-btn${applied ? " is-set" : ""}`} aria-expanded={open} onClick={openPanel}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
        <span>{label}</span>
      </button>
      {applied ? (
        <button type="button" className="dr-x" aria-label={t(lang, "actClearDates")} onClick={() => onChange({ from: "", to: "" })}>
          ×
        </button>
      ) : null}

      {open ? (
        <div className="dr-pop" role="dialog" aria-label={t(lang, "actDate")}>
          <div className="dr-presets">
            {presets.map(([text, go]) => (
              <button key={text} type="button" className="chip" onClick={go}>
                {text}
              </button>
            ))}
          </div>

          <div className="dr-nav">
            <button type="button" aria-label="Previous month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
              ‹
            </button>
            <strong>{view.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong>
            <button
              type="button"
              aria-label="Next month"
              disabled={atCurrentMonth}
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>

          <div className="dr-grid">
            {weekdays.map((w, i) => (
              <span className="dr-wd" key={i}>
                {w}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={`b${i}`} />;
              const future = d > today;
              const isStart = start && toKey(d) === toKey(start);
              const isEnd = end && toKey(d) === toKey(end);
              const inRange = start && end && d > start && d < end;
              return (
                <button
                  key={toKey(d)}
                  type="button"
                  disabled={future}
                  className={`dr-day${isStart || isEnd ? " is-edge" : ""}${inRange ? " is-in" : ""}${toKey(d) === toKey(today) ? " is-today" : ""}`}
                  onClick={() => pick(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="dr-foot">
            <span className="dr-hint">
              {start ? `${short(start, false)}${end ? ` – ${short(end, false)}` : ""}` : t(lang, "actPickHint")}
            </span>
            <button type="button" className="btn btn-g" onClick={() => commit(null, null)}>
              {t(lang, "actClearDates")}
            </button>
            <button type="button" className="btn btn-p" disabled={!start} onClick={() => commit(start, end)}>
              {t(lang, "actApply")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
