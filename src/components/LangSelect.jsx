import { useLang } from "../context/LangContext";

const OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
];

export default function LangSelect({ className = "" }) {
  const { lang, setLang } = useLang();

  return (
    <label className={`lang-select notranslate ${className}`.trim()} translate="no">
      <span className="sr-only">Language</span>
      <select
        className="lang-select-ctrl"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label="Language"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
