const DEV_BYPASS_KEY = "pn_dev_bypass";
const DEV_USER_KEY = "pn_dev_user";

/** True only under `vite` / `npm run dev` — never in production builds. */
export function isDevAuthBypassEnabled() {
  return import.meta.env.DEV === true;
}

export function isDevBypassSession() {
  return isDevAuthBypassEnabled() && localStorage.getItem(DEV_BYPASS_KEY) === "1";
}

export function readDevBypassUser() {
  if (!isDevBypassSession()) return null;
  try {
    const raw = localStorage.getItem(DEV_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeDevBypassSession(user) {
  localStorage.setItem(DEV_BYPASS_KEY, "1");
  localStorage.setItem(DEV_USER_KEY, JSON.stringify(user));
}

export function clearDevBypassSession() {
  localStorage.removeItem(DEV_BYPASS_KEY);
  localStorage.removeItem(DEV_USER_KEY);
}

export function buildDevBypassUser(phone) {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    phone: phone || "9999999999",
    name: "Local Dev",
    shopName: "Dev Spare Shop",
    email: null,
    businessType: "RETAILER",
    onboardingStatus: "PROFILED",
    address: null,
    area: null,
    city: null,
    state: null,
    pincode: null,
    geoLat: null,
    geoLng: null,
    vehicleCategories: ["TWO_WHEELER"],
  };
}
