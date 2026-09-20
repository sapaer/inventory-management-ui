/**
 * Pre-launch "Coming soon" gate. Production builds show the Coming Soon page
 * on every route by default; local dev (npm run dev) is unaffected. Set
 * VITE_COMING_SOON explicitly to override either way — "false" in Vercel opens
 * the site at launch, "true" locally previews the gate. Team members open
 * /team once (add ?key=… when VITE_TEAM_KEY is set) to flag their browser and
 * use the app normally.
 *
 * This only hides the UI — the API itself is locked by the backend's
 * LAUNCH_ALLOWLIST, so someone who bypasses the page still can't sign in.
 */
const KEY = "pn_team";

const FLAG = import.meta.env.VITE_COMING_SOON;
// Unset → on for production builds only. Defaulting on (instead of requiring
// the variable) means a missing Vercel env var can't leave the site open.
export const COMING_SOON = FLAG ? FLAG === "true" : import.meta.env.PROD;

function hasTeamAccess() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function gateActive() {
  return COMING_SOON && !hasTeamAccess();
}

/** Returns true when access was granted (wrong key → false). */
export function grantTeamAccess(key) {
  const required = import.meta.env.VITE_TEAM_KEY;
  if (required && key !== required) return false;
  try {
    localStorage.setItem(KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function revokeTeamAccess() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
