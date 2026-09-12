import { useState } from "react";
import SupportLayout from "../components/SupportLayout";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";

const FAQS = [
  ["faq1Q", "faq1A"],
  ["faq2Q", "faq2A"],
  ["faq3Q", "faq3A"],
  ["faq4Q", "faq4A"],
  ["faq5Q", "faq5A"],
  ["faq6Q", "faq6A"],
  ["faq7Q", "faq7A"],
];

export default function Faqs() {
  const { lang } = useLang();
  const [open, setOpen] = useState(0);
  const rows = Math.ceil(FAQS.length / 2);

  return (
    <SupportLayout title={t(lang, "faqsTitle")} lead={t(lang, "faqsLead")} art={<FaqArt />}>
      <div className="faq-acc" style={{ "--faq-rows": rows }}>
        {FAQS.map(([q, a], i) => {
          const isOpen = open === i;
          return (
            <article key={q} className={`faq-acc-item${isOpen ? " is-open" : ""}`}>
              <h2>
                <button type="button" className="faq-acc-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span>{t(lang, q)}</span>
                  <span className="faq-acc-icon" aria-hidden="true">
                    {isOpen ? "×" : "+"}
                  </span>
                </button>
              </h2>
              {isOpen ? <p className="faq-acc-a">{t(lang, a)}</p> : null}
            </article>
          );
        })}
      </div>
    </SupportLayout>
  );
}

function FaqArt() {
  return (
    <svg viewBox="0 0 220 160" fill="none">
      <circle cx="160" cy="48" r="36" fill="#e8f4ee" />
      <circle cx="160" cy="40" r="18" fill="#145c45" />
      <text x="160" y="48" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">
        ?
      </text>
      <rect x="24" y="70" width="120" height="14" rx="7" fill="#d7eee3" />
      <rect x="24" y="94" width="96" height="10" rx="5" fill="#e8f4ee" />
      <rect x="24" y="114" width="108" height="10" rx="5" fill="#e8f4ee" />
    </svg>
  );
}
