import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, formatApiError } from "../api";
import LocationPicker from "../components/LocationPicker";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { BUSINESS_TYPES, t, VEHICLES } from "../i18n";

export default function ShopSetup() {
  const { user, setUser } = useAuth();
  const { lang, setLang } = useLang();
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
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleVehicle(id) {
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
    if (!form.area.trim() && !form.city.trim() && !form.address.trim()) {
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
      nav("/", { replace: true });
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="setup">
      <div className="lang-toggle setup-lang">
        <button className={lang === "hi" ? "on" : ""} onClick={() => setLang("hi")}>
          हिन्दी
        </button>
        <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
          English
        </button>
      </div>
      <div className="reg-card">
        <div className="reg-logo">{t(lang, "brand")}</div>
        <div className="step-ind">
          <div className="step-dot done" />
          <div className="step-dot done" />
          <div className="step-dot active" />
        </div>
        <h1 className="reg-title">{t(lang, "tellAboutShop")}</h1>
        <p className="reg-sub">{t(lang, "shopSetupSub")}</p>

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

        <div className="field-grp">
          <LocationPicker
            required
            value={form}
            onChange={(loc) => setForm((f) => ({ ...f, ...loc }))}
          />
        </div>

        <label className="field-lbl">
          {t(lang, "businessType")} <span className="req">*</span>
        </label>
        <div className="biz-opts" style={{ marginBottom: 14 }}>
          {BUSINESS_TYPES.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`biz-opt${form.businessType === b.id ? " on" : ""}`}
              onClick={() => set("businessType", b.id)}
            >
              <div>
                <div className="biz-opt-text">{lang === "hi" ? b.hi : b.en}</div>
                <div className="biz-opt-sub">{lang === "hi" ? b.subHi : b.subEn}</div>
              </div>
              <span className="radio" />
            </button>
          ))}
        </div>

        <label className="field-lbl">
          {t(lang, "vehiclesDeal")}{" "}
          <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>({t(lang, "selectAll")})</span>
        </label>
        <div className="veh-chips" style={{ marginBottom: 18 }}>
          {VEHICLES.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`vchip${form.vehicleCategories.includes(v.id) ? " on" : ""}`}
              onClick={() => toggleVehicle(v.id)}
            >
              {lang === "hi" ? v.hi : v.en}
            </button>
          ))}
        </div>

        {error ? <div className="err" style={{ marginBottom: 12 }}>{error}</div> : null}
        <button className="btn btn-p btn-full" disabled={busy} onClick={submit}>
          {busy ? t(lang, "saving") : t(lang, "setupCatalog")}
        </button>
      </div>
    </div>
  );
}
