import type { ReactNode } from "react";
import { ContentReveal } from "./ContentReveal";

// The opaque page card (z-10) that sits over the fixed reveal-footer (z-0). Its
// rounded bottom + shadow are structural to the footer-reveal seam.
const CARD_CLASS =
  "flex flex-1 flex-col bg-canvas relative rounded-b-[28px] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.45)]";

/**
 * Page card wrapper. (Transition animation temporarily removed while the
 * fade-out → fade-in effect is reworked.)
 *
 * ContentReveal sits INSIDE the card so the card (bg, rounded seam, shadow) holds
 * still while its content replays the entrance on a theme change — see that file.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className={CARD_CLASS}>
      <ContentReveal>{children}</ContentReveal>
    </div>
  );
}
