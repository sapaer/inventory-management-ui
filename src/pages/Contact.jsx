import { useState } from "react";
import SupportLayout from "../components/SupportLayout";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { SUPPORT } from "../support";

export default function Contact() {
  const { lang } = useLang();
  const wa = `https://wa.me/${SUPPORT.whatsappDigits}`;
  const mail = `mailto:${SUPPORT.email}`;
  const call = `tel:+${SUPPORT.whatsappDigits}`;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/\D/g, "");
    const trimmedQuery = query.trim();
    if (!trimmedName || trimmedPhone.length < 10 || !trimmedQuery) {
      setError(t(lang, "contactFormNeedAll"));
      return;
    }
    setError("");
    setSending(true);
    const text = encodeURIComponent(
      `Hi Spaer,\n\nName: ${trimmedName}\nMobile: +91 ${trimmedPhone.slice(-10)}\n\n${trimmedQuery}`,
    );
    window.open(`${wa}?text=${text}`, "_blank", "noopener,noreferrer");
    setTimeout(() => setSending(false), 800);
  }

  return (
    <SupportLayout title={t(lang, "contactTitle")} art={<ContactArt />}>
      <div className="contact-layout is-cards">
        <div className="contact-tiles">
          <a className="contact-tile" href={wa} target="_blank" rel="noreferrer">
            <span className="contact-tile-ic">
              <ChatOutlineIcon />
            </span>
            <strong>{t(lang, "contactChatWa")}</strong>
            <span>{t(lang, "contactWaReply")}</span>
          </a>
          <a className="contact-tile" href={mail}>
            <span className="contact-tile-ic">
              <MailIcon />
            </span>
            <strong>{t(lang, "contactSendEmail")}</strong>
            <span>{t(lang, "contactEmailReply")}</span>
          </a>
          <a className="contact-tile" href={call}>
            <span className="contact-tile-ic">
              <PhoneIcon />
            </span>
            <strong>{t(lang, "contactCallback")}</strong>
            <span>{t(lang, "contactCallbackHint")}</span>
          </a>
        </div>

        <form className="contact-form is-board" onSubmit={onSubmit} noValidate>
          <h2>{t(lang, "contactFormTitle")}</h2>
          <div className="contact-form-grid">
            <label className="contact-field">
              <span>{t(lang, "contactFormName")}</span>
              <input className="inp" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label className="contact-field">
              <span>{t(lang, "contactFormPhone")}</span>
              <input
                className="inp"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                autoComplete="tel"
              />
            </label>
          </div>
          <label className="contact-field">
            <span>{t(lang, "contactFormQuery")}</span>
            <textarea className="inp contact-query" rows={2} value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {error ? <p className="contact-form-error">{error}</p> : null}
          <button type="submit" className="btn btn-p contact-form-submit" disabled={sending}>
            {sending ? t(lang, "contactFormSending") : t(lang, "contactFormSubmit")}
          </button>
        </form>
      </div>
      <p className="contact-note">{t(lang, "contactNote")}</p>
    </SupportLayout>
  );
}

function ContactArt() {
  return (
    <div className="contact-hero-tile">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#eafaf1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
        <rect x="2.5" y="13" width="5" height="7" rx="2" />
        <rect x="16.5" y="13" width="5" height="7" rx="2" />
        <path d="M20 20v.5a3.5 3.5 0 0 1-3.5 3.5H13" />
      </svg>
    </div>
  );
}

function Icon({ children }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function ChatOutlineIcon() {
  return (
    <Icon>
      <path d="M7 18.5 3.5 21V8.5A4.5 4.5 0 0 1 8 4h8a4.5 4.5 0 0 1 4.5 4.5v5A4.5 4.5 0 0 1 16 18H7z" />
    </Icon>
  );
}

function MailIcon() {
  return (
    <Icon>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  );
}

function PhoneIcon() {
  return (
    <Icon>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.4 21 3 13.6 3 4.5c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" />
    </Icon>
  );
}
