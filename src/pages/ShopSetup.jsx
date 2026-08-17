import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, formatApiError } from "../api";
import BrandLogo from "../components/BrandLogo";
import LangSelect from "../components/LangSelect";
import LocationPicker from "../components/LocationPicker";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { BUSINESS_TYPES, t, VEHICLES } from "../i18n";
import { markHowToSeen } from "../utils";

export default function ShopSetup() {
  const { user, setUser } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    shopName: user?.shopName || "",
    businessType: user?.businessType || "SHOP",
    vehicleCategories: user?.vehicleCategories?.length ? user.vehicleCategories : ["FOUR_WHEELER"],
    address: user?.address || "",
    area: user?.area || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    geoLat: user?.geoLat ?? null,
    geoLng: user?.geoLng ?? null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set(key, value) {
    setError("");
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleVehicle(id) {
    setError("");
    setForm((f) => {
      const has = f.vehicleCategories.includes(id);
      const next = has ? f.vehicleCategories.filter((x) => x !== id) : [...f.vehicleCategories, id];
      return { ...f, vehicleCategories: next.length ? next : f.vehicleCategories };
    });
  }

  async function submit() {
    setError("");
    if (!form.shopName.trim() || !form.name.trim()) {
      setError(t(lang, "shopFieldsRequired"));
      return;
    }
    if ((!form.area.trim() && !form.city.trim() && form.geoLat == null) || !form.address.trim()) {
      setError(t(lang, "locationRequired"));
      return;
    }
    setBusy(true);
    try {
      const updated = await authApi.updateProfile({
        name: form.name.trim(),
        shopName: form.shopName.trim(),
        businessType: form.businessType,
        address: form.address.trim() || undefined,
        area: form.area.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
        geoLat: form.geoLat == null ? undefined : Number(form.geoLat),
        geoLng: form.geoLng == null ? undefined : Number(form.geoLng),
        vehicleCategories: form.vehicleCategories,
      });
      setUser(updated);
      markHowToSeen(updated);
      nav("/dashboard", { replace: true });
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="setup">
      <LangSelect className="setup-lang" />
      <div className="reg-card">
        <BrandLogo className="reg-logo" />
        <h1 className="reg-title">{t(lang, "tellAboutShop")}</h1>
        <p className="reg-sub">{t(lang, "shopSetupSubShort")}</p>

        <section className="form-block">
          <h2 className="form-block-title">{t(lang, "basics")}</h2>
          <div className="two-col">
            <div className="field-grp">
              <label className="field-lbl">
                {t(lang, "shopName")} <span className="req">*</span>
              </label>
              <input
                className="inp"
                value={form.shopName}
                onChange={(e) => set("shopName", e.target.value)}
                placeholder="Sharma Auto Parts"
              />
            </div>
            <div className="field-grp">
              <label className="field-lbl">
                {t(lang, "yourName")} <span className="req">*</span>
              </label>
              <input
                className="inp"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ramesh Sharma"
              />
            </div>
          </div>
        </section>

        <section className="form-block">
          <h2 className="form-block-title">{t(lang, "location")}</h2>
          <LocationPicker
            required
            compact
            value={form}
            onChange={(loc) => {
              setError("");
              setForm((f) => ({ ...f, ...loc }));
            }}
          />
        </section>

        <section className="form-block">
          <h2 className="form-block-title">{t(lang, "businessType")}</h2>
          <div className="seg-row">
            {BUSINESS_TYPES.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`seg${form.businessType === b.id ? " on" : ""}`}
                onClick={() => set("businessType", b.id)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </section>

        <section className="form-block form-block-last">
          <h2 className="form-block-title">{t(lang, "vehiclesDeal")}</h2>
          <div className="veh-chips">
            {VEHICLES.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`vchip${form.vehicleCategories.includes(v.id) ? " on" : ""}`}
                onClick={() => toggleVehicle(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </section>

        {error ? <div className="err" style={{ marginBottom: 12 }}>{error}</div> : null}
        <button className="btn btn-p btn-full" disabled={busy} onClick={submit}>
          {busy ? t(lang, "saving") : t(lang, "setupCatalog")}
        </button>
      </div>
    </div>
  );
}
