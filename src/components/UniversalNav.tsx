"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import posthog from "posthog-js";
import { Link, usePathname } from "@/i18n/navigation";
import { RESUME_URL } from "@/lib/links";
import { ThemeToggle } from "./ThemeToggle";
import {
  getNavHovered,
  navHoverEnter,
  navHoverLeave,
  subscribeNavHover,
} from "@/lib/navHover";

const NAV = [
  // "Work" IS the home board: the merged project + experiment grid lives on "/".
  // This pill also stays lit on every /project detail route (see isActive), and on
  // those pages its label gains a "| Project" / "| Experiment" suffix (see
  // labelFor). Blog is hidden for now (no posts yet).
  { href: "/", key: "work" },
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

// A slight beat before the pill slides in on first page load, so it arrives just
// after the page starts settling rather than at the very first frame. Applies to
// the initial mount only (see firstMount) — scroll re-entrances stay immediate.
const LOAD_DELAY = 0.35;

// Measure before the browser paints on the client (so the pill's first frame is
// already at the label's real width — no grow-in flash), falling back to a plain
// effect on the server to avoid the SSR useLayoutEffect warning.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * One pill item. The label drives the pill's width, which ANIMATES (never scales,
 * so the text can't distort) to the label's natural width — 0 when collapsed to a
 * dot. When the label itself CHANGES (Work → Work /Project → Work /Experiment on
 * navigation) the pill grows/shrinks smoothly to the new text while the old label
 * rolls up + out and the new rolls up + in.
 *
 * The width animates to a concrete px value read off an off-screen measurer (not
 * `width:"auto"`, which framer resolves once and caches — the old approach had to
 * REMOUNT on every label change to re-measure, which is why the swap was instant).
 */
function NavItem({
  href,
  label,
  active,
  asDot,
  highlighted,
  scope,
  onMouseEnter,
  external,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  asDot: boolean;
  highlighted: boolean;
  scope: string;
  onMouseEnter: () => void;
  // External items (Resume) render an <a target="_blank"> instead of a Link and
  // are never "active"; they still collapse to a dot and take the hover-slide.
  external?: boolean;
  onClick?: () => void;
}) {
  const measureRef = useRef<HTMLSpanElement>(null);
  // null until first measured → the very first render uses "auto" (correct width,
  // no animation); every render after is a px number, so label changes animate.
  const [labelWidth, setLabelWidth] = useState<number | null>(null);
  useIsoLayoutEffect(() => {
    if (measureRef.current)
      // Subpixel width, rounded UP, so the clipping window never shaves the last
      // glyph's edge (offsetWidth floors and can clip by ~1px).
      setLabelWidth(Math.ceil(measureRef.current.getBoundingClientRect().width));
  }, [label]);

  const linkClass = `relative flex items-center justify-center rounded-full px-3 py-1.5 no-underline transition-colors ${
    // The item UNDER the dark highlight reads white; every other item is muted on
    // the light pill container. Keyed to `highlighted` (not active/hover) so the
    // color tracks the sliding pill exactly.
    highlighted ? "text-canvas" : "text-fg-muted"
  }`;

  const content = (
    <>
      {/* One shared highlight pill — z-0, BEHIND every label — that rests on the
          active tab and slides to the hovered tab. */}
      {highlighted ? (
        <motion.span
          layoutId={`nav-highlight-${scope}`}
          className="absolute inset-0 z-0 rounded-full bg-fg"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      ) : null}
      {/* Dot: absolutely centered in the padding box (inset-0 + m-auto), so it
          never adds width — the label alone drives the box. Fades in FAST (no
          scale pop) so it's already present as the label collapses INTO it. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 m-auto h-2 w-2 rounded-full bg-surface"
        initial={false}
        animate={{ opacity: asDot ? 1 : 0 }}
        transition={{ duration: 0.1, ease: "linear" }}
      />
      {/* Label window: width animates (never scale) to the measured natural
          width, 0 when collapsed. overflow-hidden clips both the width reveal AND
          the vertical roll of the label swap below. */}
      <motion.span
        className="relative z-10 block overflow-hidden text-nav"
        initial={false}
        animate={{ width: asDot ? 0 : labelWidth ?? "auto", opacity: asDot ? 0 : 1 }}
        transition={{
          width: { duration: asDot ? 0.26 : GROW, ease: EASE },
          opacity: asDot ? { duration: 0.12 } : { duration: 0.2, delay: GROW },
        }}
      >
        {/* popLayout pops the exiting label to absolute so the entering one can
            take its place immediately — the two roll past each other (old up +
            out, new up + in) instead of waiting. initial={false} keeps the first
            label from rolling in on mount. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            className="block whitespace-nowrap"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </motion.span>
      {/* Off-screen measurer — the label at its natural width, feeding the width
          animation above. Never animated; invisible + absolute so it adds no
          layout. */}
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute whitespace-nowrap text-nav"
      >
        {label}
      </span>
    </>
  );

  return (
    <div onMouseEnter={onMouseEnter}>
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          onClick={onClick}
          className={linkClass}
        >
          {content}
        </a>
      ) : (
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          aria-label={label}
          className={linkClass}
        >
          {content}
        </Link>
      )}
    </div>
  );
}

/**
 * The hairline-bordered pill. When `collapsed`, every item that isn't the
 * current page shrinks to an 8px gray dot and the pill shrinks to fit; otherwise
 * each label's width grows to make room, then fades in.
 */
