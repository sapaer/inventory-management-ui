import { useEffect, useState } from "react";

export default function Carousel({ slides, intervalMs = 5500, className = "" }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    setIndex(0);
  }, [slides]);

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs, index]);

  if (!count) return null;

  const safeIndex = ((index % count) + count) % count;
  const slide = slides[safeIndex];

  return (
    <div className={`lp-carousel ${className}`.trim()}>
      <div className="lp-carousel-stage" key={slide.id || safeIndex}>
        {slide.eyebrow ? <p className="lp-carousel-eye">{slide.eyebrow}</p> : null}
        <h3 className="lp-carousel-title">{slide.title}</h3>
        <p className="lp-carousel-body">{slide.body}</p>
        {slide.meta ? <p className="lp-carousel-meta">{slide.meta}</p> : null}
      </div>
      {count > 1 ? (
        <div className="lp-carousel-nav">
          <button
            type="button"
            className="lp-carousel-arrow"
            aria-label="Previous"
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
          >
            ‹
          </button>
          <div className="lp-carousel-dots">
            {slides.map((s, i) => (
              <button
                key={s.id || i}
                type="button"
                className={`lp-carousel-dot${i === safeIndex ? " on" : ""}`}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === safeIndex}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="lp-carousel-arrow"
            aria-label="Next"
            onClick={() => setIndex((i) => (i + 1) % count)}
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
