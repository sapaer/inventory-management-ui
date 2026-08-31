import { useEffect, useState } from "react";
import { reviewsApi } from "../api";
import { t } from "../i18n";
import { useLang } from "../context/LangContext";
import ReviewCard from "./ReviewCard";

export default function ReviewCarousel() {
  const { lang } = useLang();
  const [payload, setPayload] = useState(null);
  const [index, setIndex] = useState(0);
  const [perPage, setPerPage] = useState(3);

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
    const mq = window.matchMedia("(max-width: 820px)");
    const apply = () => setPerPage(mq.matches ? 1 : 3);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (!payload) {
    return <p className="lp-reviews-status">{t(lang, "loading")}</p>;
  }

  const items = payload.items;
  if (!items.length) return null;

  const count = items.length;
  const pageCount = Math.max(1, Math.ceil(count / perPage));
  const page = ((index % pageCount) + pageCount) % pageCount;
  const start = page * perPage;
  const visible = Array.from({ length: Math.min(perPage, count) }, (_, i) => items[(start + i) % count]);

  return (
    <div className="lp-reviews-wrap">
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
            onClick={() => setIndex((n) => n - 1)}
          >
            ‹
          </button>
        ) : null}
        <div className="lp-reviews-grid">
          {visible.map((item) => (
            <ReviewCard key={`${item.id}-${page}`} review={item} />
          ))}
        </div>
        {count > perPage ? (
          <button
            type="button"
            className="lp-reviews-arrow"
            aria-label="Next reviews"
            onClick={() => setIndex((n) => n + 1)}
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
              onClick={() => setIndex(i)}
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
