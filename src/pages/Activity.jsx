import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatApiError, inventoryApi } from "../api";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { formatDate, stockOf } from "../utils";
import StatusBadge from "../components/StatusBadge";
import DateRangePicker, { fromKey } from "../components/DateRangePicker";
import "./Activity.css";

const PAGE = 15;

const TYPES = [
  { id: "ALL", key: "actAll" },
  { id: "ADD", key: "actAdded" },
  { id: "SOLD", key: "actSold" },
  { id: "RECEIVED", key: "actReceived" },
  { id: "ADJUSTMENT", key: "actAdjusted" },
  { id: "RETURNED", key: "actReturned" },
];

// [start, end) in local time; either side null = open-ended.
function rangeBounds(from, to) {
  const end = fromKey(to);
  return [fromKey(from), end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : null];
}

const TYPE_KEY = Object.fromEntries(TYPES.map((x) => [x.id, x.key]));

const NO_STATS = { changes: 0, unitsSold: 0, unitsReceived: 0 };

export default function Activity() {
  const { lang } = useLang();
  const [params, setParams] = useSearchParams();
  const [parts, setParts] = useState([]);
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(NO_STATS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState("ALL");
  const [dates, setDates] = useState({ from: "", to: "" });
  const latest = useRef(0);

  useEffect(() => {
    inventoryApi
      .list()
      .then((rows) => setParts(Array.isArray(rows) ? rows : []))
      .catch(() => setParts([]));
  }, []);

  const partId = params.get("part") || "";
  const part = parts.find((p) => p.id === partId) || null;

  const query = useMemo(() => {
    const [start, end] = rangeBounds(dates.from, dates.to);
    return {
      partId: part?.id,
      type: type === "ALL" ? undefined : type,
      from: start ? start.toISOString() : undefined,
      to: end ? end.toISOString() : undefined,
    };
  }, [part?.id, type, dates]);

  // Any filter change starts over at page 1. Older responses that land after a
  // newer request was sent are dropped so the list never shows stale filters.
  useEffect(() => {
    if (partId && !parts.length) return;
    const id = ++latest.current;
    setError("");
    inventoryApi
      .activity({ ...query, page: 1, limit: PAGE })
      .then((res) => {
        if (id !== latest.current) return;
        setEvents(res.content || []);
        setTotal(res.total || 0);
        setStats(res.stats || NO_STATS);
        setPage(1);
      })
      .catch((e) => {
        if (id === latest.current) setError(formatApiError(e));
      })
      .finally(() => {
        if (id === latest.current) setLoading(false);
      });
  }, [query, partId, parts.length]);

  async function showMore() {
    const id = ++latest.current;
    setLoadingMore(true);
    try {
      const res = await inventoryApi.activity({ ...query, page: page + 1, limit: PAGE });
      if (id !== latest.current) return;
      setEvents((list) => [...list, ...(res.content || [])]);
      setTotal(res.total || 0);
      setPage(page + 1);
    } catch (e) {
      if (id === latest.current) setError(formatApiError(e));
    } finally {
      if (id === latest.current) setLoadingMore(false);
    }
  }

  function selectPart(id) {
    setParams(id ? { part: id } : {}, { replace: true });
  }

  const groups = useMemo(() => groupByDay(events), [events]);

  if (loading) return <div className="content act">Loading…</div>;

  return (
    <div className="content act">
      <header className="act-head">
        <div>
          <h1 className="act-title">{t(lang, "activity")}</h1>
          <p className="act-sub">{t(lang, "activitySub")}</p>
        </div>
      </header>

      <div className="act-filters">
        <PartPicker lang={lang} parts={parts} selected={part} onChange={selectPart} />
        <div className="act-types" role="group" aria-label={t(lang, "actType")}>
          {TYPES.map((x) => (
            <button
              key={x.id}
              type="button"
              className={`chip${type === x.id ? " on" : ""}`}
              aria-pressed={type === x.id}
              onClick={() => setType(x.id)}
            >
              {t(lang, x.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="act-range">
        <span className="act-range-lbl">{t(lang, "actDate")}</span>
        <DateRangePicker value={dates} onChange={setDates} />
      </div>

      <section className="card act-summary">
        {part ? (
          <div className="act-part">
            <strong className="act-part-name">{part.partName}</strong>
            <StatusBadge status={stockOf(part)} lang={lang} />
            <span className="act-part-now">{t(lang, "actNow", part.quantity)}</span>
          </div>
        ) : null}
        <div className="act-stats">
          <div>
            <strong>{stats.changes}</strong>
            <span>{t(lang, "actChanges")}</span>
          </div>
          <div>
            <strong>{stats.unitsSold}</strong>
            <span>{t(lang, "actUnitsSold")}</span>
          </div>
          <div>
            <strong>{stats.unitsReceived}</strong>
            <span>{t(lang, "actUnitsIn")}</span>
          </div>
        </div>
      </section>

      {error ? <div className="err">{error}</div> : null}

      {total === 0 ? (
        <div className="card act-empty">
          <p className="act-empty-ttl">{t(lang, "actEmptyTitle")}</p>
          <p className="act-empty-sub">
            {t(lang, dates.from || dates.to ? "actEmptyRange" : part ? "actEmptyPart" : "actEmptySub")}
          </p>
        </div>
      ) : (
        <section className="card act-feed">
          {groups.map((group) => (
            <div className="act-day" key={group.key}>
              <p className="act-day-hd">
                {dayLabel(lang, group.key, group.items[0].createdAt)}
                <span>{group.items.length}</span>
              </p>
              {group.items.map((e) => (
                <EventRow key={e.id} e={e} lang={lang} onPart={part ? null : () => selectPart(e.partId)} />
              ))}
            </div>
          ))}
          {total > events.length ? (
            <button type="button" className="act-more" disabled={loadingMore} onClick={showMore}>
              {loadingMore ? t(lang, "loading") : t(lang, "actMore", total - events.length)}
            </button>
          ) : null}
        </section>
      )}
    </div>
  );
}

function EventRow({ e, lang, onPart }) {
  const up = e.qtyChange > 0;
  const flat = e.qtyChange === 0;
  return (
    <div className="act-row">
      <span className={`act-ic is-${e.changeType.toLowerCase()}`} aria-hidden="true">
        <TypeIcon type={e.changeType} />
      </span>
      <div className="act-main">
        <div className="act-line">
          <strong>{t(lang, TYPE_KEY[e.changeType])}</strong>
          {onPart ? (
            <button type="button" className="act-part-link" onClick={onPart} title={t(lang, "actShowPart")}>
              {e.partName}
            </button>
          ) : null}
        </div>
        <div className="act-detail">
          {e.qtyBefore} → {e.qtyAfter}
          {e.note ? ` · ${e.note}` : ""}
        </div>
      </div>
      <div className="act-side">
        {flat ? null : <span className={`act-delta ${up ? "is-up" : "is-down"}`}>{up ? `+${e.qtyChange}` : `−${Math.abs(e.qtyChange)}`}</span>}
        <span className="act-time">{formatTime(e.createdAt)}</span>
      </div>
    </div>
  );
}

function PartPicker({ lang, parts, selected, onChange }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    function onDoc(ev) {
      if (box.current && !box.current.contains(ev.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (selected) {
    return (
      <div className="act-picked">
        <span className="act-picked-name">{selected.partName}</span>
        <button type="button" className="act-picked-x" aria-label={t(lang, "actClearPart")} onClick={() => onChange("")}>
          ×
        </button>
      </div>
    );
  }

  const q = text.trim().toLowerCase();
  const matches = parts.filter((p) => !q || p.partName.toLowerCase().includes(q)).slice(0, 8);

  return (
    <div className="act-picker" ref={box}>
      <span className="act-picker-ic" aria-hidden="true">
        ⌕
      </span>
      <input
        value={text}
        placeholder={t(lang, "actSearchPart")}
        onFocus={() => setOpen(true)}
        onChange={(ev) => {
          setText(ev.target.value);
          setOpen(true);
        }}
      />
      {open && matches.length ? (
        <ul className="act-picker-list" role="listbox">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                onClick={() => {
                  setOpen(false);
                  setText("");
                  onChange(p.id);
                }}
              >
                {p.partName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function groupByDay(list) {
  const buckets = new Map();
  for (const e of list) {
    const key = dayKey(e.createdAt);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(e);
  }
  return [...buckets.entries()].map(([key, items]) => ({ key, items }));
}

function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(lang, key, iso) {
  const d = new Date(iso);
  const today = new Date();
  if (key === dayKey(today.toISOString())) return t(lang, "dayToday");
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (key === dayKey(yesterday.toISOString())) return t(lang, "dayYesterday");
  return formatDate(d.toISOString());
}

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function TypeIcon({ type }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "ADD")
    return (
      <svg {...p}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  if (type === "SOLD")
    return (
      <svg {...p}>
        <path d="M12 5v14M6 13l6 6 6-6" />
      </svg>
    );
  if (type === "RECEIVED")
    return (
      <svg {...p}>
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    );
  if (type === "RETURNED")
    return (
      <svg {...p}>
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}
