import { Nanum_Pen_Script, Noto_Sans } from "next/font/google";

// Noto Sans — the single global font (rules §3). Latin subset for now; Korean
// (/ko) will add Noto Sans KR in Phase 2 i18n. Weights: 400 body, 500 H3,
// 700 H1/H2, 800 logo wordmark.
export const notoSans = Noto_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700", "800"],
  variable: "--font-noto-sans",
});

// The hero wall's handwriting ONLY (the wall notes and the polaroid captions):
// the one exception to the sans-only rule. Nanum Pen Script rather than a
// Latin-only script face, because it also covers Korean, so the /ko wall can
// be written in the same hand. Not preloaded: the hero's taped items (where it
// appears) arrive a beat after first paint, and the hero text never uses it.
export const nanumPen = Nanum_Pen_Script({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-hand",
  preload: false,
});
