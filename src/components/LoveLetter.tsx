"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { Xmark, ArrowRight, ArrowUpRight } from "iconoir-react";
import { EASE_OUT } from "@/lib/motion";

/* ============================================================================
   Love letter to design — a bottom-sheet modal that slides up over everything
   (z-50, above the nav), starts partial (40vh) and grows to full-screen as you
   scroll. Opened from the footer button OR the envelope. Same on every
   breakpoint. Content reveals on scroll; three phrases get a marker highlight;
   Reply / Forward open mailto with the letter quoted.
   ============================================================================ */

// ---- open/close bridge (footer button + envelope call open()) --------------
type LoveLetterAPI = { open: () => void; close: () => void };
const LoveLetterContext = createContext<LoveLetterAPI | null>(null);
export const useLoveLetter = () => useContext(LoveLetterContext);

// Portrait from the About page (frontmatter `portrait`).
export const PORTRAIT_SRC =
  "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fabout%2Fportrait.png?alt=media";

const EMAIL = "daechankim.design@gmail.com";

// Plain-text letter for the Reply / Forward mailto body (highlights stripped).
const LETTER_PLAIN = `Dear fellow design lovers,

While design constantly evolves alongside intelligent tools, I have always loved that its true beauty is rooted in an understanding of people. This core empathy guides me to prioritize designing the experience rather than any specific medium. Anchored in Massimo Vignelli's famous philosophy that "design is one," my work spans physical objects, spatial environments, and digital interfaces. Across all these mediums, my practice is driven by my endless curiosity to observe how people interact with their world, allowing me to find thoughtful solutions for any context.

My mentor, Josh Owen, taught me that design is fundamentally a way of looking at the world. Once I opened my "design eyes," I realized our everyday surroundings are filled with living design practices. The little things I observe serve either as a profound inspiration for my own taste, or as a system waiting to be improved and shared with the world through my work.

I truly love being a designer because it is so much more than a profession; it is an attitude and a way of life.

— Daechan Kim`;

