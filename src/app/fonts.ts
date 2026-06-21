import { Noto_Sans, Noto_Serif } from "next/font/google";

// Noto Sans — global UI font (rules §3). Latin subset for now; Korean (/ko)
// will add Noto Sans KR in Phase 2 i18n. Weights: 400 body, 500 H3, 700 H1,
// 800 logo wordmark.
export const notoSans = Noto_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700", "800"],
  variable: "--font-noto-sans",
});

// Noto Serif — H2/H3 headings. Weights: 500 (H3), 700 (H2).
export const notoSerif = Noto_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-noto-serif",
});
