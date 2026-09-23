import { Link } from "react-router-dom";
import SupportLayout from "../components/SupportLayout";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";

const QUICK = [
  { to: "/help/faqs", title: "faqs", body: "helpQuickFaqBody", Icon: ChatIcon },
  { to: "/contact", title: "contactSupport", body: "helpQuickContactBody", Icon: HeadsetIcon },
  { to: "/terms", title: "terms", body: "helpQuickTermsBody", Icon: DocIcon },
];

export default function Help() {
  const { lang } = useLang();

  return (
    <SupportLayout title={t(lang, "helpTitle")} art={<HelpArt />}>
      <section className="support-block">
        <h2>{t(lang, "helpQuick")}</h2>
        <div className="support-links">
          {QUICK.map(({ to, title, body, Icon }) => (
            <Link key={title} to={to} className="support-link-row">
              <span className="support-link-ic">
                <Icon />
              </span>
              <span>
                <strong>{t(lang, title)}</strong>
                <span>{t(lang, body)}</span>
              </span>
              <span className="support-topic-go" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="support-assist">
        <div className="support-assist-copy">
          <span className="support-assist-ic">
            <HeadsetIcon />
          </span>
          <div>
            <strong>{t(lang, "helpStillStuck")}</strong>
            <span>{t(lang, "helpAssistBody")}</span>
          </div>
        </div>
        <Link to="/contact" className="support-assist-btn">
          {t(lang, "contactSupport")}
        </Link>
      </section>
    </SupportLayout>
  );
}

// One card + one overlapping badge, same recipe as FaqArt/TermsArt — the
// card's three dot-and-line rows echo the page's own "Quick links" list, and
// the badge reuses Contact's headset glyph, pointing at where "further
// assistance" leads.
function HelpArt() {
  return (
    <svg viewBox="0 0 220 160" fill="none">
      <rect x="20" y="20" width="148" height="120" rx="14" fill="#e8f4ee" />
      <circle cx="40" cy="46" r="8" fill="#145c45" />
      <rect x="56" y="41" width="96" height="10" rx="5" fill="#9cc9b4" />
      <circle cx="40" cy="78" r="8" fill="#145c45" />
      <rect x="56" y="73" width="80" height="10" rx="5" fill="#9cc9b4" />
      <circle cx="40" cy="110" r="8" fill="#145c45" />
      <rect x="56" y="105" width="88" height="10" rx="5" fill="#9cc9b4" />
      <circle cx="168" cy="118" r="24" fill="#145c45" />
      <g transform="translate(155.5, 106)" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
        <path d="M4.5 12a7.5 7.5 0 0 1 15 0" />
        <rect x="2.5" y="12" width="5" height="7" rx="2" />
        <rect x="16.5" y="12" width="5" height="7" rx="2" />
        <path d="M20 19v.5a3.5 3.5 0 0 1-3.5 3.5H13" />
      </g>
    </svg>
  );
}

function Icon({ children }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function ChatIcon() {
  return (
    <Icon>
      <path d="M7 18.5 3.5 21V8.5A4.5 4.5 0 0 1 8 4h8a4.5 4.5 0 0 1 4.5 4.5v5A4.5 4.5 0 0 1 16 18H7z" />
    </Icon>
  );
}

function HeadsetIcon() {
  return (
    <Icon>
      <path d="M4.5 13a7.5 7.5 0 0 1 15 0" />
      <path d="M4.5 13v4.2A1.8 1.8 0 0 0 6.3 19H8v-6H6.3A1.8 1.8 0 0 0 4.5 14.8" />
      <path d="M19.5 13v4.2A1.8 1.8 0 0 1 17.7 19H16v-6h1.7a1.8 1.8 0 0 1 1.8 1.8" />
      <path d="M12 19.5v1.2A2.2 2.2 0 0 1 9.8 23H8" />
    </Icon>
  );
}

function DocIcon() {
  return (
    <Icon>
      <path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V9L14 3z" />
      <path d="M14 3v5.5h5.5M8.5 13h7M8.5 16.5H14" />
    </Icon>
  );
}
