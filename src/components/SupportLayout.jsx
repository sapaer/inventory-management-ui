import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import "../pages/Landing.css";
import "../pages/Support.css";

export default function SupportLayout({ title, lead, art, children, className = "" }) {
  return (
    <div className={`lp support-page${className ? ` ${className}` : ""}`}>
      <SiteHeader sticky />
      <main className="support-main">
        {title || lead || art ? (
          <header className="support-hero">
            <div className="support-hero-copy">
              {title ? <h1>{title}</h1> : null}
              {lead ? <p>{lead}</p> : null}
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
  );
}
