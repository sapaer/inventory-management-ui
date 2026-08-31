import InfoShell from "../components/InfoShell";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";

const SECTIONS = [
  ["termsS1Title", "termsS1Body"],
  ["termsS2Title", "termsS2Body"],
  ["termsS3Title", "termsS3Body"],
  ["termsS4Title", "termsS4Body"],
  ["termsS5Title", "termsS5Body"],
  ["termsS6Title", "termsS6Body"],
];

export default function Terms() {
  const { lang } = useLang();
  return (
    <InfoShell title={t(lang, "termsTitle")}>
      <p className="info-lead">{t(lang, "termsLead")}</p>
      <p className="info-meta">{t(lang, "termsUpdated")}</p>
      {SECTIONS.map(([title, body]) => (
        <section key={title} className="info-section">
          <h2>{t(lang, title)}</h2>
          <p>{t(lang, body)}</p>
        </section>
      ))}
    </InfoShell>
  );
}
