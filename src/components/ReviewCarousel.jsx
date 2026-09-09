import { useEffect, useRef, useState } from "react";
import { reviewsApi } from "../api";
import { t } from "../i18n";
import { useLang } from "../context/LangContext";
import ReviewCard from "./ReviewCard";

export default function ReviewCarousel() {
  const { lang } = useLang();
  const [payload, setPayload] = useState(null);
  const [slide, setSlide] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [perPage, setPerPage] = useState(3);
  const [hovered, setHovered] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const jumpFrame = useRef(0);

  useEffect(() => {
    let live = true;
    reviewsApi.list().then((data) => {
      if (live) setPayload(data);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 640px)");
    const tablet = window.matchMedia("(max-width: 1100px)");
    const apply = () => {
      if (compact.matches) setPerPage(1);
      else if (tablet.matches) setPerPage(2);
      else setPerPage(3);
    };
    apply();
    compact.addEventListener("change", apply);
    tablet.addEventListener("change", apply);
    return () => {
      compact.removeEventListener("change", apply);
      tablet.removeEventListener("change", apply);
    };
  }, []);

  const total = payload ? payload.items.length : 0;
  const pages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    setSlide(0);
    setAnimate(true);
  }, [perPage, total]);

  useEffect(() => {
    if (hovered || tabHidden || pages < 2) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = window.setInterval(goNext, 5000);
    return () => window.clearInterval(id);
  }, [hovered, tabHidden, pages]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => () => window.cancelAnimationFrame(jumpFrame.current), []);

  function goTo(next) {
    setAnimate(true);
    setSlide(next);
  }

  function goNext() {
    setAnimate(true);
    setSlide((n) => (n >= pages ? 1 : n + 1));
  }

  /**
   * Going back from the first page would slide the wrong way, so land on the
   * trailing clone without animating and glide left from there on the next frame.
   */
  function goPrev() {
    if (slide > 0) {
      goTo(slide - 1);
      return;
    }
    setAnimate(false);
    setSlide(pages);
    jumpFrame.current = window.requestAnimationFrame(() => {
      jumpFrame.current = window.requestAnimationFrame(() => goTo(pages - 1));
    });
  }

  /** The trailing clone matches the first page, so swap to it once it is in view. */
  function handleTransitionEnd(event) {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
    if (slide < pages) return;
    setAnimate(false);
    setSlide(0);
  }

  if (!payload) {
    return <p className="lp-reviews-status">{t(lang, "loading")}</p>;
  }

  const items = payload.items;
  if (!items.length) return null;

  const count = total;
  const pageCount = pages;
  const page = slide % pageCount;
  const pageItems = (n) =>
    Array.from({ length: Math.min(perPage, count) }, (_, i) => items[(n * perPage + i) % count]);
  const slides = Array.from({ length: pageCount }, (_, n) => pageItems(n));
  if (pageCount > 1) slides.push(pageItems(0));

  return (
    <div
      className="lp-reviews-wrap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div className="lp-reviews-rating">
        <span>{payload.averageRating.toFixed(1)}/5</span>
        <Stars value={Math.round(payload.averageRating)} />
      </div>
      <div className="lp-reviews-row">
        {count > perPage ? (
          <button
            type="button"
            className="lp-reviews-arrow"
            aria-label="Previous reviews"
            onClick={goPrev}
          >
            ‹
          </button>
        ) : null}
        <div className="lp-reviews-viewport">
          <div
            className={`lp-reviews-track${animate ? " is-animating" : ""}`}
            style={{ transform: `translate3d(-${slide * 100}%, 0, 0)` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {slides.map((group, n) => (
              <div className="lp-reviews-page" key={n} aria-hidden={n !== slide}>
                <div className="lp-reviews-grid">
                  {group.map((item, i) => (
                    <ReviewCard key={`${item.id}-${n}-${i}`} review={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {count > perPage ? (
          <button
            type="button"
            className="lp-reviews-arrow"
            aria-label="Next reviews"
            onClick={goNext}
          >
            ›
          </button>
        ) : null}
      </div>
      {pageCount > 1 ? (
        <div className="lp-reviews-dots">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`lp-carousel-dot${i === page ? " on" : ""}`}
              aria-label={`Reviews page ${i + 1}`}
              aria-current={i === page}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Stars({ value }) {
  return (
    <span className="lp-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < value ? "on" : ""}>
          ★
        </span>
      ))}
    </span>
  );
}
