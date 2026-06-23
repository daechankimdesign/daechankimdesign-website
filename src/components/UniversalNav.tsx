"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link, usePathname } from "@/i18n/navigation";

const NAV = [
  { href: "/", key: "home" },
  { href: "/project", key: "projects" },
  { href: "/sandbox", key: "sandbox" },
  { href: "/blog", key: "blogs" },
  { href: "/about", key: "about" },
] as const;

// How far the user scrolls before the pill leaves the top and docks at the
// bottom of the viewport.
const SCROLL_THRESHOLD = 80;
// Dead zone so tiny scroll jitter doesn't flip the collapse direction.
const DIR_THRESHOLD = 4;
// Distance from the page bottom within which the nav re-expands (footer zone).
const BOTTOM_THRESHOLD = 220;
// How much higher the expanded (text) pill rides vs the collapsed (dot) pill.
const TEXT_LIFT = 40;
// Debounce the dot hover so the box reflowing under the cursor (or a quick edge
// cross) doesn't flicker. Exit is slower than enter to absorb the wobble.
const HOVER_ENTER_DELAY = 70;
const HOVER_LEAVE_DELAY = 220;

// The pill grows (animating width, never scale) over GROW seconds; the label
// then fades in once the room exists.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const GROW = 0.28;

const spring = { type: "spring", stiffness: 420, damping: 36 } as const;

/**
 * The transparent, hairline-bordered pill. When `collapsed`, every item that
 * isn't the current page (and isn't hovered) shrinks to an 8px gray dot and the
 * pill shrinks to fit (framer `layout`); hovering a dot reveals its label.
 */
function NavPill({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  // Schedule the hover change after a delay; a newer event cancels the pending
  // one (mouseleave fires before the next mouseenter, so moving between dots is
  // clean and a brief leave-then-reenter is absorbed).
  const scheduleHover = (next: string | null, delay: number) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHovered(next), delay);
  };

  // pathname from next-intl is locale-stripped (e.g. "/project/foo").
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Primary"
      className="flex items-center gap-1 rounded-full border-[0.6px] border-hairline bg-canvas px-1.5 py-1"
    >
      {NAV.map((item) => {
        const active = isActive(item.href);
        // A dot when collapsed, unless it's the active page or being hovered.
        const asDot = collapsed && !active && hovered !== item.href;
        return (
          <div
            key={item.href}
            onMouseEnter={() => scheduleHover(item.href, HOVER_ENTER_DELAY)}
            onMouseLeave={() => scheduleHover(null, HOVER_LEAVE_DELAY)}
          >
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={t(item.key)}
              className={`flex items-center justify-center rounded-full px-3 py-1.5 no-underline transition-colors ${
                active ? "bg-surface text-fg" : "text-fg-muted hover:text-fg"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {asDot ? (
                  <motion.span
                    key="dot"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={{ duration: 0.12 }}
                    className="block h-2 w-2 rounded-full bg-fg-muted"
                  />
                ) : (
                  // Width grows first to make room, THEN the label fades in
                  // (opacity delayed by the grow). Animating width — not scale —
                  // so the text never distorts.
                  <motion.span
                    key="text"
                    className="block overflow-hidden whitespace-nowrap text-body"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{
                      width: "auto",
                      opacity: 1,
                      transition: {
                        width: { duration: GROW, ease: EASE },
                        opacity: { duration: 0.2, delay: GROW },
                      },
                    }}
                    exit={{
                      width: 0,
                      opacity: 0,
                      transition: {
                        width: { duration: GROW * 0.8, ease: EASE, delay: 0.1 },
                        opacity: { duration: 0.14 },
                      },
                    }}
                  >
                    {t(item.key)}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Universal navigation, separate from the top bar. It rides at the top within
 * the first fold, then — once the user scrolls past the threshold — slides up
 * and re-enters (after a slight delay) docked just above the bottom. While
 * docked, scrolling DOWN collapses inactive items to dots; scrolling UP, the
 * top of the page, and the footer all expand them back to labels. Expanded the
 * pill rides a touch higher than collapsed, with a transition between.
 */
export function UniversalNav() {
  const [scrolled, setScrolled] = useState(false);
  // On phones the top pill would overlap the logo/right group, so the nav lives
  // at the bottom there (a tab-bar) regardless of scroll.
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onMq = () => setIsMobile(mq.matches);
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > SCROLL_THRESHOLD);
      const nearBottom =
        document.documentElement.scrollHeight - (y + window.innerHeight) <=
        BOTTOM_THRESHOLD;
      // Expand near the top and in the footer; otherwise follow scroll direction.
      if (y <= SCROLL_THRESHOLD || nearBottom) {
        setCollapsed(false);
      } else if (y > lastY.current + DIR_THRESHOLD) {
        setCollapsed(true); // scrolling down → dots
      } else if (y < lastY.current - DIR_THRESHOLD) {
        setCollapsed(false); // scrolling up → labels
      }
      lastY.current = y;
    };
    onMq();
    onScroll();
    mq.addEventListener("change", onMq);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const docked = isMobile || scrolled;

  // inset-x-0 + mx-auto + w-max centers horizontally without a transform, so
  // framer-motion is free to own translateY for the slide.
  return (
    <AnimatePresence initial={false}>
      {docked ? (
        <motion.div
          key="bottom"
          className="fixed inset-x-0 bottom-6 z-40 mx-auto w-max"
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0, transition: spring }}
          // Slight delay so it eases in a beat after the top pill leaves.
          transition={{ ...spring, delay: 0.18 }}
        >
          {/* Inner transform handles the text↔dot position shift snappily,
              independent of the (delayed) slide-in above. */}
          <motion.div
            initial={false}
            animate={{ y: collapsed ? 0 : -TEXT_LIFT }}
            transition={spring}
          >
            <NavPill collapsed={collapsed} />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="top"
          className="fixed inset-x-0 top-3 z-40 mx-auto w-max"
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={spring}
        >
          <NavPill />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
