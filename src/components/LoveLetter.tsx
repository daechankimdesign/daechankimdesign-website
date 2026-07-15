"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import posthog from "posthog-js";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { Xmark, ArrowRight, ArrowUpRight } from "iconoir-react";
import { EASE_OUT } from "@/lib/motion";
import { Highlighter } from "./Highlighter";
import { HL_COLOR } from "@/lib/highlight";

/* ============================================================================
   Love letter to design — a bottom-sheet modal that slides up over everything
   (z-50, above the nav), starts partial (40vh) and grows to full-screen as you
   scroll. Opened from the footer button OR the envelope. Same on every
   breakpoint. Content reveals on scroll; three phrases get a marker highlight;
   Reply / Forward open mailto with the letter quoted.
   ============================================================================ */

// ---- open/close bridge (footer button + envelope call open()) --------------
type LoveLetterAPI = {
  open: () => void;
  close: () => void;
  // Envelope preview: hovering the footer button (or the envelope) flies the
  // envelope in; leaving schedules it to fly out after a grace period.
  previewShown: boolean;
  previewTilt: number;
  showPreview: () => void;
  hidePreviewSoon: () => void;
};
const LoveLetterContext = createContext<LoveLetterAPI | null>(null);
export const useLoveLetter = () => useContext(LoveLetterContext);

// Client-only gate without a setState-in-effect: false during SSR + hydration,
// true on the client afterward. Keeps portal / off-screen-initial content out of
// SSR while staying lint-clean (vs the old useState + useEffect mount flag).
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

const TILT_MAX = 12; // envelope resting tilt: random in [-TILT_MAX, TILT_MAX] deg
const PREVIEW_HIDE_MS = 3000; // grace after mouse-leave before the envelope flies out

// Portrait from the About page (frontmatter `portrait`).
export const PORTRAIT_SRC =
  "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fabout%2Fportrait.png?alt=media";

const EMAIL = "daechankim.design@gmail.com";

// Plain-text letter for the Reply / Forward mailto body (highlights stripped).
const LETTER_PLAIN = `Dear fellow design lovers,

While design constantly evolves alongside intelligent tools, I have always loved that its true beauty is rooted in an understanding of people. This core empathy guides me to prioritize designing the experience rather than any specific medium. Anchored in Massimo Vignelli's famous philosophy that "design is one," my work spans physical objects, spatial environments, and digital interfaces. Across all these mediums, my practice is driven by my endless curiosity to observe how people interact with their world, allowing me to find thoughtful solutions for any context.

My mentor, Josh Owen, taught me that design is fundamentally a way of looking at the world. Once I opened my "design eyes," I realized our everyday surroundings are filled with living design practices. The little things I observe serve either as a profound inspiration for my own taste, or as a system waiting to be improved and shared with the world through my work.

I truly love being a designer because it is so much more than a profession; it is an attitude and a way of life.

From,
Daechan Kim`;

