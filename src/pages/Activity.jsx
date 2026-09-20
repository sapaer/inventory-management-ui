import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatApiError, inventoryApi } from "../api";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { formatDate } from "../utils";
import ActivityRow from "../components/ActivityRow";
import Dropdown from "../components/Dropdown";
import { InfoNote, PageHero } from "../components/PageHero";
import SearchIcon from "../components/SearchIcon";
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
  { id: "EDIT", key: "actEdited" },
];

// [start, end) in local time; either side null = open-ended.
function rangeBounds(from, to) {
  const end = fromKey(to);
  return [fromKey(from), end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : null];
}

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
  const [showFilters, setShowFilters] = useState(false);
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

  const typeOptions = TYPES.map((x) => ({ value: x.id, label: t(lang, x.id === "ALL" ? "actAllChanges" : x.key) }));
  const datesSet = Boolean(dates.from || dates.to);
  const activeCount = (type !== "ALL" ? 1 : 0) + (datesSet ? 1 : 0);
  const anyActive = activeCount > 0 || Boolean(part);

  function clearAll() {
    setType("ALL");
    setDates({ from: "", to: "" });
    selectPart("");
  }

  if (loading) return <div className="content act">Loading…</div>;

  return (
    <div className="content act">
      <PageHero
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l2.5-7 4 14L16 12h5" />
          </svg>
        }
        kicker={t(lang, "actKicker")}
        title={t(lang, "activity")}
      />
      <InfoNote id="activity">{t(lang, "activitySub")}</InfoNote>

      {/* One toolbar instead of stacked blocks. On a phone the type and date
          controls fold behind a Filters button. */}
      <div className="act-bar">
        <PartPicker lang={lang} parts={parts} onChange={selectPart} />
        <button
          type="button"
          className={`act-filter-btn${activeCount ? " is-set" : ""}`}
          aria-expanded={showFilters}
          onClick={() => setShowFilters((v) => !v)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="8" cy="17" r="2" />
          </svg>
          {t(lang, "actFilters")}
          {activeCount ? <span className="act-filter-n">{activeCount}</span> : null}
        </button>
        <div className={`act-tools${showFilters ? " is-open" : ""}`}>
          <Dropdown className="dd-sm" value={type} options={typeOptions} onChange={setType} ariaLabel={t(lang, "actType")} />
          <DateRangePicker value={dates} onChange={setDates} />
        </div>
      </div>

      <div className="act-active">
        <div className="act-tags">
          {anyActive ? <span className="act-active-lbl">{t(lang, "actShowing")}</span> : null}
          {part ? <FilterTag label={part.partName} remove={t(lang, "actClearPart")} onRemove={() => selectPart("")} /> : null}
          {type !== "ALL" ? (
            <FilterTag label={t(lang, TYPES.find((x) => x.id === type)?.key)} remove={t(lang, "actRemoveFilter")} onRemove={() => setType("ALL")} />
          ) : null}
          {datesSet ? (
            <FilterTag label={rangeText(dates)} remove={t(lang, "actClearDates")} onRemove={() => setDates({ from: "", to: "" })} />
          ) : null}
          {anyActive ? (
            <button type="button" className="act-clear" onClick={clearAll}>
              {t(lang, "actClearAll")}
            </button>
          ) : null}
        </div>
        <p className="act-count">{t(lang, "actRecords", total)}</p>
      </div>

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
                <ActivityRow key={e.id} e={e} lang={lang} onPart={part ? null : () => selectPart(e.partId)} />
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

function PartPicker({ lang, parts, onChange }) {
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

  const q = text.trim().toLowerCase();
  const matches = parts.filter((p) => !q || p.partName.toLowerCase().includes(q)).slice(0, 8);

  return (
    <div className="act-picker" ref={box}>
      <span className="act-picker-ic" aria-hidden="true">
        <SearchIcon size={18} />
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

function FilterTag({ label, remove, onRemove }) {
  return (
    <span className="act-tag">
      <span className="act-tag-text">{label}</span>
      <button type="button" className="act-tag-x" aria-label={remove} onClick={onRemove}>
        ×
      </button>
    </span>
  );
}

function rangeText({ from, to }) {
  const s = fromKey(from);
  const e = fromKey(to) || s;
  const now = new Date().getFullYear();
  const fmt = (d) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(d.getFullYear() === now ? {} : { year: "numeric" }) });
  if (!s) return fmt(e);
  return e && e.getTime() !== s.getTime() ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
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
