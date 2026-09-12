import SupportLayout from "../components/SupportLayout";
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
    <SupportLayout title={t(lang, "termsTitle")} lead={t(lang, "termsLead")} art={<TermsArt />}>
      <p className="support-meta">{t(lang, "termsUpdated")}</p>
      <div className="support-list">
        {SECTIONS.map(([title, body], i) => (
          <section key={title} className="support-item">
            <span className="support-num">{i + 1}</span>
            <div>
              <h2>{t(lang, title)}</h2>
              <p>{t(lang, body)}</p>
            </div>
          </section>
        ))}
      </div>
    </SupportLayout>
  );
}

function TermsArt() {
  return (
    <svg viewBox="0 0 220 160" fill="none">
      <rect x="58" y="18" width="104" height="124" rx="10" fill="#e8f4ee" />
      <rect x="70" y="36" width="80" height="8" rx="4" fill="#145c45" />
      <rect x="70" y="54" width="80" height="6" rx="3" fill="#9cc9b4" />
      <rect x="70" y="68" width="64" height="6" rx="3" fill="#9cc9b4" />
      <rect x="70" y="82" width="72" height="6" rx="3" fill="#9cc9b4" />
      <circle cx="168" cy="118" r="22" fill="#145c45" />
      <path d="M159 118l6 6 12-12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
