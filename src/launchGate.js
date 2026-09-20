/**
 * Pre-launch "Coming soon" gate. Build the app with VITE_COMING_SOON=true
 * (Vercel → Environment Variables → Production) and every route shows the
 * Coming Soon page. Team members open /team once (add ?key=… when
 * VITE_TEAM_KEY is set) to flag their browser and use the app normally.
 *
 * This only hides the UI — the API itself is locked by the backend's
 * LAUNCH_ALLOWLIST, so someone who bypasses the page still can't sign in.
 */
const KEY = "pn_team";

export const COMING_SOON = import.meta.env.VITE_COMING_SOON === "true";

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
