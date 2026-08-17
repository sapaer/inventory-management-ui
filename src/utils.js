export function formatPrice(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
}

export function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday - startThat) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-IN", { weekday: "short" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function initials(name) {
  if (!name) return "PN";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "PN";
}

export function stockOf(item) {
  if (!item) return "IN_STOCK";
  if (item.stockStatus) return item.stockStatus;
  const qty = Number(item.quantity) || 0;
  const min = Number(item.minQuantity) || 0;
  if (qty === 0) return "OUT_OF_STOCK";
  if (qty <= min) return "LOW_STOCK";
  return "IN_STOCK";
}

export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone || "");
}

export function needsShopSetup(user) {
  if (!user) return false;
  if (user.onboardingStatus === "REGISTERED") return true;
  return !String(user.name || "").trim() || !String(user.shopName || "").trim();
}

export function locationLabel(loc) {
  if (!loc) return "";
  const areaCity = [loc.area, loc.city].filter(Boolean).join(", ");
  return areaCity || loc.address || "";
}

function howToStorageKey(user) {
  const phone = user?.phone ? String(user.phone) : "guest";
  return `pn_howto_seen_${phone}`;
}

/** One-time “How to use” for guests and new users who still need shop setup. */
export function hasSeenHowTo(user) {
  try {
    return localStorage.getItem(howToStorageKey(user)) === "1";
  } catch {
    return false;
  }
}

export function markHowToSeen(user) {
  try {
    localStorage.setItem(howToStorageKey(user), "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function shouldShowHowTo(user) {
  if (hasSeenHowTo(user)) return false;
  // Existing users with a complete shop profile skip the landing how-to.
  if (user && !needsShopSetup(user)) {
    markHowToSeen(user);
    return false;
  }
  return true;
}

function tourStorageKey(user) {
  const phone = user?.phone ? String(user.phone) : "guest";
  return `pn_tour_seen_${phone}`;
}

export function hasSeenTour(user) {
  try {
    return localStorage.getItem(tourStorageKey(user)) === "1";
  } catch {
    return false;
  }
}

export function markTourSeen(user) {
  try {
    localStorage.setItem(tourStorageKey(user), "1");
  } catch {
    /* ignore */
  }
}

/** New users only: once after shop setup, until Skip/Done. */
export function shouldStartTour(user) {
  if (!user || needsShopSetup(user)) return false;
  return !hasSeenTour(user);
}
