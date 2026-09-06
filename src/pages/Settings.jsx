import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, formatApiError } from "../api";
import PasswordField from "../components/PasswordField";
import LangSelect from "../components/LangSelect";
import LocationPicker from "../components/LocationPicker";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { BUSINESS_TYPES, t, VEHICLES } from "../i18n";

export default function Settings() {
  const { user, setUser, signIn, signOut } = useAuth();
  const { lang } = useLang();
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
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [changeOtp, setChangeOtp] = useState("");
  const [accounts, setAccounts] = useState(null);
  const [accountsError, setAccountsError] = useState("");
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .listAccounts()
      .then((list) => {
        if (!cancelled) setAccounts(list || []);
      })
      .catch((e) => {
        if (!cancelled) setAccountsError(formatApiError(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  async function savePassword() {
    if (pw.length < 8) {
      setError(t(lang, "passwordTooShort"));
      return;
    }
    if (pw !== pw2) {
      setError(t(lang, "passwordsMismatch"));
      return;
    }
    setPwBusy(true);
    setError("");
    try {
      await authApi.setPassword(pw);
      setPw("");
      setPw2("");
      setUser({ ...user, hasPassword: true });
      setToast(t(lang, "passwordSaved"));
      setTimeout(() => setToast(""), 2200);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setPwBusy(false);
    }
  }

  async function requestPasswordChange() {
    setPwBusy(true);
    setError("");
    try {
      await authApi.requestPasswordChangeOtp();
      setOtpRequested(true);
      setToast(t(lang, "otpSent"));
      setTimeout(() => setToast(""), 2200);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setPwBusy(false);
    }
  }

  async function submitPasswordChange() {
    if (changeOtp.length !== 6) {
      setError(t(lang, "enterOtp"));
      return;
    }
    if (pw.length < 8) {
      setError(t(lang, "passwordTooShort"));
      return;
    }
    if (pw !== pw2) {
      setError(t(lang, "passwordsMismatch"));
      return;
    }
    setPwBusy(true);
    setError("");
    try {
      await authApi.changePassword(changeOtp, pw);
      setPw("");
      setPw2("");
      setChangeOtp("");
      setOtpRequested(false);
      setToast(t(lang, "passwordSaved"));
      setTimeout(() => setToast(""), 2200);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setPwBusy(false);
    }
  }

  async function switchTo(accountId) {
    setSwitching(true);
    setAccountsError("");
    try {
      const data = await authApi.switchAccount(accountId);
      signIn(data);
      window.location.href = "/dashboard";
    } catch (e) {
      setAccountsError(formatApiError(e));
      setSwitching(false);
    }
  }

  async function addShop() {
    setSwitching(true);
    setAccountsError("");
    try {
      const data = await authApi.createAccount();
      signIn(data);
      window.location.href = "/setup";
    } catch (e) {
      setAccountsError(formatApiError(e));
      setSwitching(false);
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
              <LocationPicker
                value={form}
                onChange={(loc) => {
                  setError("");
                  setForm((f) => ({ ...f, ...loc }));
                }}
              />
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
                    <div className="biz-opt-text">{b.label}</div>
                    <div className="biz-opt-sub">{b.sub}</div>
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
                  {v.label}
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
              <LangSelect />
            </div>
          </div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-hd">
              <div className="card-ttl">{t(lang, "yourShops")}</div>
            </div>
            <div style={{ padding: 16 }}>
              {accounts === null ? (
                <p className="hint">{t(lang, "loading")}</p>
              ) : (
                <>
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="shop-row"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}
                    >
                      <span>
                        {acc.shopName || acc.name || t(lang, "unnamedShop")}
                        {acc.id === user?.id ? ` · ${t(lang, "current")}` : ""}
                        {acc.status === "DEACTIVATED" ? ` · ${t(lang, "deactivated")}` : ""}
                      </span>
                      {acc.id !== user?.id ? (
                        <button
                          type="button"
                          className="btn btn-s"
                          disabled={switching}
                          onClick={() => switchTo(acc.id)}
                        >
                          {t(lang, "switchTo")}
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <button type="button" className="btn btn-s" style={{ marginTop: 8 }} disabled={switching} onClick={addShop}>
                    {t(lang, "addShop")}
                  </button>
                </>
              )}
              {accountsError ? <div className="err">{accountsError}</div> : null}
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
              <div className="legal-inline" style={{ textAlign: "left", marginTop: 16 }}>
                <Link to="/help">{t(lang, "help")}</Link>
                {" · "}
                <Link to="/contact">{t(lang, "contact")}</Link>
                {" · "}
                <Link to="/terms">{t(lang, "terms")}</Link>
              </div>
              <div style={{ marginTop: 18 }}>
                {!user?.hasPassword ? (
                  <>
                    <div className="field-lbl">{t(lang, "setPassword")}</div>
                    <p className="hint" style={{ margin: "4px 0 10px" }}>
                      {t(lang, "setPasswordHint")}
                    </p>
                    <PasswordField
                      autoComplete="new-password"
                      placeholder={t(lang, "newPassword")}
                      value={pw}
                      onChange={(e) => {
                        setError("");
                        setPw(e.target.value);
                      }}
                    />
                    <PasswordField
                      autoComplete="new-password"
                      placeholder={t(lang, "confirmPassword")}
                      value={pw2}
                      onChange={(e) => {
                        setError("");
                        setPw2(e.target.value);
                      }}
                      style={{ marginTop: 8 }}
                    />
                    <button
                      type="button"
                      className="btn btn-s"
                      style={{ marginTop: 10 }}
                      disabled={pwBusy}
                      onClick={savePassword}
                    >
                      {pwBusy ? t(lang, "saving") : t(lang, "setPassword")}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="field-lbl">{t(lang, "changePassword")}</div>
                    <p className="hint" style={{ margin: "4px 0 10px" }}>
                      {t(lang, "changePasswordHint")}
                    </p>
                    {!otpRequested ? (
                      <button type="button" className="btn btn-s" disabled={pwBusy} onClick={requestPasswordChange}>
                        {pwBusy ? t(lang, "sending") : t(lang, "sendOtp")}
                      </button>
                    ) : (
                      <>
                        <input
                          className="inp"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder={t(lang, "enterOtp")}
                          value={changeOtp}
                          onChange={(e) => {
                            setError("");
                            setChangeOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                          }}
                        />
                        <PasswordField
                          autoComplete="new-password"
                          placeholder={t(lang, "newPassword")}
                          value={pw}
                          onChange={(e) => {
                            setError("");
                            setPw(e.target.value);
                          }}
                          style={{ marginTop: 8 }}
                        />
                        <PasswordField
                          autoComplete="new-password"
                          placeholder={t(lang, "confirmPassword")}
                          value={pw2}
                          onChange={(e) => {
                            setError("");
                            setPw2(e.target.value);
                          }}
                          style={{ marginTop: 8 }}
                        />
                        <button
                          type="button"
                          className="btn btn-s"
                          style={{ marginTop: 10 }}
                          disabled={pwBusy}
                          onClick={submitPasswordChange}
                        >
                          {pwBusy ? t(lang, "saving") : t(lang, "changePassword")}
                        </button>
                        <div>
                          <button
                            type="button"
                            className="link"
                            style={{ marginTop: 8 }}
                            disabled={pwBusy}
                            onClick={requestPasswordChange}
                          >
                            {t(lang, "resend")}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-hd">
              <div className="card-ttl">{t(lang, "alerts")}</div>
            </div>
            <div style={{ padding: 16, fontSize: 13, color: "#6b7280" }}>
              {t(lang, "waAlerts")} — {t(lang, "waAlertsHint")}
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
