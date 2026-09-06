import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, authApi, formatApiError } from "../api";
import BrandLogo from "../components/BrandLogo";
import PasswordField from "../components/PasswordField";
import LangSelect from "../components/LangSelect";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { initials, isValidPhone, needsShopSetup } from "../utils";
import { isDevAuthBypassEnabled } from "../devAuth";

const DEV_OTP = "000000";
const OTP_COOLDOWN_SEC = 45;

export default function Login() {
  const { signIn } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const [method, setMethod] = useState("otp");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState(null);
  const inputs = useRef([]);
  const devMode = isDevAuthBypassEnabled();

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  function goAfterSignIn(data) {
    if (data?.needsAccountSelection) {
      setPicker({ phoneToken: data.phoneToken, accounts: data.accounts || [] });
      return;
    }
    if (!data?.accessToken) {
      setError(t(lang, "passwordLoginUnavailable"));
      return;
    }
    setPicker(null);
    signIn(data);
    nav(needsShopSetup(data.user) || data.isNewUser ? "/setup" : "/dashboard", { replace: true });
  }

  async function pickAccount(accountId) {
    setBusy(true);
    setError("");
    try {
      const data = await authApi.selectAccount(picker.phoneToken, accountId);
      goAfterSignIn(data);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function requestOtp() {
    setError("");
    if (!isValidPhone(phone)) {
      setError(t(lang, "invalidPhone"));
      return;
    }
    if (seconds > 0) return;
    setBusy(true);
    try {
      await authApi.requestOtp(phone);
      setMethod("otp");
      setOtpSent(true);
      setSeconds(OTP_COOLDOWN_SEC);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  /** Local only: request OTP then verify with fixed DEV_OTP_CODE (backend bypass). */
  async function skipOtpDev() {
    setError("");
    if (!isValidPhone(phone)) {
      setError(t(lang, "invalidPhone"));
      return;
    }
    setBusy(true);
    try {
      await authApi.requestOtp(phone);
      const data = await authApi.verifyOtp(phone, DEV_OTP);
      goAfterSignIn(data);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function signInWithPassword(e) {
    e?.preventDefault();
    setError("");
    if (!isValidPhone(phone)) {
      setError(t(lang, "invalidPhone"));
      return;
    }
    if (String(password).length < 8) {
      setError(t(lang, "passwordTooShort"));
      return;
    }
    setBusy(true);
    try {
      const data = await authApi.passwordLogin(phone, password);
      goAfterSignIn(data);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
        setError(t(lang, "passwordLoginUnavailable"));
      } else {
        setError(formatApiError(e));
      }
    } finally {
      setBusy(false);
    }
  }

  function forgotPassword() {
    setMethod("otp");
    setOtpSent(false);
    setError("");
    requestOtp();
  }

  async function verify() {
    const code = otp.join("");
    if (code.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      const data = await authApi.verifyOtp(phone, code);
      goAfterSignIn(data);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  function onOtpChange(i, value) {
    setError("");
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) inputs.current[i + 1]?.focus();
    if (digit && i === 5 && next.every(Boolean)) {
      setTimeout(() => {
        const code = next.join("");
        if (code.length === 6) {
          setBusy(true);
          authApi
            .verifyOtp(phone, code)
            .then((data) => goAfterSignIn(data))
            .catch((e) => setError(formatApiError(e)))
            .finally(() => setBusy(false));
        }
      }, 0);
    }
  }

  function onOtpKey(i, e) {
    if (e.key === "Backspace") setError("");
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "Enter") verify();
  }

  function onPaste(e) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length < 2) return;
    e.preventDefault();
    setError("");
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = text[i] || "";
    setOtp(next);
    inputs.current[Math.min(text.length, 5)]?.focus();
  }

  function changeNumber() {
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setError("");
  }

  function switchMethod(next) {
    setMethod(next);
    setError("");
    if (next === "password") setOtpSent(false);
  }

  if (picker) {
    return (
      <div className="login">
        <div className="login-left">
          <div>
            <BrandLogo className="login-brand" />
            <div className="login-tag">{t(lang, "tagline")}</div>
          </div>
        </div>
        <div className="login-right">
          <LangSelect className="login-lang" />
          <div className="login-form">
            <h1>{t(lang, "chooseShop")}</h1>
            <p className="lead">{t(lang, "chooseShopHint")}</p>
            <div className="account-picker">
              {picker.accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  className="account-picker-item"
                  disabled={busy}
                  onClick={() => pickAccount(acc.id)}
                >
                  <span className="av">{initials(acc.shopName || acc.name)}</span>
                  <span className="account-picker-meta">
                    <span className="account-picker-name">{acc.shopName || acc.name || t(lang, "unnamedShop")}</span>
                    {acc.status === "DEACTIVATED" ? (
                      <span className="account-picker-badge">{t(lang, "deactivated")}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
            {error ? <div className="err">{error}</div> : null}
            <button
              type="button"
              className="link"
              style={{ marginTop: 14 }}
              disabled={busy}
              onClick={() => {
                setPicker(null);
                setError("");
              }}
            >
              {t(lang, "changeNumber")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <div className="login-left">
        <div>
          <BrandLogo className="login-brand" />
          <div className="login-tag">{t(lang, "tagline")}</div>
          <div className="login-hero">{t(lang, "heroTitle")}</div>
          <div className="login-sub">{t(lang, "heroSub")}</div>
          <div className="benefit">
            <span className="benefit-ic">1</span>
            <div>
              <strong>{t(lang, "benefit1")}</strong>
              <span>{t(lang, "benefit1s")}</span>
            </div>
          </div>
          <div className="benefit">
            <span className="benefit-ic">2</span>
            <div>
              <strong>{t(lang, "benefit2")}</strong>
              <span>{t(lang, "benefit2s")}</span>
            </div>
          </div>
          <div className="benefit">
            <span className="benefit-ic">3</span>
            <div>
              <strong>{t(lang, "benefit3")}</strong>
              <span>{t(lang, "benefit3s")}</span>
            </div>
          </div>
        </div>
        <div className="login-foot">{t(lang, "freeNote")}</div>
      </div>
      <div className="login-right">
        <LangSelect className="login-lang" />
        <div className="login-form">
          <h1>{t(lang, "signIn")}</h1>
          <p className="lead">{method === "password" ? t(lang, "enterPassword") : t(lang, "enterMobile")}</p>

          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={method === "otp"}
              className={`auth-tab${method === "otp" ? " on" : ""}`}
              onClick={() => switchMethod("otp")}
            >
              {t(lang, "signInWithOtp")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={method === "password"}
              className={`auth-tab${method === "password" ? " on" : ""}`}
              onClick={() => switchMethod("password")}
            >
              {t(lang, "signInWithPassword")}
            </button>
          </div>

          <label className="field-lbl">
            {t(lang, "mobile")} <span className="req">*</span>
          </label>
          <div className="phone-wrap">
            <div className="phone-prefix">+91</div>
            <input
              className="phone-inp"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="98765 43210"
              value={phone}
              disabled={otpSent && method === "otp"}
              onChange={(e) => {
                setError("");
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                if (method === "otp" && !otpSent) requestOtp();
              }}
            />
          </div>

          {method === "password" ? (
            <form onSubmit={signInWithPassword}>
              <label className="field-lbl">{t(lang, "password")}</label>
              <PasswordField
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setError("");
                  setPassword(e.target.value);
                }}
              />
              <button className="btn btn-p btn-full" style={{ marginTop: 14 }} disabled={busy} type="submit">
                {busy ? t(lang, "signingIn") : t(lang, "signIn")}
              </button>
              <div className="otp-actions">
                <button type="button" className="link" disabled={busy || seconds > 0} onClick={forgotPassword}>
                  {t(lang, "forgotPassword")}
                  {seconds > 0 ? ` (${t(lang, "in", seconds)})` : ""}
                </button>
              </div>
              <p className="hint" style={{ marginTop: 8 }}>
                {t(lang, "forgotPasswordHint")}
              </p>
            </form>
          ) : otpSent ? (
            <>
              <div className="otp-sent">
                ✓ {t(lang, "otpSent")} +91 {phone}
              </div>
              <label className="field-lbl">{t(lang, "enterOtp")}</label>
              <div className="otp-row" onPaste={onPaste}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    className={`otp-box${d ? " filled" : ""}`}
                    maxLength={1}
                    inputMode="numeric"
                    value={d}
                    onChange={(e) => onOtpChange(i, e.target.value)}
                    onKeyDown={(e) => onOtpKey(i, e)}
                  />
                ))}
              </div>
              <button className="btn btn-p btn-full" disabled={busy || otp.join("").length !== 6} onClick={verify}>
                {busy ? t(lang, "verifying") : t(lang, "verifyOtp")}
              </button>
              <div className="otp-actions">
                <button className="link" disabled={seconds > 0 || busy} onClick={requestOtp}>
                  {t(lang, "resend")}
                  {seconds > 0 ? ` (${t(lang, "in", seconds)})` : ""}
                </button>
                <button className="link muted" onClick={changeNumber}>
                  {t(lang, "changeNumber")}
                </button>
              </div>
            </>
          ) : (
            <>
              <button className="btn btn-p btn-full" disabled={busy || seconds > 0} onClick={requestOtp}>
                {busy ? t(lang, "sending") : t(lang, "getOtp")}
                {seconds > 0 && !busy ? ` (${t(lang, "in", seconds)})` : ""}
              </button>
              {devMode ? (
                <button
                  type="button"
                  className="btn btn-s btn-full"
                  style={{ marginTop: 10 }}
                  disabled={busy}
                  onClick={skipOtpDev}
                >
                  {t(lang, "skipOtpDev")}
                </button>
              ) : null}
            </>
          )}
          {error ? <div className="err">{error}</div> : null}
          <p className="hint" style={{ textAlign: "center", marginTop: 14 }}>
            {devMode ? t(lang, "devOtpHint") : t(lang, "noPassword")}
          </p>
          <p className="legal-inline">
            {t(lang, "agreePrefix")}{" "}
            <Link to="/terms">{t(lang, "terms")}</Link>
            {" · "}
            <Link to="/help">{t(lang, "help")}</Link>
            {" · "}
            <Link to="/contact">{t(lang, "contact")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
