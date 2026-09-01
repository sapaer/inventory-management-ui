import { Link } from "react-router-dom";
import InfoShell from "../components/InfoShell";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";

const FAQ = [
  ["helpFaq1Q", "helpFaq1A"],
  ["helpFaq2Q", "helpFaq2A"],
  ["helpFaq3Q", "helpFaq3A"],
  ["helpFaq4Q", "helpFaq4A"],
  ["helpFaq5Q", "helpFaq5A"],
];

export default function Help() {
  const { lang } = useLang();
  return (
    <InfoShell title={t(lang, "helpTitle")}>
      <p className="info-lead">{t(lang, "helpLead")}</p>
      <div className="info-faq">
        {FAQ.map(([q, a]) => (
          <details key={q} className="info-faq-item">
            <summary>{t(lang, q)}</summary>
            <p>{t(lang, a)}</p>
          </details>
        ))}
      </div>
      <p className="info-cta">
        {t(lang, "helpStillStuck")}{" "}
        <Link to="/contact">{t(lang, "contactSupport")}</Link>
      </p>
    </InfoShell>
  );
}
