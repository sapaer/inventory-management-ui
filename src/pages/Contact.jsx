import SupportLayout from "../components/SupportLayout";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { SUPPORT } from "../support";

export default function Contact() {
  const { lang } = useLang();
  const wa = `https://wa.me/${SUPPORT.whatsappDigits}`;
  const mail = `mailto:${SUPPORT.email}`;

  return (
    <SupportLayout title={t(lang, "contactTitle")} lead={t(lang, "contactLead")} art={<ContactArt />}>
      <div className="contact-cards">
        <a className="contact-card" href={wa} target="_blank" rel="noreferrer">
          <span className="contact-card-ic">
            <ChatIcon />
          </span>
          <strong>{t(lang, "contactWhatsApp")}</strong>
          <span>{SUPPORT.whatsappDisplay}</span>
          <em className="contact-card-btn">{t(lang, "contactChatWa")}</em>
        </a>
        <a className="contact-card" href={mail}>
          <span className="contact-card-ic">
            <MailIcon />
          </span>
          <strong>{t(lang, "email")}</strong>
          <span>{SUPPORT.email}</span>
          <em className="contact-card-btn is-ghost">{t(lang, "contactSendEmail")}</em>
        </a>
        <div className="contact-card">
          <span className="contact-card-ic">
            <ClockIcon />
          </span>
          <strong>{t(lang, "contactHours")}</strong>
          <span>{SUPPORT.hours}</span>
        </div>
      </div>
      <p className="contact-note">{t(lang, "contactNote")}</p>
    </SupportLayout>
  );
}

function ContactArt() {
  return (
    <svg viewBox="0 0 220 160" fill="none">
      <circle cx="168" cy="48" r="32" fill="#e8f4ee" />
      <rect x="132" y="70" width="72" height="52" rx="16" fill="#145c45" />
      <path d="M146 90h44M146 102h30" stroke="#e8f4ee" strokeWidth="4" strokeLinecap="round" />
      <rect x="20" y="42" width="96" height="78" rx="14" fill="#d7eee3" />
      <circle cx="50" cy="74" r="14" fill="#145c45" />
      <rect x="72" y="66" width="32" height="6" rx="3" fill="#145c45" />
      <rect x="72" y="80" width="24" height="6" rx="3" fill="#9cc9b4" />
    </svg>
  );
}

function Icon({ children }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function ChatIcon() {
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

function ClockIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 8v4.4l2.8 1.8" />
    </Icon>
  );
}
