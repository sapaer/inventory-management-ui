import { useEffect, useRef, useState } from "react";
import { placesApi } from "../api";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { locationLabel } from "../utils";

export default function LocationPicker({ value, onChange, required = false }) {
  const { lang } = useLang();
  const [query, setQuery] = useState(locationLabel(value) || value?.address || "");
  const [hits, setHits] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const box = useRef(null);
  const seq = useRef(0);

  useEffect(() => {
    const next = locationLabel(value) || value?.address || "";
    if (next && next !== query && !open) setQuery(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.address, value?.area, value?.city]);

  useEffect(() => {
    function hide(e) {
      if (!box.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const id = ++seq.current;
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const rows = await placesApi.autocomplete(q);
        if (id === seq.current) setHits(Array.isArray(rows) ? rows : []);
      } catch {
        if (id === seq.current) setHits([]);
      } finally {
        if (id === seq.current) setBusy(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  function apply(loc) {
    onChange({
      address: loc.address || "",
      area: loc.area || "",
      city: loc.city || "",
      state: loc.state || "",
      pincode: loc.pincode || "",
      geoLat: loc.geoLat ?? null,
      geoLng: loc.geoLng ?? null,
    });
    setQuery(locationLabel(loc) || loc.address || query);
    setOpen(false);
    setError("");
  }

  async function pick(hit) {
    setBusy(true);
    setError("");
    try {
      const loc = await placesApi.details(hit.placeId);
      apply({
        ...loc,
        address: loc.address || hit.description || "",
        area: loc.area || hit.mainText || "",
      });
    } catch {
      setError(t(lang, "locationFailed"));
    } finally {
      setBusy(false);
    }
  }

  function useCurrent() {
    if (!navigator.geolocation) {
      setError(t(lang, "locationDenied"));
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await placesApi.reverse(pos.coords.latitude, pos.coords.longitude);
          apply({
            ...loc,
            geoLat: loc.geoLat ?? pos.coords.latitude,
            geoLng: loc.geoLng ?? pos.coords.longitude,
          });
        } catch {
          setError(t(lang, "locationFailed"));
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError(t(lang, "locationDenied"));
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  const lat = value?.geoLat;
  const lng = value?.geoLng;
  const hasPin = lat != null && lng != null && lat !== "" && lng !== "";

  return (
    <div className="loc-picker" ref={box}>
      <label className="field-lbl">
        {t(lang, "areaCity")} {required ? <span className="req">*</span> : null}
      </label>
      <div className="loc-search">
        <div className="loc-row">
          <input
            className="inp loc-inp"
            value={query}
            placeholder={t(lang, "startTypingArea")}
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              const text = e.target.value;
              setQuery(text);
              setOpen(true);
              onChange({
                ...value,
                address: text,
                area: text,
                geoLat: null,
                geoLng: null,
              });
            }}
          />
          <button type="button" className="btn btn-s loc-gps" disabled={locating} onClick={useCurrent}>
            {locating ? t(lang, "locating") : t(lang, "useCurrentLocation")}
          </button>
        </div>
        {open && (hits.length > 0 || busy) ? (
          <div className="loc-list">
            {busy && hits.length === 0 ? <div className="loc-empty">{t(lang, "searchingPlaces")}</div> : null}
            {hits.map((hit) => (
              <button key={hit.placeId} type="button" className="loc-hit" onClick={() => pick(hit)}>
                <strong>{hit.mainText || hit.description}</strong>
                {hit.secondaryText || (hit.mainText && hit.description) ? (
                  <span>{hit.secondaryText || hit.description}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {hasPin ? (
        <>
          <div className="loc-picked">
            📍 {locationLabel(value) || value.address}
            {value.state ? ` · ${value.state}` : ""}
            {value.pincode ? ` · ${value.pincode}` : ""}
          </div>
          <iframe
            title={t(lang, "shopLocation")}
            className="loc-map"
            src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
            loading="lazy"
          />
        </>
      ) : null}
      {error ? <div className="err">{error}</div> : null}
    </div>
  );
}
