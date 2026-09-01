export default function ReviewCard({ review }) {
  const initials = review.authorName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <article className="lp-review-card">
      <div className="lp-review-quote-mark" aria-hidden="true">
        ”
      </div>
      <div className="lp-stars lp-stars-sm" aria-label={`${review.rating} out of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < review.rating ? "on" : ""}>
            ★
          </span>
        ))}
      </div>
      <p className="lp-review-quote">{review.quote}</p>
      <div className="lp-review-author">
        {review.avatarUrl ? (
          <img src={review.avatarUrl} alt="" className="lp-review-avatar" />
        ) : (
          <span className="lp-review-avatar lp-review-avatar-fallback">{initials || "?"}</span>
        )}
        <div>
          <strong>{review.authorName}</strong>
          {review.authorTitle ? <span>{review.authorTitle}</span> : null}
        </div>
      </div>
    </article>
  );
}
