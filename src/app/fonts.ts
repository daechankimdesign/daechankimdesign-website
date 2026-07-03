import { Noto_Sans } from "next/font/google";

// Noto Sans — the single global font (rules §3). Latin subset for now; Korean
// (/ko) will add Noto Sans KR in Phase 2 i18n. Weights: 400 body, 500 H3,
// 700 H1/H2, 800 logo wordmark.
export const notoSans = Noto_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700", "800"],
  variable: "--font-noto-sans",
});
