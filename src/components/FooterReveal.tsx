"use client";

import { useEffect, useLayoutEffect } from "react";

// Measure before paint on the client (so the reveal room is right on first frame),
// falling back to a plain effect on the server to avoid the SSR warning.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// 2.5rem overlap the card keeps over the footer (see `.reveal-content` in
// globals.css) — the footer's bottom 40px never scroll-reveals, so it's excluded
// from the reveal room.
const OVERLAP_PX = 40;

// Once the scroll has uncovered THIS fraction of the footer, the reveal
// auto-completes: the page smooth-scrolls the rest of the way so the footer snaps
// fully into view ("reverse sticky" catch).
const SNAP_AT_FRACTION = 0.3;

/**
 * Wires the reveal-footer's scroll room. The footer is `position: fixed` at the
 * viewport bottom (behind the opaque page card); the page card needs exactly the
 * footer's height of extra scroll room below it to fully uncover the footer. We
 * measure the footer and publish its height as `--footer-reveal-h`, which
 * `.reveal-content` consumes as `margin-bottom`. Re-measures on resize / content
 * reflow (ResizeObserver) so it stays correct across breakpoints and locales.
 *
 * It also drives the "reverse sticky" catch: the reveal stays a normal 1:1 scroll
 * until ~30% of the footer is uncovered, at which point it auto-scrolls the rest
 * so the footer snaps fully open. A wheel/touch upward gesture cancels the in-
 * flight snap so the reader can scroll back up. Renders nothing.
 */
export function FooterReveal() {
  useIsoLayoutEffect(() => {
    const footer = document.querySelector<HTMLElement>("footer.reveal-footer");
    if (!footer) return;
    const root = document.documentElement;
    const apply = () => {
      root.style.setProperty("--footer-reveal-h", `${footer.offsetHeight}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(footer);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);

  // Reverse-sticky auto-complete. Pointer-fine only (mouse / trackpad): on touch,
  // momentum scrolling fights a programmatic smooth-scroll, so we leave the reveal
  // fully manual there.
  //
  // The "how much of the footer is uncovered" measure is taken straight from live
  // rects — the footer is position:fixed so its rect bottom IS the viewport bottom,
  // and the card's rect bottom rides up as the reveal progresses. This deliberately
  // avoids window.innerHeight / scrollY (which some embedded webviews report as 0),
  // so the trigger stays correct everywhere.
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const footer = document.querySelector<HTMLElement>("footer.reveal-footer");
    const card = document.querySelector<HTMLElement>(".reveal-content");
    if (!footer || !card) return;

    let committing = false; // a snap-to-full is in flight
    let lastRevealed = footer.getBoundingClientRect().bottom - card.getBoundingClientRect().bottom;

    const onScroll = () => {
      const footerH = footer.offsetHeight;
      const revealRoom = footerH - OVERLAP_PX; // scroll-revealable portion
      if (revealRoom <= 0) return;

      // px of the footer currently uncovered = gap between the card's bottom and
      // the viewport bottom (the fixed footer's bottom).
      const revealed =
        footer.getBoundingClientRect().bottom - card.getBoundingClientRect().bottom;
      const goingDown = revealed > lastRevealed; // more footer showing ⇒ scrolling down
      lastRevealed = revealed;

      // The snap has landed — release the lock.
      if (committing) {
        if (revealed >= revealRoom - 2) committing = false;
        return;
      }

      // Crossed 30% while scrolling DOWN (and not already fully open) → finish the
      // reveal automatically by scrolling the remaining room.
      if (
        goingDown &&
        revealed >= SNAP_AT_FRACTION * footerH &&
        revealed < revealRoom - 2
      ) {
        committing = true;
        window.scrollBy({ top: revealRoom - revealed, behavior: "smooth" });
      }
    };

    // An upward gesture mid-snap cancels it (freeze at the current position, which
    // also aborts the smooth-scroll animation) so the reader is never trapped.
    const cancelOnUp = (e: WheelEvent) => {
      if (committing && e.deltaY < 0) {
        committing = false;
        window.scrollBy({ top: 0 });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", cancelOnUp, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", cancelOnUp);
    };
  }, []);

  return null;
}
