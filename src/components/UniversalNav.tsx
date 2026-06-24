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
const TEXT_LIFT = 12;
// Debounce the hover so a quick edge cross doesn't flicker the expand.
const HOVER_ENTER_DELAY = 60;
const HOVER_LEAVE_DELAY = 220;

// The pill grows (animating width, never scale) over GROW seconds; the label
// then fades in once the room exists.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const GROW = 0.28;

const spring = { type: "spring", stiffness: 420, damping: 36 } as const;

/**
 * The hairline-bordered pill. When `collapsed`, every item that isn't the
 * current page shrinks to an 8px gray dot and the pill shrinks to fit; otherwise
 * each label's width grows to make room, then fades in.
 */
function NavPill({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // pathname from next-intl is locale-stripped (e.g. "/project/foo").
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const activeHref = NAV.find((item) => isActive(item.href))?.href ?? null;
  // The highlight rests on the active tab and slides to whatever is hovered, so
  // a hover "comes out of" the current tab's pill.
  const highlightedHref = hoveredItem ?? activeHref;

  return (
    <nav
      aria-label="Primary"
      onMouseLeave={() => setHoveredItem(null)}
      className="isolate flex items-center gap-1 rounded-full border-[0.6px] border-hairline bg-canvas px-1.5 py-1"
    >
      {NAV.map((item) => {
        const active = isActive(item.href);
        const asDot = collapsed && !active;
        const highlighted = item.href === highlightedHref;
        const lit = active || hoveredItem === item.href;
        return (
          <div key={item.href} onMouseEnter={() => setHoveredItem(item.href)}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={t(item.key)}
              className={`relative flex items-center justify-center rounded-full px-3 py-1.5 no-underline transition-colors ${
                lit ? "text-fg" : "text-fg-muted"
              }`}
            >
              {/* One shared highlight pill — z-0, BEHIND every label — that rests
                  on the active tab and slides to the hovered tab. */}
              {highlighted ? (
                <motion.span
                  layoutId="nav-highlight"
                  className="absolute inset-0 z-0 rounded-full bg-surface"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              ) : null}
              {/* Dot: absolutely centered in the Link's padding box (inset-0 +
                  m-auto), so it never adds width — the label alone drives the
                  box. It fades in slightly FASTER than the label collapses, so
                  the label shrinks INTO a dot with no empty, re-widening gap.
                  z-10 keeps it above the sliding highlight pill. */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 m-auto h-2 w-2 rounded-full bg-surface"
                initial={false}
                animate={{ opacity: asDot ? 1 : 0, scale: asDot ? 1 : 0.3 }}
                transition={{ duration: 0.15, ease: EASE }}
              />
              {/* Label (z-10) drives the width: grows first then fades in to
                  reveal; collapses to 0 to hide. Animates width — not scale —
                  so the text never distorts. */}
              <span className="relative z-10 flex items-center justify-center">
                <motion.span
                  className="block overflow-hidden whitespace-nowrap text-body"
                  initial={false}
                  animate={
                    asDot
                      ? {
                          width: 0,
                          opacity: 0,
                          transition: {
                            width: { duration: 0.26, ease: EASE },
                            opacity: { duration: 0.12 },
                          },
                        }
                      : {
                          width: "auto",
                          opacity: 1,
                          transition: {
                            width: { duration: GROW, ease: EASE },
                            opacity: { duration: 0.2, delay: GROW },
                          },
                        }
                  }
                >
                  {t(item.key)}
                </motion.span>
              </span>
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
 * docked, scrolling DOWN collapses inactive items to dots and the pill drops a
 * touch; scrolling UP (or the top/footer) expands the labels and the pill rides
 * higher. Hovering the collapsed pill drives that SAME expanded state — labels
 * + lift — and a top-padded hover zone keeps the cursor inside as it rises.
 */
export function UniversalNav() {
  const [scrolled, setScrolled] = useState(false);
  // On phones the top pill would overlap the logo/right group, so the nav lives
  // at the bottom there (a tab-bar) regardless of scroll.
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const lastY = useRef(0);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const scheduleHover = (next: boolean, delay: number) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHovered(next), delay);
  };

  const docked = isMobile || scrolled;
  // Dots only while collapsed AND not hovered; hovering expands the whole pill.
  const showDots = collapsed && !hovered;
  const lifted = !showDots; // expanded labels ride higher

  // inset-x-0 + mx-auto + w-max centers horizontally without a transform, so
  // framer-motion is free to own translateY for the slide.
  return (
    <AnimatePresence initial={false}>
      {docked ? (
        <motion.div
          key="bottom"
          className="fixed inset-x-0 bottom-10 z-40 mx-auto w-max"
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0, transition: spring }}
          // Slight delay so it eases in a beat after the top pill leaves.
          transition={{ ...spring, delay: 0.18 }}
        >
          {/* Leave zone: padded above by the lift distance so, once expanded,
              the cursor can reach the risen labels without collapsing. Enter is
              gated to the pill itself (below) so only the dots trigger it. */}
          <div
            style={{ paddingTop: TEXT_LIFT }}
            onMouseLeave={() => scheduleHover(false, HOVER_LEAVE_DELAY)}
          >
            {/* The pill's hit-box stays at the collapsed dot position (a transform
                doesn't move layout), so onMouseEnter fires only over the dots. */}
            <motion.div
              initial={false}
              animate={{ y: lifted ? -TEXT_LIFT : 0 }}
              transition={spring}
              onMouseEnter={() => scheduleHover(true, HOVER_ENTER_DELAY)}
            >
              <NavPill collapsed={showDots} />
            </motion.div>
          </div>
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
