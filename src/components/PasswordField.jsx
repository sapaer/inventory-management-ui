import { useState } from "react";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";

export default function PasswordField({
  value,
  onChange,
  autoComplete = "current-password",
  placeholder,
  className = "",
  style,
}) {
  const { lang } = useLang();
  const [show, setShow] = useState(false);

  return (
    <div className={`pw-wrap ${className}`.trim()} style={style}>
      <input
        className="inp pw-inp"
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="pw-toggle"
        aria-label={show ? t(lang, "hidePassword") : t(lang, "showPassword")}
        aria-pressed={show}
        onClick={() => setShow((v) => !v)}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.8 21.8 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}
