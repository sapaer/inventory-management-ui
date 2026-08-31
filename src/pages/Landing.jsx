import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import BrandLogo from "../components/BrandLogo";
import Carousel from "../components/Carousel";
import LangSelect from "../components/LangSelect";
import UserMenu from "../components/UserMenu";
import SiteFooter from "../components/SiteFooter";
import ReviewCarousel from "../components/ReviewCarousel";
import InventoryPreview from "../components/InventoryPreview";
import { t } from "../i18n";
import { SUPPORT } from "../support";
import { needsShopSetup, shouldShowHowTo, markHowToSeen } from "../utils";
import "./Landing.css";

export default function Landing() {
  const { user, ready } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const dashboardTo = user && needsShopSetup(user) ? "/setup" : "/dashboard";
  const [showHomeTip, setShowHomeTip] = useState(false);
  const [showHowTo, setShowHowTo] = useState(() => shouldShowHowTo(user));

  useEffect(() => {
    setShowHowTo(shouldShowHowTo(user));
  }, [user]);

  function dismissHowTo() {
    markHowToSeen(user);
    setShowHowTo(false);
  }

  function continueFromHowTo() {
    dismissHowTo();
    nav(user ? dashboardTo : "/login");
  }

  const audienceSlides = useMemo(
    () => [
      { id: "buyer", title: t(lang, "lpBuyerTitle"), body: t(lang, "lpBuyerBody") },
      { id: "seller", title: t(lang, "lpSellerTitle"), body: t(lang, "lpSellerBody") },
      { id: "business", title: t(lang, "lpBusinessTitle"), body: t(lang, "lpBusinessBody") },
    ],
    [lang]
  );

  const storiesSlides = useMemo(
    () => [
      {
        id: "vision",
        eyebrow: t(lang, "lpNavVision"),
        title: t(lang, "lpVisionTitle"),
        body: t(lang, "lpVisionBody"),
      },
      {
        id: "blog1",
        eyebrow: t(lang, "lpBlogLabel"),
        title: t(lang, "lpBlog1Title"),
        body: t(lang, "lpBlog1Body"),
        meta: t(lang, "lpBlog1Meta"),
      },
      {
        id: "blog2",
        eyebrow: t(lang, "lpBlogLabel"),
        title: t(lang, "lpBlog2Title"),
        body: t(lang, "lpBlog2Body"),
        meta: t(lang, "lpBlog2Meta"),
      },
    ],
    [lang]
  );

  useEffect(() => {
    if (!ready || !user) {
      setShowHomeTip(false);
      return;
    }
    const showId = setTimeout(() => setShowHomeTip(true), 500);
    return () => clearTimeout(showId);
  }, [ready, user]);

  useEffect(() => {
    if (!showHomeTip) return;
    function dismiss() {
      setShowHomeTip(false);
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  }, [showHomeTip]);

  return (
    <div className="lp">
      <header className="lp-nav">
        <BrandLogo className="lp-nav-brand" />
        <nav className="lp-nav-links" aria-label="Page">
          <a href="#about">{t(lang, "lpNavAbout")}</a>
          <a href="#reviews">{t(lang, "lpNavReviews")}</a>
          <a href="#support">{t(lang, "lpNavSupport")}</a>
        </nav>
        <div className="lp-nav-actions">
          <LangSelect />
          {ready && user ? (
            <>
              <div className="lp-nav-home-wrap">
                <Link to={dashboardTo} className="lp-nav-home" aria-label={t(lang, "home")}>
                  <HomeIcon />
                  <span>{t(lang, "home")}</span>
                </Link>
                {showHomeTip ? (
                  <div className="lp-home-tip" role="status">
                    {t(lang, "lpHomeTip")}
                  </div>
                ) : null}
              </div>
              <UserMenu variant="landing" />
            </>
          ) : ready ? (
            <>
              <Link to="/login" className="lp-nav-login">
                {t(lang, "lpLogin")}
              </Link>
              <Link to="/login" className="lp-nav-cta">
                {t(lang, "lpSignUp")}
              </Link>
            </>
          ) : null}
        </div>
      </header>

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
          <h1 className="lp-hero-title">{t(lang, "heroTitle")}</h1>
          <p className="lp-hero-sub">{t(lang, "heroSub")}</p>
          {!user ? (
            <div className="lp-hero-ctas">
              <Link to="/login" className="lp-btn lp-btn-primary">
                {t(lang, "lpSignUp")}
              </Link>
              <Link to="/login" className="lp-btn lp-btn-ghost">
                {t(lang, "lpLogin")}
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="lp-preview" id="preview">
        <div className="lp-preview-bg" aria-hidden="true">
          <div className="lp-hero-grid" />
          <div className="lp-hero-glow" />
        </div>
        <div className="lp-preview-inner">
          <div className="lp-preview-copy">
            <p className="lp-hero-badge">{t(lang, "lpHeroBadge")}</p>
            <h2 className="lp-preview-title">{t(lang, "heroTitle")}</h2>
            <p className="lp-preview-sub">{t(lang, "lpPrevSub")}</p>
            <div className="lp-hero-ctas">
              <Link to={user ? dashboardTo : "/login"} className="lp-btn lp-btn-primary">
                {user ? t(lang, "lpGoDashboard") : t(lang, "lpSignUp")}
              </Link>
              {!user ? (
                <Link to="/login" className="lp-btn lp-btn-ghost">
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

      <section className="lp-section lp-about" id="about">
        <p className="lp-kicker">{t(lang, "lpNavAbout")}</p>
        <h2 className="lp-section-title">{t(lang, "lpAboutTitle")}</h2>
        <p className="lp-section-body">{t(lang, "lpAboutBody")}</p>
      </section>

      <section className="lp-section lp-product" id="product">
        <p className="lp-kicker">{t(lang, "lpNavProduct")}</p>
        <h2 className="lp-section-title">{t(lang, "lpProductTitle")}</h2>
        <p className="lp-section-body">{t(lang, "lpProductBody")}</p>
        <ul className="lp-product-list">
          <li>
            <strong>{t(lang, "benefit1")}</strong>
            <span>{t(lang, "benefit1s")}</span>
          </li>
          <li>
            <strong>{t(lang, "benefit2")}</strong>
            <span>{t(lang, "benefit2s")}</span>
          </li>
          <li>
            <strong>{t(lang, "benefit3")}</strong>
            <span>{t(lang, "benefit3s")}</span>
          </li>
        </ul>
      </section>

      {showHowTo ? (
        <section className="lp-section lp-how" id="how">
          <p className="lp-kicker">{t(lang, "lpHowKicker")}</p>
          <h2 className="lp-section-title">{t(lang, "lpHowTitle")}</h2>
          <p className="lp-section-body">{t(lang, "lpHowBody")}</p>
          <ol className="lp-how-list">
            {[1, 2, 3, 4, 5].map((n) => (
              <li key={n}>
                <span className="lp-how-num" aria-hidden="true">
                  {n}
                </span>
                <div>
                  <strong>{t(lang, `lpHow${n}Title`)}</strong>
                  <span>{t(lang, `lpHow${n}Body`)}</span>
                </div>
              </li>
            ))}
          </ol>
          <div className="lp-hero-ctas lp-how-cta">
            <button type="button" className="lp-btn lp-btn-primary" onClick={continueFromHowTo}>
              {user ? t(lang, "lpGoDashboard") : t(lang, "lpGetStarted")}
            </button>
            <button type="button" className="lp-btn lp-btn-ghost" onClick={dismissHowTo}>
              {t(lang, "lpHowGotIt")}
            </button>
          </div>
        </section>
      ) : null}

      <section className="lp-band lp-audience" id="audience">
        <div className="lp-band-inner">
          <p className="lp-kicker">{t(lang, "lpAudienceKicker")}</p>
          <h2 className="lp-section-title">{t(lang, "lpAudienceTitle")}</h2>
          <Carousel slides={audienceSlides} />
        </div>
      </section>

      <section className="lp-band lp-stories" id="stories">
        <div className="lp-band-inner">
          <p className="lp-kicker">{t(lang, "lpStoriesKicker")}</p>
          <h2 className="lp-section-title">{t(lang, "lpStoriesTitle")}</h2>
          <Carousel slides={storiesSlides} className="lp-carousel-dark" />
          {!user ? (
            <div className="lp-hero-ctas lp-stories-cta">
              <Link to="/login" className="lp-btn lp-btn-primary">
                {t(lang, "lpSignUp")}
              </Link>
              <Link to="/login" className="lp-btn lp-btn-ghost">
                {t(lang, "lpLogin")}
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="lp-band lp-reviews" id="reviews">
        <div className="lp-reviews-inner">
          <p className="lp-kicker">{t(lang, "lpReviewsKicker")}</p>
          <h2 className="lp-section-title">{t(lang, "lpReviewsTitle")}</h2>
          <ReviewCarousel />
        </div>
      </section>

      <section className="lp-band lp-support" id="support">
        <div className="lp-reviews-inner">
          <p className="lp-kicker">{t(lang, "lpSupportKicker")}</p>
          <h2 className="lp-section-title">{t(lang, "lpSupportTitle")}</h2>
          <div className="lp-support-row">
            <a
              className="lp-support-card"
              href={`https://wa.me/${SUPPORT.whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="lp-support-ic" aria-hidden="true">
                <WhatsAppIcon />
              </span>
              <span className="lp-support-copy">
                <strong>{t(lang, "lpWhatsAppSupport")}</strong>
              </span>
              <span className="lp-support-arrow" aria-hidden="true">
                →
              </span>
            </a>
            <a className="lp-support-card" href={`mailto:${SUPPORT.email}`}>
              <span className="lp-support-ic" aria-hidden="true">
                <MailIcon />
              </span>
              <span className="lp-support-copy">
                <strong>{t(lang, "email")}</strong>
                <em>{SUPPORT.email}</em>
              </span>
              <span className="lp-support-arrow" aria-hidden="true">
                →
              </span>
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 11.5A8.5 8.5 0 0 1 7.3 19.1L4 20l1-3.2A8.5 8.5 0 1 1 20 11.5zm-8.5 6.7c1.4 0 2.7-.4 3.8-1.1l.3-.2 2.2.6-.6-2.1.2-.3a6.3 6.3 0 1 0-5.9 3.1zm3.5-4.6c-.2-.1-1.1-.5-1.3-.6s-.3-.1-.4.1l-.4.5c-.1.1-.3.2-.5.1s-1-.4-1.9-1.2c-.7-.6-1.2-1.4-1.3-1.6s0-.4.1-.5l.3-.4.1-.2c0-.1 0-.2-.1-.3l-.6-1.4c-.2-.4-.3-.3-.4-.3h-.4c-.1 0-.3.1-.5.3s-.6.6-.6 1.5.6 1.7.7 1.8c.1.2 1.2 1.9 3 2.6 1.8.7 1.8.5 2.1.5.3 0 1.1-.4 1.2-.9.1-.4.1-.8.1-.9 0 0-.2-.1-.4-.2z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

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

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  );
}
