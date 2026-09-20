import BrandLogo from "../components/BrandLogo";
import LangSelect from "../components/LangSelect";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";
import "./ComingSoon.css";

export default function ComingSoon() {
  const { lang } = useLang();

  return (
    <div className="cs">
      <div className="cs-bg" aria-hidden="true" />
      <header className="cs-top">
        <BrandLogo className="cs-brand" to="/" />
        <LangSelect />
      </header>
      <main className="cs-main">
        <span className="cs-pill">{t(lang, "comingSoonPill")}</span>
        <h1 className="cs-title">{t(lang, "comingSoonTitle")}</h1>
        <p className="cs-body">{t(lang, "comingSoonBody")}</p>
        <ul className="cs-feats">
          <li>{t(lang, "lpFeatTrack")}</li>
          <li>{t(lang, "lpFeatAlerts")}</li>
          <li>{t(lang, "lpFeatReports")}</li>
        </ul>
      </main>
      <footer className="cs-foot">
        © {new Date().getFullYear()} {t(lang, "brand")} {t(lang, "footRights")}
      </footer>
    </div>
  );
}
