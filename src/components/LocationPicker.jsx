import { useEffect, useRef, useState } from "react";
import { placesApi } from "../api";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { locationLabel } from "../utils";

export default function LocationPicker({ value, onChange, required = false, compact = false }) {
  const { lang } = useLang();
  const [query, setQuery] = useState(locationLabel(value) || "");
  const [hits, setHits] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const box = useRef(null);
  const searchRef = useRef(null);
  const seq = useRef(0);

  useEffect(() => {
    const next = locationLabel(value) || "";
    if (next && next !== query && !open) setQuery(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.area, value?.city, value?.geoLat, value?.geoLng]);

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

  function patch(partial) {
    onChange({ ...value, ...partial });
  }

  function applyPlace(loc) {
    const nextAddress = loc.address || value?.address || "";
    onChange({
      ...value,
      address: nextAddress,
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
      applyPlace({
        ...loc,
        address: loc.address || hit.description || "",
        area: loc.area || hit.mainText || "",
      });
    } catch {
      setError(t(lang, "locationPickFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function useCurrent() {
    setLocating(true);
    setError("");

    const applyCoords = async (latitude, longitude) => {
      try {
        const loc = await placesApi.reverse(latitude, longitude);
        applyPlace({
          ...loc,
          geoLat: loc.geoLat ?? latitude,
          geoLng: loc.geoLng ?? longitude,
        });
      } catch {
        onChange({
          ...value,
          geoLat: latitude,
          geoLng: longitude,
        });
        setQuery(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setError(t(lang, "locationFailed"));
      }
    };

    // GPS is optional — on failure just move focus to search (no scary error).
    const askToSearch = () => {
      setError("");
      searchRef.current?.focus();
      setOpen(true);
    };

    if (!window.isSecureContext || !navigator.geolocation) {
      askToSearch();
      setLocating(false);
      return;
    }

    const readPosition = (options) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    try {
      let pos;
      try {
        pos = await readPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60_000,
        });
      } catch {
        pos = await readPosition({
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 0,
        });
      }

      await applyCoords(pos.coords.latitude, pos.coords.longitude);
    } catch {
      askToSearch();
    } finally {
      setLocating(false);
    }
  }

  const lat = value?.geoLat;
  const lng = value?.geoLng;
  const hasPin = lat != null && lng != null && lat !== "" && lng !== "";
  const locality = locationLabel(value);

  return (
    <div className="loc-picker" ref={box}>
      <label className="field-lbl">
        {t(lang, "googleLocation")} {required ? <span className="req">*</span> : null}
      </label>
      {!compact ? (
        <>
          <p className="loc-hint">{t(lang, "googleLocationHint")}</p>
          <p className="loc-hint loc-hint-soft">{t(lang, "locationGpsOptional")}</p>
        </>
      ) : null}
      <div className="loc-search">
        <div className="loc-row">
          <input
            ref={searchRef}
            className="inp loc-inp"
            value={query}
            placeholder={t(lang, "startTypingArea")}
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setError("");
            }}
          />
          <button type="button" className="btn btn-s loc-gps" disabled={locating} onClick={useCurrent}>
            {locating ? t(lang, "locating") : compact ? t(lang, "gpsShort") : t(lang, "useCurrentLocation")}
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

      {hasPin || locality ? (
        <div className="loc-picked">
          📍 {locality || value?.address}
          {value?.state ? ` · ${value.state}` : ""}
          {value?.pincode ? ` · ${value.pincode}` : ""}
          {hasPin ? (
            <span className="loc-coords">
              {" "}
              ({Number(lat).toFixed(5)}, {Number(lng).toFixed(5)})
            </span>
          ) : null}
        </div>
      ) : null}

      {hasPin && !compact ? (
        <iframe
          title={t(lang, "shopLocation")}
          className="loc-map"
          src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
          loading="lazy"
        />
      ) : null}

      <label className="field-lbl loc-address-lbl">
        {t(lang, "shopAddress")} {required ? <span className="req">*</span> : null}
      </label>
      {!compact ? <p className="loc-hint">{t(lang, "shopAddressHint")}</p> : null}
      <textarea
        className="inp loc-address"
        rows={compact ? 2 : 3}
        value={value?.address || ""}
        placeholder={t(lang, "shopAddressPlaceholder")}
        onChange={(e) => patch({ address: e.target.value })}
      />

      {error ? <div className="loc-tip">{error}</div> : null}
    </div>
  );
}
