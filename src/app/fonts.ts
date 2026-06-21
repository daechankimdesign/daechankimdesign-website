import { Noto_Sans, Noto_Serif } from "next/font/google";

// Noto Sans — global UI font (rules §3). Latin subset for now; Korean (/ko)
// will add Noto Sans KR in Phase 2 i18n. Weights: 400 body, 500 H3, 700 headings.
export const notoSans = Noto_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans",
});

// Noto Serif — opt-in only (rules §3). Loaded but applied only where requested.
export const notoSerif = Noto_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  variable: "--font-noto-serif",
});
