import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, authApi, formatApiError } from "../api";
import AuthLayout from "../components/AuthLayout";
import PasswordField from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { initials, isValidPhone, needsShopSetup } from "../utils";

const OTP_COOLDOWN_SEC = 45;

export default function Auth() {
  const { signIn, setUser } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const isSignup = searchParams.get("mode") === "signup";

  const [methodState, setMethodState] = useState("password");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState(null);
  const inputs = useRef([]);

  // Signup is OTP-only; login can also use a password.
  const method = isSignup ? "otp" : methodState;

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  // Reset the transient form state when toggling between login and signup.
  useEffect(() => {
    setMethodState("password");
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setPassword("");
    setFirstName("");
    setLastName("");
    setError("");
    setPicker(null);
  }, [isSignup]);

  async function goAfterSignIn(data) {
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

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (isSignup && fullName) {
      try {
        const updated = await authApi.updateProfile({ name: fullName });
        if (updated) setUser(updated);
      } catch {
        /* non-fatal — the name can still be set during shop setup */
      }
    }

    nav(needsShopSetup(data.user) || data.isNewUser ? "/account-setup" : "/dashboard", { replace: true });
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
    if (isSignup && (!firstName.trim() || !lastName.trim())) {
      setError(t(lang, "nameRequired"));
      return;
    }
    if (!isValidPhone(phone)) {
      setError(t(lang, "invalidPhone"));
      return;
    }
    if (seconds > 0) return;
    setBusy(true);
    try {
      await authApi.requestOtp(phone);
      setMethodState("otp");
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
    setMethodState("otp");
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
    setMethodState(next);
    setError("");
    if (next === "password") setOtpSent(false);
  }

  const phoneField = (
    <>
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
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (method === "otp" && !otpSent) requestOtp();
          }}
        />
      </div>
    </>
  );

  const authToggleLink = (
    <p className="login-signup">
      {isSignup ? (
        <>
          {t(lang, "haveAccountQ")} <Link to="/auth?mode=login">{t(lang, "lpLogin")}</Link>
        </>
      ) : (
        <>
          {t(lang, "newHereQ")} <Link to="/auth?mode=signup">{t(lang, "createAccountCta")}</Link>
        </>
      )}
    </p>
  );

  if (picker) {
    return (
      <AuthLayout hideLogin hideSignup>
        <div className="login-form">
          <h1 className="login-title">{t(lang, "chooseShop")}</h1>
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
      </AuthLayout>
    );
  }

  return (
    <AuthLayout hideLogin hideSignup>
      <div className="login-form">
        <div className="login-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="3.4" fill="currentColor" />
            <path
              d="M4.5 19.2c1.3-3.6 4.1-5.4 7.5-5.4s6.2 1.8 7.5 5.4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="login-title">{isSignup ? t(lang, "lpSignUp") : t(lang, "signIn")}</h1>

        {otpSent ? (
          <>
            <div className="otp-sent">
              ✓ {t(lang, "otpSent")} +91 {phone}
            </div>
            <p className="lead" style={{ marginTop: 8 }}>
              {t(lang, "checkWhatsappOtp")}
            </p>
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
        ) : method === "otp" ? (
          <>
            {isSignup ? (
              <div className="name-row">
                <div className="name-col">
                  <label className="field-lbl">
                    {t(lang, "firstName")} <span className="req">*</span>
                  </label>
                  <input
                    className="inp"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => {
                      setError("");
                      setFirstName(e.target.value);
                    }}
                  />
                </div>
                <div className="name-col">
                  <label className="field-lbl">
                    {t(lang, "lastName")} <span className="req">*</span>
                  </label>
                  <input
                    className="inp"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => {
                      setError("");
                      setLastName(e.target.value);
                    }}
                  />
                </div>
              </div>
            ) : null}
            {phoneField}
            <button
              className="btn btn-p btn-full"
              style={{ marginTop: 4 }}
              disabled={busy || seconds > 0}
              onClick={requestOtp}
            >
              {busy
                ? t(lang, "sending")
                : isSignup
                  ? t(lang, "createAccountCta")
                  : t(lang, "getOtp")}
              {seconds > 0 && !busy ? ` (${t(lang, "in", seconds)})` : ""}
            </button>

            {isSignup ? (
              <p className="hint" style={{ textAlign: "center", marginTop: 8 }}>
                {t(lang, "signupOtpHint")}
              </p>
            ) : null}

            {!isSignup ? (
              <>
                <div className="or-sep">
                  <span>{t(lang, "or")}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-s btn-full"
                  disabled={busy}
                  onClick={() => switchMethod("password")}
                >
                  {t(lang, "loginWithPassword")}
                </button>
              </>
            ) : null}

            {authToggleLink}
          </>
        ) : (
          <>
            <form onSubmit={signInWithPassword}>
              {phoneField}
              <div className="field-lbl-row">
                <label className="field-lbl">{t(lang, "password")}</label>
                <button
                  type="button"
                  className="link"
                  disabled={busy || seconds > 0}
                  onClick={forgotPassword}
                >
                  {t(lang, "forgotPassword")}
                  {seconds > 0 ? ` (${t(lang, "in", seconds)})` : ""}
                </button>
              </div>
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
            </form>

            <div className="or-sep">
              <span>{t(lang, "or")}</span>
            </div>

            <button
              type="button"
              className="btn btn-s btn-full"
              disabled={busy}
              onClick={() => switchMethod("otp")}
            >
              {t(lang, "loginWithOtp")}
            </button>

            {authToggleLink}
          </>
        )}

        {error ? <div className="err">{error}</div> : null}
      </div>
    </AuthLayout>
  );
}
