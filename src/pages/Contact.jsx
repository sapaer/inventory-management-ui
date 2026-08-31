import InfoShell from "../components/InfoShell";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import { SUPPORT } from "../support";

export default function Contact() {
  const { lang } = useLang();
  const wa = `https://wa.me/${SUPPORT.whatsappDigits}`;
  const mail = `mailto:${SUPPORT.email}`;

  return (
    <InfoShell title={t(lang, "contactTitle")}>
      <p className="info-lead">{t(lang, "contactLead")}</p>
      <div className="info-cards">
        <a className="info-card" href={wa} target="_blank" rel="noreferrer">
          <strong>{t(lang, "contactWhatsApp")}</strong>
          <span>{SUPPORT.whatsappDisplay}</span>
          <em>{t(lang, "contactPlaceholder")}</em>
        </a>
        <a className="info-card" href={mail}>
          <strong>{t(lang, "email")}</strong>
          <span>{SUPPORT.email}</span>
          <em>{t(lang, "contactPlaceholder")}</em>
        </a>
        <div className="info-card">
          <strong>{t(lang, "contactHours")}</strong>
          <span>{SUPPORT.hours}</span>
        </div>
      </div>
      <p className="info-note">{t(lang, "contactNote")}</p>
    </InfoShell>
  );
}
