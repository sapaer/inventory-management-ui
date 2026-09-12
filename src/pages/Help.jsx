import { useState } from "react";
import { Link } from "react-router-dom";
import HelpGuide from "../components/HelpGuide";
import SupportLayout from "../components/SupportLayout";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";

const TOPICS = [
  { id: "inv", title: "helpTopicInv", body: "helpTopicInvBody", Icon: BoxIcon },
  { id: "stock", title: "helpTopicStock", body: "helpTopicStockBody", Icon: RefreshIcon },
  { id: "low", title: "helpTopicLow", body: "helpTopicLowBody", Icon: AlertIcon },
  { id: "reports", title: "helpTopicReports", body: "helpTopicReportsBody", Icon: ChartIcon },
  { id: "account", title: "helpTopicAccount", body: "helpTopicAccountBody", Icon: UserIcon },
  { id: "tech", title: "helpTopicTech", body: "helpTopicTechBody", Icon: WrenchIcon },
];

const GUIDES = {
  inv: [
    { title: "helpGuideInv1Title", body: "helpGuideInv1Body" },
    { title: "helpGuideInv2Title", body: "helpGuideInv2Body" },
    { title: "helpGuideInv3Title", body: "helpGuideInv3Body" },
  ],
  stock: [
    { title: "helpGuideStock1Title", body: "helpGuideStock1Body" },
    { title: "helpGuideStock2Title", body: "helpGuideStock2Body" },
    { title: "helpGuideStock3Title", body: "helpGuideStock3Body" },
  ],
  low: [
    { title: "helpGuideLow1Title", body: "helpGuideLow1Body" },
    { title: "helpGuideLow2Title", body: "helpGuideLow2Body" },
    { title: "helpGuideLow3Title", body: "helpGuideLow3Body" },
  ],
  reports: [
    { title: "helpGuideReports1Title", body: "helpGuideReports1Body" },
    { title: "helpGuideReports2Title", body: "helpGuideReports2Body" },
  ],
  account: [
    { title: "helpGuideAccount1Title", body: "helpGuideAccount1Body" },
    { title: "helpGuideAccount2Title", body: "helpGuideAccount2Body" },
    { title: "helpGuideAccount3Title", body: "helpGuideAccount3Body" },
  ],
  tech: [
    { title: "helpGuideTech1Title", body: "helpGuideTech1Body" },
    { title: "helpGuideTech2Title", body: "helpGuideTech2Body" },
    { title: "helpGuideTech3Title", body: "helpGuideTech3Body" },
  ],
};

const QUICK = [
  { to: "/help/faqs", title: "faqs", body: "helpQuickFaqBody", Icon: ChatIcon },
  { to: "/contact", title: "contactSupport", body: "helpQuickContactBody", Icon: HeadsetIcon },
  { to: "/terms", title: "terms", body: "helpQuickTermsBody", Icon: DocIcon },
];

export default function Help() {
  const { lang } = useLang();
  const [guideId, setGuideId] = useState(null);
  const guide = guideId ? GUIDES[guideId] : null;
  const topic = TOPICS.find((item) => item.id === guideId);

  return (
    <SupportLayout title={t(lang, "helpTitle")} lead={t(lang, "helpLead")} art={<HelpArt />}>
      <section className="support-block">
        <h2>{t(lang, "helpBrowse")}</h2>
        <div className="support-topics">
          {TOPICS.map(({ id, title, body, Icon }) => (
            <button key={id} type="button" className="support-topic" onClick={() => setGuideId(id)}>
              <span className="support-topic-ic">
                <Icon />
              </span>
              <span className="support-topic-copy">
                <strong>{t(lang, title)}</strong>
                <span>{t(lang, body)}</span>
              </span>
              <span className="support-topic-go" aria-hidden="true">
                →
              </span>
            </button>
          ))}
        </div>
      </section>

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

      {guide && topic ? (
        <HelpGuide title={topic.title} steps={guide} onClose={() => setGuideId(null)} />
      ) : null}
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

function BoxIcon() {
  return (
    <Icon>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </Icon>
  );
}

function RefreshIcon() {
  return (
    <Icon>
      <path d="M4.5 10A7.5 7.5 0 0 1 16 5.6L18 8" />
      <path d="M18 3v5h-5" />
      <path d="M19.5 14A7.5 7.5 0 0 1 8 18.4L6 16" />
      <path d="M6 21v-5h5" />
    </Icon>
  );
}

function AlertIcon() {
  return (
    <Icon>
      <path d="M12 3.2 2.8 19.2a1.2 1.2 0 0 0 1 1.8h16.4a1.2 1.2 0 0 0 1-1.8L12 3.2z" />
      <path d="M12 9v5" />
      <path d="M12 17.2h.01" />
    </Icon>
  );
}

function ChartIcon() {
  return (
    <Icon>
      <path d="M4 19h16" />
      <rect x="6" y="11" width="3.2" height="8" rx="1" />
      <rect x="10.4" y="6" width="3.2" height="13" rx="1" />
      <rect x="14.8" y="9" width="3.2" height="10" rx="1" />
    </Icon>
  );
}

function UserIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 19.2c.8-3.2 3.5-5 7-5s6.2 1.8 7 5" />
    </Icon>
  );
}

function WrenchIcon() {
  return (
    <Icon>
      <path d="M14.8 6.2a3.8 3.8 0 0 0-5.2 5.3L4 17.1 6.9 20l5.6-5.6a3.8 3.8 0 0 0 5.3-5.2L15.6 11l-2.6-2.6 1.8-2.2z" />
    </Icon>
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