// mailto with a blank composing area at the TOP (cursor lands there) and the
// letter quoted below a rule. Reply -> to me; Forward -> empty recipient.
function mailtoHref(kind: "reply" | "forward") {
  const subject =
    kind === "reply"
      ? "Re: A love letter to design"
      : "Fwd: A love letter to design";
  const body = `\n\n\n———\nDaechan's love letter to design:\n\n${LETTER_PLAIN}`;
  const to = kind === "reply" ? EMAIL : "";
  return `mailto:${to}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

// ---- marker highlight (CSS, flows + scrolls with the text) ------------------
// Drawn only once its paragraph has revealed AND settled (SettledContext), so it
// never marks a still-moving line — the timing you asked for.
const SettledContext = createContext(false);

// The modal's own scroll container, used as the IntersectionObserver root so the
// reveal fires per line as it scrolls INTO the letter. Without this, whileInView
// watches the browser viewport and triggers every line at once (no animation).
const ScrollRootContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

function Mark({ children }: { children: ReactNode }) {
  const settled = useContext(SettledContext);
  return (
    <mark className="ll-mark" data-on={settled ? "1" : undefined}>
      {children}
    </mark>
  );
}

// ---- one paragraph: reveals on scroll-into-view, then arms its marks --------
function RevealP({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const root = useContext(ScrollRootContext);
  const [settled, setSettled] = useState(!!reduce);
  useEffect(() => {
    if (reduce) setSettled(true);
  }, [reduce]);
  return (
    <SettledContext.Provider value={settled}>
      <motion.p
        className={`ll-line ${className}`}
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{
          once: true,
          root: root ?? undefined,
          margin: "0px 0px -12% 0px",
        }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        onAnimationComplete={() => setSettled(true)}
      >
        {children}
      </motion.p>
    </SettledContext.Provider>
  );
}

// ---- the letter body -------------------------------------------------------
function LetterBody() {
  return (
    <div className="ll-prose">
      <RevealP>Dear fellow design lovers,</RevealP>
      <RevealP>
        While design constantly evolves alongside intelligent tools, I have
        always loved that its true beauty is rooted in an{" "}
        <Mark>understanding of people</Mark>. This core empathy guides me to
        prioritize designing the experience rather than any specific medium.
        Anchored in Massimo Vignelli&apos;s famous philosophy that{" "}
        <Mark>&ldquo;design is one,&rdquo;</Mark> my work spans physical objects,
        spatial environments, and digital interfaces. Across all these mediums,
        my practice is driven by my endless curiosity to observe how people
        interact with their world, allowing me to find thoughtful solutions for
        any context.
      </RevealP>
      <RevealP>
        My mentor, Josh Owen, taught me that design is fundamentally a way of
        looking at the world. Once I opened my &ldquo;design eyes,&rdquo; I
        realized our everyday surroundings are filled with living design
        practices. The little things I observe serve either as a profound
        inspiration for my own taste, or as a system waiting to be improved and
        shared with the world through my work.
      </RevealP>
      <RevealP>
        I truly love being a designer because it is so much more than a
        profession; it is an attitude and a way of life. As an early-career
        designer eager to grow, I welcome new conversations and shared insights.
        If you want to talk about the industry, share feedback, or simply geek
        out over design, please send me an email to{" "}
        <a href={`mailto:${EMAIL}`} className="ll-email">
          <Mark>{EMAIL}</Mark>
        </a>
        .
      </RevealP>
    </div>
  );
}

// ---- the modal -------------------------------------------------------------
// A bottom sheet: slides up clipped at the screen bottom to PARTIAL_VH, then
// grows to full screen once the reader scrolls past GROW_AT_PX. The letter's
// lines reveal on scroll (ScrollRootContext). No dim overlay; text fills width.
const PARTIAL_VW = 80; // partial-sheet width (answer: 80vw)
const PARTIAL_VH = 40; // partial-sheet height (answer: up to 40vh)
const GROW_AT_PX = 40; // scroll before it expands to full screen (answer: 40px)
const CLOSE_AT_PX = 160; // generous over-scroll "pull down" past the top to close

function LoveLetterModal({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  // The scroller is tracked in STATE, not a plain ref: framer creates the reveal
  // IntersectionObserver in a mount-time layout effect, and a child effect runs
  // BEFORE the parent div's ref attaches — so a plain ref reads null there and
  // the observer silently roots at the browser viewport (every line reveals at
  // once). Tracking the element in state re-runs the observer + the grow
  // listener once it exists.
  const [scrollerEl, setScrollerEl] = useState<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);

  // Reveal root as a RefObject whose identity flips null -> element on mount, so
  // framer re-creates the observer against the scroller (see ScrollRootContext).
  const scrollRoot = useMemo<RefObject<HTMLDivElement | null>>(
    () => ({ current: scrollerEl }),
    [scrollerEl],
  );

  // Collapse back to the peek when the reader scrolls the full letter all the way
  // back to its top. The prevTop guard means it only fires after actually
  // scrolling down first, so a fresh grow (which opens at scrollTop 0) never
  // self-collapses; the scrollable guard avoids the clamp-to-0 bounce.
  useEffect(() => {
    const el = scrollerEl;
    if (!el) return;
    let prevTop = 0;
    const onScroll = () => {
      const top = el.scrollTop;
      if (
        top <= 0 &&
        prevTop > 0 &&
        el.scrollHeight - el.clientHeight > GROW_AT_PX
      )
        setFull(false);
      prevTop = top;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollerEl]);

  // Gestures. The peek is FIXED (overflow hidden — see the scroller class) so it
  // always shows the top of the letter; a downward "read more" gesture grows it
  // to full, which therefore opens at the top (the peek never scrolled). An
  // upward "pull down" past CLOSE_AT_PX dismisses it. In the full letter, native
  // scroll does the reading; only an over-scroll pull at the very top is
  // intercepted to close. Thresholds are deliberately generous.
  useEffect(() => {
    const el = scrollerEl;
    if (!el) return;
    let pull = 0;
    let startY = 0;
    const atTop = () => el.scrollTop <= 0;
    const onWheel = (e: WheelEvent) => {
      if (!full) {
        if (e.deltaY > 0) {
          setFull(true);
          pull = 0;
        } else {
          pull += -e.deltaY;
          if (pull > CLOSE_AT_PX) onClose();
        }
      } else if (atTop() && e.deltaY < 0) {
        pull += -e.deltaY;
        if (pull > CLOSE_AT_PX) onClose();
      } else {
        pull = 0;
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      if (!full) {
        const dy = y - startY; // >0 finger down (pull), <0 finger up (read more)
        if (-dy > GROW_AT_PX) setFull(true);
        else if (dy > CLOSE_AT_PX) onClose();
      } else if (!atTop()) {
        startY = y; // reading: keep the anchor pinned to the top of the content
      } else if (y - startY > CLOSE_AT_PX) {
        onClose();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [scrollerEl, full, onClose]);

  // Lock body scroll while open; Escape closes; focus the panel.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="A love letter to design"
    >
      {/* Transparent click-to-close area — no dim overlay. */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={onClose}
      />

      {/* Bottom sheet — clipped at the screen bottom, rises to PARTIAL_VH, then
          grows to full screen on scroll. Contents scroll inside. */}
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        className="relative overflow-hidden bg-canvas shadow-[0_-20px_60px_-24px_rgba(0,0,0,0.5)] outline-none"
        initial={{
          y: "100%",
          width: `${PARTIAL_VW}vw`,
          height: `${PARTIAL_VH}dvh`,
        }}
        animate={{
          y: 0,
          width: full ? "100vw" : `${PARTIAL_VW}vw`,
          height: full ? "100dvh" : `${PARTIAL_VH}dvh`,
        }}
        exit={{ y: "100%" }}
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 260, damping: 34 }
        }
      >
        {/* Sticky close, top-right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close letter"
          className="absolute right-5 top-5 z-10 text-fg-muted transition-colors hover:text-fg"
        >
          <Xmark width={26} height={26} />
        </button>

        {/* Scroll region — reveal root. Fixed (overflow hidden) at the peek so it
            always shows the top of the letter; scrollable once full. */}
        <div
          ref={setScrollerEl}
          className={`ll-scroll h-full overscroll-contain ${
            full ? "overflow-y-auto" : "overflow-hidden"
          }`}
        >
          <ScrollRootContext.Provider value={scrollRoot}>
            {/* Text column holds the peak width (PARTIAL_VW) and centers when the
                sheet grows to full screen, so the copy never re-wraps. */}
            <div
              style={{ width: `${PARTIAL_VW}vw` }}
              className="mx-auto max-w-full px-8 pb-24 pt-20 sm:px-16"
            >
              <LetterBody />

              {/* Reply / Forward */}
              <div className="mt-14 flex flex-wrap items-center gap-8">
                <a href={mailtoHref("reply")} className="link-button hairline-b">
                  <span>Reply</span>
                  <ArrowRight aria-hidden />
                </a>
                <a
                  href={mailtoHref("forward")}
                  className="link-button hairline-b"
                >
                  <span>Forward</span>
                  <ArrowUpRight aria-hidden />
                </a>
              </div>
            </div>
          </ScrollRootContext.Provider>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---- provider (hosts the portal) -------------------------------------------
export function LoveLetterProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value: LoveLetterAPI = {
    open: () => setOpen(true),
    close: () => setOpen(false),
  };
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <LoveLetterContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open ? (
              <LoveLetterModal key="ll" onClose={() => setOpen(false)} />
            ) : null}
          </AnimatePresence>,
          document.body,
        )}
    </LoveLetterContext.Provider>
  );
}

// ---- triggers (rendered in the footer) -------------------------------------
// The envelope SVG (provided by the owner). White paper + open flap.
function EnvelopeGraphic({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="84"
      height="60"
      viewBox="0 0 84 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="2" width="80" height="60" rx="4" fill="white" />
      <g filter="url(#ll_env_shadow)">
        <path
          d="M45.7516 38.6397C43.5982 40.4534 40.4018 40.4534 38.2484 38.6397L3.99054 9.78624C-0.0203512 6.4081 2.43622 -4.51119e-07 7.74213 0L76.2579 5.82535e-06C81.5638 6.27647e-06 84.0204 6.40812 80.0095 9.78626L45.7516 38.6397Z"
          fill="white"
        />
      </g>
      <defs>
        <filter
          id="ll_env_shadow"
          x="0"
          y="0"
          width="84"
          height="44"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_68_2"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_68_2"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * Portrait + envelope. The portrait (from About) sits with the envelope tucked
 * at its bottom edge; on open the envelope "flies" down to the bottom of the
 * screen as the letter slides up. Clicking the envelope opens the letter.
 */
export function LoveLetterPortrait({ className = "" }: { className?: string }) {
  const ll = useLoveLetter();
  const reduce = useReducedMotion();
  const [flying, setFlying] = useState(false);

  const open = () => {
    if (reduce) {
      ll?.open();
      return;
    }
    setFlying(true);
    ll?.open();
    // reset after the fly so a re-open animates again
    window.setTimeout(() => setFlying(false), 650);
  };

  return (
    <div className={`relative ${className}`}>
      <Image
        src={PORTRAIT_SRC}
        alt="Daechan Kim"
        width={520}
        height={560}
        className="w-full rounded-md object-cover"
        sizes="(max-width: 768px) 60vw, 320px"
      />
      {/* Envelope — sends downward (toward the sheet that slides up) on open. */}
      <motion.button
        type="button"
        onClick={open}
        aria-label="Open the love letter to design"
        className="absolute -bottom-6 right-6 cursor-pointer"
        initial={false}
        animate={
          flying && !reduce
            ? { y: 48, opacity: 0, scale: 0.9 }
            : { y: 0, opacity: 1, scale: 1 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        whileHover={reduce ? undefined : { y: -4 }}
        whileTap={reduce ? undefined : { scale: 0.94 }}
      >
        <EnvelopeGraphic className="drop-shadow-lg" />
      </motion.button>
    </div>
  );
}

/** The text "Love letter to design ↗" button (footer). Opens the modal. */
export function LoveLetterButton({ className = "" }: { className?: string }) {
  const ll = useLoveLetter();
  return (
    <button
      type="button"
      onClick={() => ll?.open()}
      className={`link-button hairline-b ${className}`}
    >
      <span>Love letter to design</span>
      <ArrowUpRight aria-hidden />
    </button>
  );
}
