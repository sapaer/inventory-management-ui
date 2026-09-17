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
  const [pageLayout, setPageLayout] = useState("c");
  const isCards = pageLayout === "b";
  const isSplit = pageLayout === "c";
  const useBoard = isCards || isSplit;

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
      `Hi PartNear,\n\nName: ${trimmedName}\nMobile: +91 ${trimmedPhone.slice(-10)}\n\n${trimmedQuery}`,
    );
    window.open(`${wa}?text=${text}`, "_blank", "noopener,noreferrer");
    setTimeout(() => setSending(false), 800);
  }

  const form = (
    <form
      className={`contact-form${useBoard ? " is-board" : ""}`}
      onSubmit={onSubmit}
      noValidate
    >
      <h2>{t(lang, "contactFormTitle")}</h2>
      {useBoard ? null : <p>{t(lang, "contactFormLead")}</p>}
      <div className="contact-form-grid">
        <label className="contact-field">
          <span>
            {t(lang, "contactFormName")}
            {useBoard ? null : <span className="req"> *</span>}
          </span>
          <input
            className="inp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="contact-field">
          <span>
            {t(lang, "contactFormPhone")}
            {useBoard ? null : <span className="req"> *</span>}
          </span>
          <input
            className="inp"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder={useBoard ? "" : "98765 43210"}
            autoComplete="tel"
          />
        </label>
      </div>
      <label className="contact-field">
        <span>
          {t(lang, "contactFormQuery")}
          {useBoard ? null : <span className="req"> *</span>}
        </span>
        <textarea
          className="inp contact-query"
          rows={isCards ? 2 : 5}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {error ? <p className="contact-form-error">{error}</p> : null}
      <button type="submit" className="btn btn-p contact-form-submit" disabled={sending}>
        {sending ? t(lang, "contactFormSending") : t(lang, "contactFormSubmit")}
      </button>
    </form>
  );

  const tiles = (
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
  );

  return (
    <SupportLayout
      className={`contact-page is-layout-${pageLayout}`}
      title={t(lang, "contactTitle")}
      lead={t(lang, "contactLead")}
      art={<ContactArt />}
      extra={
        <div className="contact-wa-picker" role="tablist" aria-label="Contact page layout">
          {["a", "b", "c"].map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={pageLayout === id}
              className={`contact-wa-pick${pageLayout === id ? " is-on" : ""}`}
              onClick={() => setPageLayout(id)}
            >
              {id.toUpperCase()}
            </button>
          ))}
        </div>
      }
    >
      {isCards ? (
        <div className="contact-layout is-cards">
          {tiles}
          {form}
        </div>
      ) : isSplit ? (
        <div className="contact-layout is-split">
          {form}
          {tiles}
        </div>
      ) : (
        <div className="contact-layout is-classic">
          <div className="contact-channels">
            <a
              className="contact-card contact-hero-card is-wa-c"
              href={wa}
              target="_blank"
              rel="noreferrer"
            >
              <strong className="contact-hero-ttl">{t(lang, "contactWhatsApp")}</strong>
              <span className="contact-card-ic contact-hero-ic">
                <ChatIcon />
              </span>
            </a>
            <div className="contact-secondary">
              <a className="contact-card contact-card-sm" href={mail}>
                <span className="contact-card-ic contact-card-ic-sm">
                  <MailIcon />
                </span>
                <strong>{t(lang, "email")}</strong>
                <span>{SUPPORT.email}</span>
                <em className="contact-card-btn is-ghost">{t(lang, "contactSendEmail")}</em>
              </a>
              <a className="contact-card contact-card-sm" href={call}>
                <span className="contact-card-ic contact-card-ic-sm">
                  <PhoneIcon />
                </span>
                <strong>{t(lang, "contactUs")}</strong>
                <span>{SUPPORT.whatsappDisplay}</span>
                <em className="contact-card-btn is-ghost">{t(lang, "contactCallNow")}</em>
              </a>
            </div>
          </div>
          {form}
        </div>
      )}
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

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.15 6.24 2.15 11.47c0 1.86.55 3.67 1.6 5.26L2 22l5.46-1.68a10.2 10.2 0 0 0 4.58 1.1h.01c5.46 0 9.89-4.24 9.89-9.47C21.94 6.24 17.5 2 12.04 2Zm5.76 13.4c-.24.68-1.4 1.25-1.92 1.33-.49.07-1.1.1-1.78-.11-.41-.13-.94-.3-1.62-.59-2.85-1.23-4.7-4.1-4.84-4.29-.14-.19-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.35.26-.28.57-.35.76-.35h.55c.18 0 .42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.31.02.5-.1.19-.14.31-.28.48-.14.16-.3.37-.42.5-.14.14-.29.29-.12.56.16.28.73 1.2 1.56 1.95 1.08.96 1.98 1.26 2.26 1.4.28.14.44.12.6-.07.16-.19.7-.82.89-1.1.19-.28.37-.23.63-.14.26.09 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.68-.17 1.36Z" />
    </svg>
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
