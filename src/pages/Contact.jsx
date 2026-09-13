import SupportLayout from "../components/SupportLayout";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { SUPPORT } from "../support";

export default function Contact() {
  const { lang } = useLang();
  const wa = `https://wa.me/${SUPPORT.whatsappDigits}`;
  const mail = `mailto:${SUPPORT.email}`;
  const call = `tel:+${SUPPORT.whatsappDigits}`;

  return (
    <SupportLayout title={t(lang, "contactTitle")} lead={t(lang, "contactLead")} art={<ContactArt />}>
      <div className="contact-hero-row">
        <a className="contact-card contact-hero-card" href={wa} target="_blank" rel="noreferrer">
          <span className="contact-card-ic contact-hero-ic">
            <ChatIcon />
          </span>
          <strong className="contact-hero-ttl">{t(lang, "contactWhatsApp")}</strong>
          <span>{t(lang, "contactWhatsAppBody")}</span>
          <em className="contact-card-btn contact-hero-btn">{t(lang, "contactChatWa")}</em>
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

function PhoneIcon() {
  return (
    <Icon>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.4 21 3 13.6 3 4.5c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" />
    </Icon>
  );
}
