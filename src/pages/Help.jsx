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

function HelpArt() {
  return (
    <svg viewBox="0 0 220 160" fill="none">
      <circle cx="168" cy="44" r="28" fill="#e8f4ee" />
      <rect x="118" y="58" width="86" height="62" rx="10" fill="#d7eee3" />
      <circle cx="161" cy="82" r="16" fill="#145c45" />
      <path d="M152 108c4-8 14-8 18 0" stroke="#145c45" strokeWidth="4" strokeLinecap="round" />
      <rect x="16" y="36" width="92" height="88" rx="10" fill="#145c45" />
      <rect x="28" y="50" width="40" height="8" rx="4" fill="#e8f4ee" />
      <rect x="28" y="66" width="68" height="6" rx="3" fill="#2bbc8a" />
      <rect x="28" y="80" width="56" height="6" rx="3" fill="#2bbc8a" opacity=".7" />
      <rect x="28" y="94" width="62" height="6" rx="3" fill="#2bbc8a" opacity=".45" />
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
