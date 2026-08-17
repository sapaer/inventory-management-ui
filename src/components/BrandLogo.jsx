import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";
import { t } from "../i18n";

/** Text logo until a brand image is available. */
export default function BrandLogo({
  className = "",
  showTagline = false,
  taglineClassName = "",
  to = "/welcome",
}) {
  const { lang } = useLang();
  const name = t(lang, "brand");

  return (
    <Link to={to} className={`brand-logo notranslate ${className}`.trim()} aria-label={name} translate="no">
      <span className="brand-logo-text brand-name">{name}</span>
      {showTagline ? (
        <span className={taglineClassName || "brand-logo-tag brand-tag"}>{t(lang, "tagline")}</span>
      ) : null}
    </Link>
  );
}