// mailto with a blank composing area at the TOP (cursor lands there) and the
// letter quoted below a rule. Reply -> to me; Forward -> empty recipient.
function mailtoHref(kind: "reply" | "forward") {
  const subject =
    kind === "reply"
      ? "Re: A love letter to design"
      : "Fwd: A love letter to design";
  const body = `\n\n\n-----\nDaechan's love letter to design:\n\n${LETTER_PLAIN}`;
  const to = kind === "reply" ? EMAIL : "";
  return `mailto:${to}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

// ---- marker highlight (CSS, flows + scrolls with the text) ------------------
// Drawn only once its paragraph has revealed AND settled (SettledContext), so it
// never marks a still-moving line — the timing you asked for.
const SettledContext = createContext(false);
// True only once the letter has fully EXPANDED (not during the peek). Highlights
// gate on this so rough-notation neither draws in the preview nor redraws during
// the expand animation — the timing you asked for, and much lighter on resources.
const LetterFullContext = createContext(false);

function Mark({ children }: { children: ReactNode }) {
  const settled = useContext(SettledContext);
  const expanded = useContext(LetterFullContext);
  const reduce = useReducedMotion();
  // The SAME hand-drawn rough-notation marker as the About page / hero (shared
  // HL_COLOR + HL_MARK character), drawn once its paragraph has settled — replaces
  // the old flat CSS-gradient wipe so the letter's highlights read identically to
  // the rest of the site (texture, colour, and draw-in animation all aligned).
  return (
    <Highlighter
      active={settled && expanded}
      color={HL_COLOR}
      animationDuration={reduce ? 0 : 700}
    >
      {children}
    </Highlighter>
  );
}

// ---- one paragraph: cascades in after the sheet settles, then arms its marks -
// Time-based, not scroll-based: the peek is fixed (no scroll to key off) and the
// sheet rotates + slides on entrance, which masks / breaks an IntersectionObserver
// reveal. So each paragraph fades + rises on a staggered delay measured from open,
// and its highlighter wipes in once the line settles (SettledContext).
const REVEAL_BASE = 0.4; // wait for the sheet to arrive before the first line
const REVEAL_STEP = 0.5; // stagger between paragraphs

function RevealP({
  children,
  className = "",
  order = 0,
}: {
  children: ReactNode;
  className?: string;
  order?: number;
}) {
  const reduce = useReducedMotion();
  // `settled` gates the marker draw. Derived (not an effect): reduced motion has
  // no entrance tween to complete, so it counts as settled at once; otherwise it
  // flips true when the reveal tween finishes. Deriving stays reactive to a
  // mid-session reduce-motion change with no setState-in-effect.
  const [animDone, setAnimDone] = useState(false);
  const settled = animDone || !!reduce;
  return (
    <SettledContext.Provider value={settled}>
      <motion.p
        // `relative` makes the paragraph the containing block for rough-notation's
        // absolute SVG, so each mark anchors AT its line (like the hero) and can't
        // drift under the reveal transform.
        className={`ll-line relative ${className}`}
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: EASE_OUT,
          delay: reduce ? 0 : REVEAL_BASE + order * REVEAL_STEP,
        }}
        onAnimationComplete={() => setAnimDone(true)}
      >
        {children}
      </motion.p>
    </SettledContext.Provider>
  );
}

// ---- the letter body -------------------------------------------------------
function LetterBody() {
  // The date the letter is read — top-right, per personal-letter form.
  const [dateLabel] = useState(() =>
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  );
  return (
    <div className="ll-prose">
      <RevealP order={0} className="ll-date">
        {dateLabel}
      </RevealP>
      <RevealP order={1}>Dear fellow design lovers,</RevealP>
      <RevealP order={2}>
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
      <RevealP order={3}>
        My mentor, Josh Owen, taught me that design is fundamentally a way of
        looking at the world. Once I opened my &ldquo;design eyes,&rdquo; I
        realized our everyday surroundings are filled with living design
        practices. The little things I observe serve either as a profound
        inspiration for my own taste, or as a system waiting to be improved and
        shared with the world through my work.
      </RevealP>
      <RevealP order={4}>
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
      <RevealP order={5}>
        From,
        <br />
        Daechan Kim
      </RevealP>
    </div>
  );
}

// ---- the modal -------------------------------------------------------------
// A bottom sheet: slides up clipped at the screen bottom to PARTIAL_VH, then
// grows to full screen once the reader scrolls past GROW_AT_PX. The letter's
// lines cascade in on open (RevealP). No dim overlay; text fills width.
const PARTIAL_VW = 60; // partial-sheet width on desktop (answer: 40vw x1.5)
const MOBILE_VW = 90; // ...and 90vw on mobile (answer)
const PARTIAL_VH = 36; // partial-sheet height
const GROW_AT_PX = 40; // scroll before it expands to full screen (answer: 40px)
const CLOSE_AT_PX = 320; // over-scroll "pull down" past the top to close
const PEEK_DROP_PX = 44; // the peek rests this far below the screen edge, so the
// 3° tilt's lifted bottom corner tucks under the edge (no dark gap) — bottom clips off

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
  // True only after the expand animation has SETTLED at full — gates the
  // highlighter (see LetterFullContext) so it draws once, after the letter is
  // fully open, instead of during the peek or the resize.
  const [expanded, setExpanded] = useState(false);
  // Letter width: 90vw on mobile, 80vw on desktop. Lazy-init from matchMedia (the
  // modal is client-only) so the sheet doesn't flash a width change on open.
  const [peekVw, setPeekVw] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 640px)").matches
      ? MOBILE_VW
      : PARTIAL_VW,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setPeekVw(mq.matches ? MOBILE_VW : PARTIAL_VW);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // Latest `full` in a ref so the gesture listeners can read it WITHOUT `full`
  // in their deps — otherwise a grow/collapse mid-gesture would tear the
  // listeners down and re-init their drag anchors to 0, firing a spurious close.
  const fullRef = useRef(full);
  useEffect(() => {
    fullRef.current = full;
  }, [full]);

  // Full always opens at the very top of the letter. The peek uses overflow-clip
  // (not a scroll container) so it can't be focus-scrolled, but reset on the
  // rising edge too as belt-and-suspenders against any browser momentum re-latch.
  useEffect(() => {
    if (full && scrollerEl) scrollerEl.scrollTo({ top: 0 });
  }, [full, scrollerEl]);

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

  // Gestures. The peek is FIXED (overflow-clip — see the scroller class) and its
  // scroll is swallowed: opening is a DISCRETE action — a downward scroll
  // accumulates to GROW_AT_PX (40px), grows to full, and the rest of that same
  // gesture is absorbed (the letter holds at the top — "scale up only") until the
  // scroll goes idle, so a flick to open never scrolls the letter. Reading then
  // uses native scroll. An upward "pull down" past CLOSE_AT_PX at the top
  // dismisses. Wheel is non-passive so the peek/opening scroll can be prevented.
  useEffect(() => {
    const el = scrollerEl;
    if (!el) return;
    let grow = 0; // downward scroll accumulated in the peek → toward opening
    let pull = 0; // scroll accumulated toward closing
    let startY = 0;
    let pinned = false; // absorbing the opening gesture's leftover scroll
    let pinTimer = 0;
    const atTop = () => el.scrollTop <= 0;
    // Hold the just-opened letter at the top until the opening scroll goes idle.
    const armPin = () => {
      pinned = true;
      clearTimeout(pinTimer);
      pinTimer = window.setTimeout(() => {
        pinned = false;
      }, 200);
    };
    const onWheel = (e: WheelEvent) => {
      if (!fullRef.current) {
        e.preventDefault(); // peek: scroll only scales up, never scrolls the letter
        if (e.deltaY > 0) {
          pull = 0;
          grow += e.deltaY;
          if (grow > GROW_AT_PX) {
            grow = 0;
            setFull(true);
            armPin(); // ignore scroll beyond the 40px that opened it
          }
        } else {
          grow = 0;
          pull += -e.deltaY;
          if (pull > CLOSE_AT_PX) onClose();
        }
      } else if (pinned) {
        e.preventDefault(); // just opened: hold at top, absorb leftover momentum
        el.scrollTo({ top: 0 });
        armPin();
      } else if (atTop() && e.deltaY < 0) {
        pull += -e.deltaY;
        if (pull > CLOSE_AT_PX) onClose();
      } else {
        pull = 0; // reading — native scroll
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      if (!fullRef.current) {
        const dy = y - startY; // >0 finger down (pull), <0 finger up (read more)
        if (-dy > GROW_AT_PX) {
          setFull(true);
          armPin();
        } else if (dy > CLOSE_AT_PX) onClose();
      } else if (pinned) {
        el.scrollTo({ top: 0 }); // hold at top through the opening drag
        armPin();
      } else if (!atTop()) {
        startY = y; // reading: keep the anchor pinned to the top of the content
      } else if (y - startY > CLOSE_AT_PX) {
        onClose();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      clearTimeout(pinTimer);
    };
  }, [scrollerEl, onClose]);

  // Escape closes; focus the panel. (Page scroll is locked by the provider.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <LetterFullContext.Provider value={expanded}>
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
        className="relative overflow-hidden bg-canvas shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.35)] outline-none"
        initial={{
          y: "100%",
          rotate: 3,
          width: `${peekVw}vw`,
          height: `${PARTIAL_VH}dvh`,
        }}
        animate={{
          y: full ? 0 : PEEK_DROP_PX,
          rotate: full ? 0 : 3,
          width: full ? "100vw" : `${peekVw}vw`,
          height: full ? "100dvh" : `${PARTIAL_VH}dvh`,
        }}
        exit={{ y: "100%", rotate: 3 }}
        transition={
          reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
        }
        // Highlights arm only once the letter has settled at full (see
        // LetterFullContext); fullRef.current is the live full/peek state.
        onAnimationComplete={() => setExpanded(fullRef.current)}
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

        {/* Scroll region. Fixed at the peek (overflow-clip, so it is NOT a scroll
            container and can't be focus-scrolled) and always shows the top of the
            letter; scrollable once full. In the peek a click/tap expands it to
            full (so smaller screens don't have to scroll to open it). */}
        <div
          ref={setScrollerEl}
          onClick={full ? undefined : () => setFull(true)}
          className={`ll-scroll h-full overscroll-contain ${
            full ? "overflow-y-auto" : "cursor-pointer overflow-clip"
          }`}
        >
          {/* Text column holds the peek width (peekVw: 60/90vw) and centers when
              the sheet grows to full screen, so the copy never re-wraps. */}
          <div
            style={{ width: `${peekVw}vw` }}
            className="mx-auto max-w-full px-8 pb-24 pt-20 sm:px-16"
          >
            <LetterBody />

            {/* Reply / Forward */}
            <div className="mt-14 flex flex-wrap items-center gap-8">
              <a
                href={mailtoHref("reply")}
                className="link-button hairline-b"
                onClick={() => posthog.capture("love_letter_replied")}
              >
                <span>Reply</span>
                <ArrowRight aria-hidden />
              </a>
              <a
                href={mailtoHref("forward")}
                className="link-button hairline-b"
                onClick={() => posthog.capture("love_letter_forwarded")}
              >
                <span>Forward</span>
                <ArrowUpRight aria-hidden />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom fade — hints there's more letter to read below the peek.
            Fades out once the sheet is full and scrolls natively. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-canvas)] to-transparent"
          initial={{ opacity: 1 }}
          animate={{ opacity: full ? 0 : 1 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
        />
      </motion.div>
    </motion.div>
    </LetterFullContext.Provider>
  );
}

// ---- envelope intro + overlay ----------------------------------------------
// Every open (from the footer button, the envelope, OR anywhere else) plays the
// same intro: a large envelope — wider than the letter — slides up from the
// bottom of the screen, pauses, then slides back out; only then does the letter
// slide in. The sequence is attached to the letter's appearance (gated on
// `open`), so it runs regardless of what triggered it. Reduced motion skips it.
const INTRO_DURATION = 1.0; // total: slide-in 0.4s + pause 0.2s + slide-out 0.4s
const PEEK_VH = 20; // how far the envelope's top peeks above the bottom edge

function EnvelopeIntro({ onDone }: { onDone: () => void }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-full z-50 flex justify-center"
    >
      {/* The envelope sits just BELOW the screen (top-full puts its top at the
          bottom edge); only its top PEEK_VH slides up into view, the rest stays
          clipped under the bottom. Significantly narrower than the letter. */}
      <motion.div
        className="w-[45vw] sm:w-[20vw]"
        initial={{ y: "0vh" }}
        animate={{ y: ["0vh", `-${PEEK_VH}vh`, `-${PEEK_VH}vh`, "0vh"] }}
        transition={{
          duration: INTRO_DURATION,
          times: [0, 0.4, 0.6, 1],
          // springy: overshoot on the way up, anticipate on the way out
          ease: ["backOut", "linear", "backIn"],
        }}
        onAnimationComplete={onDone}
      >
        <EnvelopeGraphic className="h-auto w-full drop-shadow-2xl" />
      </motion.div>
    </div>
  );
}

function LoveLetterOverlay({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  // Envelope intro first, then the letter. Reduced motion goes straight to it.
  const [showLetter, setShowLetter] = useState(!!reduce);
  return (
    <>
      {!reduce && !showLetter && (
        <EnvelopeIntro onDone={() => setShowLetter(true)} />
      )}
      {showLetter && <LoveLetterModal onClose={onClose} />}
    </>
  );
}

// ---- provider (hosts the portal) -------------------------------------------
export function LoveLetterProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Bumped on every open so the overlay gets a fresh key/instance — otherwise a
  // fast close-then-reopen (during the sheet's exit) reuses the same instance and
  // the envelope intro is skipped (showLetter never resets to false).
  const [openId, setOpenId] = useState(0);

  // Envelope preview (footer). Hovering the "Love letter" button — or the
  // envelope itself — flies the envelope in; leaving either schedules a fly-out
  // after PREVIEW_HIDE_MS, the grace period to move the mouse over and click it.
  const [previewShown, setPreviewShown] = useState(false);
  const [previewTilt, setPreviewTilt] = useState(0);
  const shownRef = useRef(false); // avoids re-rolling the tilt on re-hover while shown
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showPreview = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!shownRef.current) {
      shownRef.current = true;
      setPreviewTilt((Math.random() * 2 - 1) * TILT_MAX);
      setPreviewShown(true);
    }
  };
  const hidePreviewSoon = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      shownRef.current = false;
      setPreviewShown(false);
    }, PREVIEW_HIDE_MS);
  };
  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  // Lock the PAGE while the letter is open (intro + peek + full), so scrolling
  // only moves the modal, never the content behind it. This site scrolls on
  // <html> (see globals.css), so locking body overflow alone doesn't hold — lock
  // the documentElement, padding the scrollbar gutter so the page doesn't shift.
  useEffect(() => {
    if (!open) return;
    const doc = document.documentElement;
    const gutter = window.innerWidth - doc.clientWidth;
    const prevOverflow = doc.style.overflow;
    const prevPad = doc.style.paddingRight;
    doc.style.overflow = "hidden";
    if (gutter > 0) doc.style.paddingRight = `${gutter}px`;
    return () => {
      doc.style.overflow = prevOverflow;
      doc.style.paddingRight = prevPad;
    };
  }, [open]);

  const value: LoveLetterAPI = {
    open: () => {
      setOpenId((n) => n + 1);
      setOpen(true);
      posthog.capture("love_letter_opened");
    },
    close: () => setOpen(false),
    previewShown,
    previewTilt,
    showPreview,
    hidePreviewSoon,
  };
  const mounted = useIsMounted();
  return (
    <LoveLetterContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open ? (
              <LoveLetterOverlay
                key={`ll-${openId}`}
                onClose={() => setOpen(false)}
              />
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
        {/* Single feDropShadow (same dy/blur/opacity as the original Figma
            export) instead of the feColorMatrix "hardAlpha x127" knockout chain,
            which Safari clamps differently from Chrome and renders as a doubled /
            darker flap shadow. This primitive is consistent across browsers. */}
        <filter
          id="ll_env_shadow"
          x="-4"
          y="-4"
          width="92"
          height="52"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="1"
            floodColor="#000000"
            floodOpacity="0.12"
          />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * The envelope preview. Flies in from the RIGHT edge of the screen with a random
 * tilt ONLY while the "Love letter" button (or the envelope itself) is hovered;
 * on mouse-leave it waits PREVIEW_HIDE_MS before flying back out, the grace
 * period to slide the cursor over and click it. Clicking opens the letter. The
 * hover state is shared via the provider, so ANY "Love letter to design" trigger
 * on the page (hero, footer, ...) lights up whichever envelope is mounted near
 * it — position it with `className` (absolute, relative to a positioned
 * ancestor). Rendered client-only (mounted gate) so framer's off-screen initial
 * stays out of SSR.
 */
export function EnvelopePreview({ className = "" }: { className?: string }) {
  const ll = useLoveLetter();
  const reduce = useReducedMotion();
  const mounted = useIsMounted();
  const [offX, setOffX] = useState(1400); // start just past the right screen edge

  useEffect(() => {
    if (reduce) return;
    const measure = () =>
      setOffX(Math.round((window.innerWidth || 1200) * 1.15));
    // Refine the off-screen start distance in a rAF (not synchronously in the
    // effect body) so it never setState-s directly in the effect. The envelope is
    // hidden until hover, so the one-frame delay is invisible.
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [reduce]);

  const shown = ll?.previewShown ?? false;
  const tilt = ll?.previewTilt ?? 0;

  if (!mounted) return null;

  return (
    <motion.button
      type="button"
      onClick={() => ll?.open()}
      onMouseEnter={() => ll?.showPreview()}
      onMouseLeave={() => ll?.hidePreviewSoon()}
      aria-label="Open the love letter to design"
      className={`cursor-pointer ${className}`}
      initial={reduce ? false : { x: offX, rotate: 20, opacity: 0 }}
      animate={
        reduce
          ? { opacity: shown ? 1 : 0 }
          : shown
            ? { x: 0, rotate: tilt, opacity: 1 }
            : { x: offX, rotate: 20, opacity: 0 }
      }
      transition={
        reduce ? { duration: 0 } : { type: "spring", stiffness: 80, damping: 18 }
      }
      whileHover={reduce ? undefined : { y: -4 }}
      whileTap={reduce ? undefined : { scale: 0.94 }}
    >
      <EnvelopeGraphic className="drop-shadow-lg" />
    </motion.button>
  );
}

/**
 * Portrait + envelope preview (footer). The envelope is tucked at the portrait's
 * bottom-right corner — see EnvelopePreview for the fly-in behavior itself.
 */
export function LoveLetterPortrait({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src={PORTRAIT_SRC}
        alt="Daechan Kim"
        width={520}
        height={560}
        className="h-full w-full object-cover"
        sizes="240px"
      />
      <EnvelopePreview className="absolute -bottom-6 right-6" />
    </div>
  );
}

/** The text "Love letter to design" button (hero + footer). Hovering flies the
 *  envelope in (preview); clicking opens the modal. `arrow` follows the
 *  LinkButton convention: "up-right" (default, as in the footer) or "right"
 *  (the hero's forward-reading CTA). */
export function LoveLetterButton({
  className = "",
  arrow = "up-right",
}: {
  className?: string;
  arrow?: "up-right" | "right";
}) {
  const ll = useLoveLetter();
  const Arrow = arrow === "right" ? ArrowRight : ArrowUpRight;
  return (
    <button
      type="button"
      onClick={() => ll?.open()}
      onMouseEnter={() => ll?.showPreview()}
      onMouseLeave={() => ll?.hidePreviewSoon()}
      className={`link-button hairline-b ${className}`}
    >
      <span>Love letter to design</span>
      <Arrow aria-hidden />
    </button>
  );
}
