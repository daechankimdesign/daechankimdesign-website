"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import posthog from "posthog-js";
import { Github } from "iconoir-react";

// Client-mounted flag (lint-clean, no setState-in-effect): false during SSR, true
// once hydrated. The portal target (document.body) and the always-mounted
// AnimatePresence — which the exit animation needs — only exist on the client.
const subscribeNoop = () => () => {};
const getMountedClient = () => true;
const getMountedServer = () => false;

// Profile + this repo, listed in the dropdown under the GitHub icon.
const GH_LINKS = [
  { label: "Profile", href: "https://github.com/daechankimdesign" },
  {
    label: "This project",
    href: "https://github.com/daechankimdesign/daechankimdesign-website",
  },
];

/**
 * Top-nav GitHub icon with a dropdown of GitHub links. Opens on hover AND on
 * click/tap (tap toggles, for touch where there is no hover). The panel is
 * PORTALED to <body>: the top bar uses `mix-blend-difference`, which would
 * invert any panel rendered inside it, so the menu must live OUTSIDE that blended
 * subtree to keep normal theme colours. Its position is measured from the icon
 * and re-tracked on scroll/resize; it closes on outside-click, Escape, or
 * mouse-out (after a short grace period so the icon→panel gap doesn't dismiss it).
 */
export function GithubNavMenu() {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getMountedClient,
    getMountedServer,
  );
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 8,
      right: Math.max(8, window.innerWidth - r.right),
    });
  };

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const openMenu = () => {
    cancelClose();
    measure();
    setOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      // The panel is portaled OUTSIDE wrapRef, so it must be checked separately —
      // otherwise a click on a link counts as "outside" and closes the menu on
      // mousedown, before the anchor's click can fire (the "click does nothing" bug).
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target))
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const reflow = () => measure();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", reflow, true);
    window.addEventListener("resize", reflow);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", reflow, true);
      window.removeEventListener("resize", reflow);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative flex items-center"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-label="GitHub"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="flex items-center text-[#e1e1e1] transition-opacity hover:opacity-60"
      >
        <Github width={20} height={20} />
      </button>
      {/* Portal + AnimatePresence stay mounted (once hydrated) so the panel can
          play an EXIT animation on close, not just an entrance. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                key="gh-menu"
                ref={menuRef}
                role="menu"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: -6,
                  scale: 0.98,
                  transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
                }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "fixed", top: pos.top, right: pos.right }}
                // Matches the password gate's popup: square corners (no radius),
                // hairline border, canvas fill, and the same soft deep shadow.
                className="z-50 min-w-[13rem] origin-top border border-hairline bg-canvas shadow-[0_30px_80px_-24px_rgba(0,0,0,0.35)]"
              >
                {GH_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    onClick={() =>
                      posthog.capture("github_link_clicked", { href: l.href })
                    }
                    className="block px-3 py-2.5 text-nav text-fg no-underline transition-colors hover:bg-fg hover:text-canvas"
                  >
                    {l.label}
                  </a>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
