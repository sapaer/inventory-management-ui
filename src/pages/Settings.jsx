import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, formatApiError } from "../api";
import LocationPicker from "../components/LocationPicker";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { BUSINESS_TYPES, t, VEHICLES } from "../i18n";

export default function Settings() {
  const { user, setUser, signOut } = useAuth();
  const { lang, setLang } = useLang();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    shopName: user?.shopName || "",
    email: user?.email || "",
    address: user?.address || "",
    area: user?.area || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    geoLat: user?.geoLat ?? null,
    geoLng: user?.geoLng ?? null,
    businessType: user?.businessType || "SHOP",
    vehicleCategories: user?.vehicleCategories?.length ? user.vehicleCategories : ["FOUR_WHEELER"],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

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

  async function save() {
    setBusy(true);
    setError("");
    try {
      const updated = await authApi.updateProfile({
        name: form.name.trim() || undefined,
        shopName: form.shopName.trim() || undefined,
        email: form.email.trim() || undefined,
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
      setToast(t(lang, "saved"));
      setTimeout(() => setToast(""), 1800);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await signOut();
    nav("/login", { replace: true });
  }

  return (
    <div className="content">
      <div className="settings-grid">
        <div className="card">
          <div className="card-hd">
            <div className="card-ttl">{t(lang, "shopProfile")}</div>
          </div>
          <div style={{ padding: 16 }}>
            <div className="two-col">
              <div className="field-grp">
                <label className="field-lbl">{t(lang, "shopName")}</label>
                <input className="inp" value={form.shopName} onChange={(e) => set("shopName", e.target.value)} placeholder="Sharma Auto Parts" />
              </div>
              <div className="field-grp">
                <label className="field-lbl">{t(lang, "yourName")}</label>
                <input className="inp" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ramesh Sharma" />
              </div>
            </div>
            <div className="field-grp">
              <label className="field-lbl">{t(lang, "email")}</label>
              <input className="inp" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="field-grp">
              <LocationPicker value={form} onChange={(loc) => setForm((f) => ({ ...f, ...loc }))} />
            </div>
            <label className="field-lbl">{t(lang, "businessType")}</label>
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
            <label className="field-lbl">{t(lang, "vehiclesDeal")}</label>
            <div className="veh-chips">
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
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-hd">
              <div className="card-ttl">{t(lang, "language")}</div>
            </div>
            <div style={{ padding: 16 }}>
              <div className="lang-toggle">
                <button className={lang === "hi" ? "on" : ""} onClick={() => setLang("hi")}>
                  हिन्दी
                </button>
                <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
                  English
                </button>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-hd">
              <div className="card-ttl">{t(lang, "account")}</div>
            </div>
            <div style={{ padding: 16 }}>
              <div className="field-lbl">{t(lang, "mobile")}</div>
              <div style={{ fontWeight: 600, marginBottom: 14 }}>+91 {user?.phone}</div>
              <button className="btn btn-s" onClick={logout}>
                {t(lang, "logout")}
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-hd">
              <div className="card-ttl">{t(lang, "alerts")}</div>
            </div>
            <div style={{ padding: 16, fontSize: 13, color: "#6b7280" }}>
              {t(lang, "waAlerts")} — {lang === "hi" ? "बैकएंड पर चालू हैं जब क्वांटिटी मिनिमम पर आए।" : "sent by the server when quantity hits minimum."}
            </div>
          </div>
        </div>
      </div>
      {error ? <div className="err">{error}</div> : null}
      <div style={{ marginTop: 16 }}>
        <button className="btn btn-p" disabled={busy} onClick={save}>
          {busy ? t(lang, "saving") : t(lang, "saveChanges")}
        </button>
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
