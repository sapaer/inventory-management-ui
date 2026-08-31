/** Dummy payload until GET /api/v1/public/reviews exists on the Java API. */
export const DUMMY_REVIEWS = {
  averageRating: 4.8,
  items: [
    {
      id: "r1",
      rating: 5,
      quote: "Finally, a system that fits our shop. Stock ka hisaab rakhna ab bahut easy hai.",
      authorName: "Arun Singh",
      authorTitle: "Auto parts · Indore",
      avatarUrl: "https://i.pravatar.cc/96?img=12",
    },
    {
      id: "r2",
      rating: 5,
      quote: "WhatsApp alerts save me from missed orders. Customers are happier now.",
      authorName: "Meera Patel",
      authorTitle: "Auto parts · Indore",
      avatarUrl: "https://i.pravatar.cc/96?img=32",
    },
    {
      id: "r3",
      rating: 5,
      quote: "Low-stock reports help me plan better. No more last-minute stockouts.",
      authorName: "Ramesh",
      authorTitle: "Auto parts · Indore",
      avatarUrl: "https://i.pravatar.cc/96?img=53",
    },
    {
      id: "r4",
      rating: 5,
      quote: "Setup took one evening. The team updates quantity without leaving the counter.",
      authorName: "Kavita",
      authorTitle: "Service center · Pune",
      avatarUrl: "https://i.pravatar.cc/96?img=47",
    },
    {
      id: "r5",
      rating: 4,
      quote: "We listed fast movers first. Alerts reach the person who actually buys parts.",
      authorName: "Sanjay Verma",
      authorTitle: "Garage · Jaipur",
      avatarUrl: "https://i.pravatar.cc/96?img=15",
    },
    {
      id: "r6",
      rating: 5,
      quote: "Catalog used to live in a notebook. Now every part has a count we can trust.",
      authorName: "Farhan Ali",
      authorTitle: "Spare shop · Lucknow",
      avatarUrl: "https://i.pravatar.cc/96?img=68",
    },
  ],
};

export function normalizeReviews(data) {
  const raw = data?.items || data?.reviews || (Array.isArray(data) ? data : []);
  const items = raw
    .map((row, i) => ({
      id: String(row.id ?? `r${i}`),
      rating: Math.max(1, Math.min(5, Number(row.rating) || 5)),
      quote: String(row.quote || row.comment || row.body || "").trim(),
      authorName: String(row.authorName || row.userName || row.name || "Shopkeeper"),
      authorTitle: String(row.authorTitle || row.shop || row.location || ""),
      avatarUrl: row.avatarUrl || row.authorAvatarUrl || "",
    }))
    .filter((row) => row.quote);
  const avg =
    data?.averageRating != null
      ? Number(data.averageRating)
      : items.length
        ? items.reduce((s, r) => s + r.rating, 0) / items.length
        : 0;
  return { averageRating: Math.round(avg * 10) / 10, items };
}
