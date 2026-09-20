import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { grantTeamAccess, revokeTeamAccess } from "../launchGate";
import ComingSoon from "./ComingSoon";

/** Unadvertised entry for the team: /team?key=… unlocks the app in this browser, /team?off locks it again. */
export default function TeamEntry() {
  const [params] = useSearchParams();
  const off = params.has("off");
  const granted = !off && grantTeamAccess(params.get("key") || "");

  useEffect(() => {
    if (off) revokeTeamAccess();
    // Full reload so the gate is re-evaluated from scratch.
    if (off || granted) window.location.replace("/");
  }, [off, granted]);

  return off || granted ? null : <ComingSoon />;
}