function NavPill({
  collapsed = false,
  scope = "top",
}: {
  collapsed?: boolean;
  // Scopes the shared highlight's layoutId to THIS pill. The top and bottom
  // pills are both mounted during the AnimatePresence dock swap; a single shared
  // id would make framer animate the highlight from one pill's position across
  // the viewport to the other's. Per-pill ids keep the hover-slide but prevent
  // that cross-screen flight.
  scope?: string;
}) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // pathname from next-intl is locale-stripped (e.g. "/project/foo").
  const isActive = (href: string) =>
    href === "/"
      ? // Work: the home board AND every /project route (index + detail) light it.
        pathname === "/" ||
        pathname === "/project" ||
        pathname.startsWith("/project/")
      : pathname === href || pathname.startsWith(`${href}/`);

  // The Work pill shows WHERE you are: "Work" on the board, "Work /Project" on a
  // case-study detail page, "Work /Experiment" on a play detail page. Every other
  // item keeps its plain label.
  const labelFor = (item: (typeof NAV)[number]) => {
    if (item.href === "/") {
      if (pathname.startsWith("/project/case-study"))
        return `${t("work")} /${t("caseStudy")}`;
      if (pathname.startsWith("/project/play"))
        return `${t("work")} /${t("play")}`;
      return t("work");
    }
    return t(item.key);
  };

  const activeHref = NAV.find((item) => isActive(item.href))?.href ?? null;
  // The highlight rests on the active tab and slides to whatever is hovered, so
  // a hover "comes out of" the current tab's pill.
  const highlightedHref = hoveredItem ?? activeHref;

  return (
    <nav
      aria-label="Primary"
      onMouseLeave={() => setHoveredItem(null)}
      className="isolate flex items-center gap-1 rounded-full border-[0.6px] border-hairline-faint bg-canvas p-1 drop-shadow-xl"
    >
      {NAV.map((item) => {
        const active = isActive(item.href);
        const asDot = collapsed && !active;
        const highlighted = item.href === highlightedHref;
        const label = labelFor(item);
        return (
          <NavItem
            key={item.href}
            href={item.href}
            label={label}
            active={active}
            asDot={asDot}
            highlighted={highlighted}
            scope={scope}
            onMouseEnter={() => setHoveredItem(item.href)}
          />
        );
      })}
      {/* Resume — external; never active, so it collapses to a dot whenever the
          pill collapses (like About), and takes the hover-slide highlight. */}
      <NavItem
        href={RESUME_URL}
        label={t("resume")}
        active={false}
        asDot={collapsed}
        highlighted={RESUME_URL === highlightedHref}
        scope={scope}
        external
        onClick={() => posthog.capture("resume_downloaded")}
        onMouseEnter={() => setHoveredItem(RESUME_URL)}
      />
      {/* Theme toggle — rightmost, after Resume. NOT a NavItem, so it's never a
          dot; when the pill collapses to dots it HIDES entirely (width 0) and
          returns when the pill expands. Owns its own hover-expand otherwise (see
          ThemeToggle). */}
      <ThemeToggle collapsed={collapsed} />
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
  // Set by hovering the top bar (GlobalNav) or this risen pill; while true the
  // pill is forced to the top (see the `docked` computation below).
  const topBarHovered = useSyncExternalStore(
    subscribeNavHover,
    getNavHovered,
    () => false,
  );
  const lastY = useRef(0);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True only for the first render, so the load delay applies to the top pill's
  // initial mount and not to later scroll-up re-entrances. A ref (not state): the
  // effect flips it without a re-render, so it can never cancel the in-flight
  // delayed entrance; the next genuine re-render (a scroll) reads it false.
  const firstMount = useRef(true);

  useEffect(() => {
    // First commit is done; the initial-load delay no longer applies.
    firstMount.current = false;
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

  // Hovering the top bar (or the risen pill) forces the pill up: it just
  // suppresses `docked`, so the existing top/bottom AnimatePresence swap moves it.
  const docked = isMobile || (scrolled && !topBarHovered);
  // Dots only while collapsed AND not hovered; hovering expands the whole pill.
  const showDots = collapsed && !hovered;
  const lifted = !showDots; // expanded labels ride higher

  // inset-x-0 + mx-auto + w-max centers horizontally without a transform, so
  // framer-motion is free to own translateY for the slide.
  //
  // No `initial={false}`: the pill plays its entrance on first mount, so on load
  // the top pill slides down into place (y: -56 → 0). This runs only on a full
  // page load — UniversalNav lives in the layout and persists across client
  // navigations, so it never replays on route changes. Top↔bottom scroll swaps
  // are unaffected (AnimatePresence `initial` governs only the first mount).
  return (
    <AnimatePresence>
      {docked ? (
        <motion.div
          key="bottom"
          // Rides above the iOS home indicator: the 2.5rem base keeps the
          // desktop docked position unchanged (inset resolves to 0 there) and
          // adds real clearance on devices that report a bottom inset.
          className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+2.5rem)] z-40 mx-auto w-max"
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
              <NavPill collapsed={showDots} scope="bottom" />
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="top"
          className="fixed inset-x-0 top-3 z-40 mx-auto w-max"
          // Keep the top-bar-hover signal alive while the cursor is on the risen
          // pill, so moving from the bar onto it doesn't drop it back down.
          onMouseEnter={navHoverEnter}
          onMouseLeave={() => navHoverLeave()}
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={
            firstMount.current ? { ...spring, delay: LOAD_DELAY } : spring
          }
        >
          <NavPill scope="top" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
