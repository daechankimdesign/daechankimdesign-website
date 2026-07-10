"use client";

import { useEffect, useLayoutEffect } from "react";

// Measure before paint on the client (so the reveal room is right on first frame),
// falling back to a plain effect on the server to avoid the SSR warning.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Wires the reveal-footer's scroll room. The footer is `position: fixed` at the
 * viewport bottom (behind the opaque page card); the page card needs exactly the
 * footer's height of extra scroll room below it to fully uncover the footer. We
 * measure the footer and publish its height as `--footer-reveal-h`, which
 * `.reveal-content` consumes as `margin-bottom`. Re-measures on resize / content
 * reflow (ResizeObserver) so it stays correct across breakpoints and locales.
 * Renders nothing.
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
  return null;
}
