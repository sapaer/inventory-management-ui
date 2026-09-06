import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ReviewCarousel from "../components/ReviewCarousel";
import InventoryPreview from "../components/InventoryPreview";
import { t } from "../i18n";
import { needsShopSetup } from "../utils";
import "./Landing.css";

/** Closing PartNear hero is parked for now — flip to true to bring it back. */
const SHOW_CLOSING_HERO = false;

export default function Landing() {
  const { user } = useAuth();
  const { lang } = useLang();
  const dashboardTo = user && needsShopSetup(user) ? "/setup" : "/dashboard";

  return (
    <div className="lp">
      <SiteHeader sticky />

      <section className="lp-preview" id="preview">
        <div className="lp-preview-bg" aria-hidden="true">
          <div className="lp-hero-grid" />
          <div className="lp-hero-glow" />
        </div>
        <div className="lp-preview-inner">
          <div className="lp-preview-copy">
            <p className="lp-brand-mark notranslate" translate="no">
              {t(lang, "brand")}
            </p>
            <h1 className="lp-hero-title">{t(lang, "heroTitle")}</h1>
            <p className="lp-hero-sub">{t(lang, "heroSub")}</p>
            <div className="lp-hero-ctas">
              <Link to={user ? dashboardTo : "/auth?mode=signup"} className="lp-btn lp-btn-primary">
                {user ? t(lang, "lpGoDashboard") : t(lang, "lpSignUp")}
              </Link>
              {!user ? (
                <Link to="/auth?mode=login" className="lp-btn lp-btn-ghost">
                  {t(lang, "lpLogin")}
                </Link>
              ) : null}
            </div>
            <ul className="lp-preview-feats">
              <li>
                <BoxFeatIcon />
                {t(lang, "lpFeatTrack")}
              </li>
              <li>
                <WaFeatIcon />
                {t(lang, "lpFeatAlerts")}
              </li>
              <li>
                <ClipFeatIcon />
                {t(lang, "lpFeatReports")}
              </li>
            </ul>
          </div>
          <InventoryPreview />
        </div>
      </section>

      <section className="lp-section lp-product" id="product">
        <p className="lp-kicker">{t(lang, "lpValueKicker")}</p>
        <h2 className="lp-section-title">{t(lang, "lpValueTitle")}</h2>
        <p className="lp-section-body">{t(lang, "lpValueBody")}</p>
        <ul className="lp-value-list">
          {VALUE_ITEMS.map(({ id, Icon }) => (
            <li key={id} className="lp-value-card">
              <span className="lp-value-ic" aria-hidden="true">
                <Icon />
              </span>
              <div className="lp-value-copy">
                <strong>{t(lang, `${id}Title`)}</strong>
                <span>{t(lang, `${id}Body`)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="lp-band lp-reviews" id="reviews">
        <div className="lp-reviews-inner">
          <p className="lp-kicker">{t(lang, "lpReviewsKicker")}</p>
          <h2 className="lp-section-title">{t(lang, "lpReviewsTitle")}</h2>
          <ReviewCarousel />
        </div>
      </section>

      <section className="lp-about-close" id="about-close">
        <div className="lp-hero-bg" aria-hidden="true">
          <div className="lp-hero-grid" />
          <div className="lp-hero-glow" />
        </div>
        <div className="lp-about-close-inner">
          <p className="lp-kicker lp-kicker-line">{t(lang, "lpNavAbout")}</p>
          <h2 className="lp-section-title">{t(lang, "lpAboutCounter")}</h2>
          <div className="lp-about-grid">
            <article className="lp-about-card">
              <h3>{t(lang, "lpWhatWeDo")}</h3>
              <p>{t(lang, "lpWhatWeDoBody")}</p>
            </article>
            <article className="lp-about-card">
              <h3>{t(lang, "lpOurVision")}</h3>
              <p>{t(lang, "lpOurVisionBody")}</p>
            </article>
            <article className="lp-about-card">
              <h3>{t(lang, "lpOurMission")}</h3>
              <p>{t(lang, "lpOurMissionBody")}</p>
            </article>
          </div>
        </div>
      </section>

      {SHOW_CLOSING_HERO ? (
      <section className="lp-hero" id="top">
        <div className="lp-hero-bg" aria-hidden="true">
          <div className="lp-hero-grid" />
          <div className="lp-hero-glow" />
          <svg className="lp-hero-art" viewBox="0 0 960 640" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="80" y="90" width="360" height="460" rx="4" stroke="currentColor" strokeOpacity="0.35" />
            <rect x="110" y="130" width="120" height="70" rx="2" fill="currentColor" fillOpacity="0.12" />
            <rect x="250" y="130" width="150" height="70" rx="2" fill="currentColor" fillOpacity="0.08" />
            <rect x="110" y="220" width="290" height="18" rx="2" fill="currentColor" fillOpacity="0.18" />
            <rect x="110" y="260" width="220" height="18" rx="2" fill="currentColor" fillOpacity="0.12" />
            <rect x="110" y="300" width="260" height="18" rx="2" fill="currentColor" fillOpacity="0.1" />
            <rect x="110" y="360" width="140" height="120" rx="3" stroke="currentColor" strokeOpacity="0.4" />
            <rect x="270" y="360" width="140" height="120" rx="3" stroke="currentColor" strokeOpacity="0.28" />
            <path d="M520 140h280v40H520zM520 210h200v28H520zM520 270h240v28H520z" fill="currentColor" fillOpacity="0.14" />
            <circle cx="700" cy="420" r="90" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
            <circle cx="700" cy="420" r="48" stroke="currentColor" strokeOpacity="0.4" strokeWidth="3" />
            <path d="M700 340v160M620 420h160" stroke="currentColor" strokeOpacity="0.2" />
          </svg>
        </div>
        <div className="lp-hero-copy">
          <p className="lp-brand-mark">{t(lang, "brand")}</p>
          <h2 className="lp-hero-title">{t(lang, "heroTitle")}</h2>
          <p className="lp-hero-sub">{t(lang, "heroSub")}</p>
          {!user ? (
            <div className="lp-hero-ctas">
              <Link to="/auth?mode=signup" className="lp-btn lp-btn-primary">
                {t(lang, "lpSignUp")}
              </Link>
              <Link to="/auth?mode=login" className="lp-btn lp-btn-ghost">
                {t(lang, "lpLogin")}
              </Link>
            </div>
          ) : null}
        </div>
      </section>
      ) : null}

      <SiteFooter />
    </div>
  );
}

function CountIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function TapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function ShopsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3.5 9.5 5 4h14l1.5 5.5a3 3 0 0 1-5.7 1.6 3 3 0 0 1-5.6 0 3 3 0 0 1-5.7-1.6z" />
      <path d="M5 11v9h14v-9M10 20v-5h4v5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  );
}

const VALUE_ITEMS = [
  { id: "lpValue1", Icon: CountIcon },
  { id: "lpValue2", Icon: AlertIcon },
  { id: "lpValue3", Icon: TapIcon },
  { id: "lpValue4", Icon: ListIcon },
  { id: "lpValue5", Icon: ShopsIcon },
  { id: "lpValue6", Icon: PhoneIcon },
];

function BoxFeatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}

function WaFeatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 11.5A8.5 8.5 0 0 1 7.3 19.1L4 20l1-3.2A8.5 8.5 0 1 1 20 11.5z" />
    </svg>
  );
}

function ClipFeatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  );
}

