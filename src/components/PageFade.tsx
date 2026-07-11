"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

// Bridges the transition-aware Link / useRouter (src/i18n/navigation.tsx) to the
// curtain: they call run(navigate) instead of navigating directly.
type PageFadeAPI = { run: (navigate: () => void) => void };
const PageFadeContext = createContext<PageFadeAPI | null>(null);
export const usePageFade = () => useContext(PageFadeContext);

// Cover fade ~matches this; navigation fires on a TIMER (not the animation's
// onAnimationComplete, which stalls if the tab is backgrounded mid-transition).
const COVER_MS = 220;
// Hard cap so the curtain can never stay stuck (same-route nav, stalled fetch).
const SAFETY_MS = 2000;

/**
 * Page transition without the View Transitions API (which is incompatible with
 * this site's framer-motion reveals). A canvas-coloured curtain sits at z-20 —
 * above the page content (z-10) but below the fixed nav (z-30+) — so the CONTENT
 * fades while the chrome stays put.
 *
 * Per forward navigation:
 *   1. fade the curtain IN                → old content fades out
 *   2. after COVER_MS, navigate (Next scrolls the new route to top, masked)
 *   3. when the route commits (pathname change), fade the curtain OUT → the new
 *      content is revealed and its own reveals fade it in
 *
 * Browser back/forward keep native scroll restoration and fade in via the page's
 * reveals (no curtain). Reduced motion navigates instantly.
 */
export function PageFadeProvider({ children }: { children: ReactNode }) {
  const [covered, setCovered] = useState(false);
  const coveredRef = useRef(false);
  const pending = useRef<(() => void) | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();
  const pathname = usePathname();

  const setCover = (v: boolean) => {
    coveredRef.current = v;
    setCovered(v);
  };

  const clearTimers = () => {
    if (navTimer.current) clearTimeout(navTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
  };

  const run = useCallback(
    (navigate: () => void) => {
      if (reduce) {
        navigate();
        return;
      }
      pending.current = navigate;
      clearTimers();
      setCover(true);
      // Navigate once the cover has (roughly) landed — timer-driven so it fires
      // even if the tab is hidden and the animation is paused.
      navTimer.current = setTimeout(() => {
        const nav = pending.current;
        pending.current = null;
        nav?.();
      }, COVER_MS);
      // Never stay covered forever if the route never commits.
      safetyTimer.current = setTimeout(() => setCover(false), SAFETY_MS);
    },
    [reduce],
  );

  // Route committed (pathname changed) → uncover to reveal the new page.
  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
      if (coveredRef.current) setCover(false);
    }
  }, [pathname]);

  useEffect(() => clearTimers, []);

  return (
    <PageFadeContext.Provider value={{ run }}>
      {children}
      <motion.div
        aria-hidden
        className="fixed inset-0 z-20 bg-canvas"
        initial={false}
        animate={{ opacity: covered ? 1 : 0 }}
        transition={{
          duration: reduce ? 0 : covered ? COVER_MS / 1000 : 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{ pointerEvents: covered ? "auto" : "none" }}
      />
    </PageFadeContext.Provider>
  );
}
