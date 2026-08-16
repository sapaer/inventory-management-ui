import { t } from "../i18n";

export default function StatusBadge({ status, lang }) {
  if (status === "OUT_OF_STOCK") return <span className="badge b-r">{t(lang, "outBadge")}</span>;
  if (status === "LOW_STOCK") return <span className="badge b-a">{t(lang, "lowBadge")}</span>;
  return <span className="badge b-g">{t(lang, "inStockBadge")}</span>;
}
