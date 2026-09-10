import { useEffect, useState } from "react";
import "./LandingFontPicker.css";

const STORAGE_KEY = "pn_lp_font";

const FONTS = [
  { id: "plus-jakarta", label: "Plus Jakarta Sans", stack: '"Plus Jakarta Sans", "Segoe UI", sans-serif' },
  { id: "inter", label: "Inter", stack: 'Inter, "Segoe UI", sans-serif' },
  { id: "figtree", label: "Figtree", stack: 'Figtree, "Segoe UI", sans-serif' },
  { id: "outfit", label: "Outfit", stack: 'Outfit, "Segoe UI", sans-serif' },
  { id: "manrope", label: "Manrope", stack: 'Manrope, "Segoe UI", sans-serif' },
  { id: "dm-sans", label: "DM Sans", stack: '"DM Sans", "Segoe UI", sans-serif' },
  { id: "nunito", label: "Nunito Sans", stack: '"Nunito Sans", "Segoe UI", sans-serif' },
  { id: "sora", label: "Sora", stack: 'Sora, "Segoe UI", sans-serif' },
  { id: "lexend", label: "Lexend", stack: 'Lexend, "Segoe UI", sans-serif' },
  { id: "space-grotesk", label: "Space Grotesk", stack: '"Space Grotesk", "Segoe UI", sans-serif' },
  { id: "be-vietnam", label: "Be Vietnam Pro", stack: '"Be Vietnam Pro", "Segoe UI", sans-serif' },
  { id: "syne", label: "Syne", stack: 'Syne, "Segoe UI", sans-serif' },
  { id: "fraunces", label: "Fraunces", stack: 'Fraunces, Georgia, serif' },
  { id: "source-serif", label: "Source Serif 4", stack: '"Source Serif 4", Georgia, serif' },
];

function readSaved() {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (FONTS.some((f) => f.id === id)) return id;
  } catch {
    /* ignore */
  }
  return "plus-jakarta";
}

export function landingFontVars(id) {
  const font = FONTS.find((f) => f.id === id) || FONTS[0];
  return {
    "--lp-display": font.stack,
    "--lp-heading": font.stack,
    "--lp-body": font.stack,
    "--lp-ui": font.stack,
    fontFamily: font.stack,
  };
}

export default function LandingFontPicker({ value, onChange }) {
  return (
    <div className="lp-font-picker" role="region" aria-label="Landing font preview">
      <label htmlFor="lp-font-pick">Try a font</label>
      <select
        id="lp-font-pick"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {FONTS.map((font) => (
          <option key={font.id} value={font.id} style={{ fontFamily: font.stack }}>
            {font.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function useLandingFont() {
  const [id, setId] = useState(readSaved);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, [id]);

  return [id, setId];
}
