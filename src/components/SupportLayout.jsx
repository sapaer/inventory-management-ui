import { useAuth } from "../context/AuthContext";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import "../pages/Landing.css";
import "../pages/Support.css";

export default function SupportLayout({ title, lead, art, extra, children, className = "" }) {
  const { user } = useAuth();

  return (
    <div className={`lp support-page${user ? " is-authed" : " is-guest"}${className ? ` ${className}` : ""}`}>
      <SiteHeader sticky />
      <div className="lp-scroll">
        <main className="support-main">
          {title || lead || art || extra ? (
            <header className="support-hero">
              <div className="support-hero-copy">
                {title ? <h1>{title}</h1> : null}
                {lead ? <p>{lead}</p> : null}
                {extra ? <div className="support-hero-extra">{extra}</div> : null}
              </div>
              {art ? (
                <div className="support-hero-art" aria-hidden="true">
                  {art}
                </div>
              ) : null}
            </header>
          ) : null}

          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
