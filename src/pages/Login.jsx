import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, formatApiError } from "../api";
import BrandLogo from "../components/BrandLogo";
import LangSelect from "../components/LangSelect";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { isValidPhone, needsShopSetup } from "../utils";
import { isDevAuthBypassEnabled } from "../devAuth";

const DEV_OTP = "000000";

export default function Login() {
  const { signIn } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef([]);
  const devMode = isDevAuthBypassEnabled();

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  function goAfterSignIn(data) {
    signIn(data);
    nav(needsShopSetup(data.user) || data.isNewUser ? "/setup" : "/dashboard", { replace: true });
  }

  async function requestOtp() {
    setError("");
    if (!isValidPhone(phone)) {
      setError(t(lang, "invalidPhone"));
      return;
    }
    setBusy(true);
    try {
      await authApi.requestOtp(phone);
      setOtpSent(true);
      setSeconds(30);
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
          <h1>{t(lang, "createAccount")}</h1>
          <p className="lead">{t(lang, "enterMobile")}</p>
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
              disabled={otpSent}
              onChange={(e) => {
                setError("");
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
              }}
              onKeyDown={(e) => e.key === "Enter" && !otpSent && requestOtp()}
            />
          </div>

          {otpSent ? (
            <>
              <div className="otp-sent">✓ {t(lang, "otpSent")} +91 {phone}</div>
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
              <button className="btn btn-p btn-full" disabled={busy} onClick={requestOtp}>
                {busy ? t(lang, "sending") : t(lang, "getOtp")}
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
        </div>
      </div>
    </div>
  );
}
