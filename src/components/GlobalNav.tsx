"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Settings as SettingsIcon } from "iconoir-react";
import { Link, usePathname } from "@/i18n/navigation";
import { SettingsModal } from "./SettingsModal";

// Apply the corrected visibility BEFORE the browser paints on the client (so a
// reload while scrolled past the hero doesn't flash the bar in), falling back to
// a plain effect on the server to avoid the SSR useLayoutEffect warning.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Top bar. On the Home page it stays HIDDEN over the hero and slides DOWN from
 * the top (with a slight delay) once the hero's bottom edge (`#hero-sentinel`)
 * scrolls above the viewport top — and hides again the moment you scroll back up
 * into the hero. On every other page (no hero) it's shown from the start. It's
 * `fixed` (out of flow) so the hero can sit full-bleed while the bar is hidden.
 * Coexists with the UniversalNav pill (z-40) below it at z-30.
 *
 * Visibility is driven by reading the sentinel's live position every scroll
 * frame (rAF-throttled), NOT an IntersectionObserver: a zero-height sentinel
 * only fires an IO callback at the instant it crosses the viewport edge and goes
 * silent while it sits inside the viewport, so scrolling back up into the hero
 * would never re-hide the bar. A per-frame read updates reliably in BOTH
 * directions.
 */
export function GlobalNav() {
  const t = useTranslations("Nav");
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shown, setShown] = useState(!isHome);
  // When true, the next visibility change snaps (no slide). Used for the initial
  // measure and route changes, so ONLY genuine scroll-driven reveals/hides animate.
  const [instant, setInstant] = useState(true);

  // <GlobalNav /> lives in the layout OUTSIDE the keyed PageTransition, so it
  // never unmounts on client-side navigation and `shown` persists across routes.
  // Reset it synchronously during render when the route type flips, so the first
  // committed frame on the new route is already correct: arriving on Home starts
  // hidden over the hero (no reveal-then-hide flicker), leaving Home starts shown.
  const prevIsHome = useRef(isHome);
  if (prevIsHome.current !== isHome) {
    prevIsHome.current = isHome;
    setInstant(true);
    setShown(!isHome);
  }

  useIsoLayoutEffect(() => {
    // Off the home page there's no hero to hide behind — always show the bar.
    if (!isHome) {
      setInstant(true);
      setShown(true);
      return;
    }

    let raf = 0;
    let first = true;
    const measure = () => {
      raf = 0;
      const sentinel = document.getElementById("hero-sentinel");
      // Shown once the hero's bottom edge has scrolled above the viewport top;
      // hidden whenever any of the hero is still in view. Fallback (no sentinel):
      // roughly a hero's worth of scroll.
      const past = sentinel
        ? sentinel.getBoundingClientRect().top <= 0
        : window.scrollY > window.innerHeight * 0.7;
      setInstant(first); // the initial correction snaps; later scroll updates slide
      first = false;
      setShown(past);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure(); // correct initial state before paint (e.g. a reload partway down)
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isHome]);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-30 mix-blend-difference"
      initial={false}
      animate={{ y: shown ? "0%" : "-100%" }}
      transition={
        reduce || instant
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 380,
              damping: 40,
              delay: shown ? 0.15 : 0,
            }
      }
    >
      <nav className="container-page flex items-center justify-between gap-6 py-4">
        {/* Left — text logo */}
        <Link href="/" className="text-logo no-underline shrink-0 text-[#e1e1e1]">
          Daechan Kim
        </Link>

        {/* Right — resume, contact, settings. Primary nav lives in UniversalNav. */}
        <div className="flex shrink-0 items-center gap-4">
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-body no-underline transition-opacity hover:opacity-60 sm:inline text-[#e1e1e1]"
          >
            {t("resume")}
          </a>
          <a
            href="mailto:daechankim.design@gmail.com"
            className="hidden text-body no-underline transition-opacity hover:opacity-60 sm:inline text-[#e1e1e1]"
          >
            {t("contact")}
          </a>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={t("settings")}
            className="text-[#8a8a8a] transition-colors hover:text-[#e1e1e1]"
          >
            <SettingsIcon width={20} height={20} />
          </button>
        </div>
      </nav>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </motion.header>
  );
}
