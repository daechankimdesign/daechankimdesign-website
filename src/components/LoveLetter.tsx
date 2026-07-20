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
  // Trigger: continue the hover envelope (or play the whole rise→drop if it
  // wasn't raised) and then open the letter.
  open: () => void;
  close: () => void;
  // Hovering a trigger (or the envelope itself) RAISES the envelope to its peak;
  // leaving schedules it to drop back out after a grace period.
  previewShown: boolean;
  // A click-commit is animating (envelope dropping before the letter mounts).
  committing: boolean;
  // The letter modal is mounted.
  letterOpen: boolean;
  // Called by the envelope stage once its drop lands → mount the letter.
  finishIntro: () => void;
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

const PREVIEW_HIDE_MS = 500; // grace after mouse-leave before the envelope drops
// (long enough to travel from the trigger to the risen envelope and click it)

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
const MOBILE_VW = 100; // ...and full-width on mobile (answer)
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

// ---- envelope stage (hover-driven) -----------------------------------------
// The envelope no longer flies in from the side. Hovering ANY "Love letter"
// trigger RAISES a large envelope from the bottom of the screen to a peak, where
// it holds. Clicking CONTINUES the motion — the envelope drops back down and the
// letter slides in behind it. Moving off without clicking simply DROPS the
// envelope back out; nothing opens. One persistent, client-only stage serves
// every trigger on the page. Reduced motion skips it (straight to the letter).
const PEEK_VH = 40; // how far the envelope's top peeks above the bottom edge
const RISE_DUR = 0.4; // envelope rise (hover) duration
const DROP_DUR = 0.4; // envelope drop (leave / commit) duration
const PEEK_TILT = 6; // resting tilt at the peak (deg)

const PEEK = { y: `-${PEEK_VH}vh`, rotate: -PEEK_TILT }; // risen, held at the peak
const REST = { y: "0vh", rotate: 0 }; // hidden below the bottom edge
const LANDED = { y: "0vh", rotate: PEEK_TILT }; // dropped after a commit (slight lean)

function EnvelopeStage() {
  const ll = useLoveLetter();
  const reduce = useReducedMotion();
  const peeked = ll?.previewShown ?? false;
  const committing = ll?.committing ?? false;
  const letterOpen = ll?.letterOpen ?? false;

  // The click-commit is a small two-step: rise (only if not already peaked) then
  // drop, then mount the letter. It's driven by DETERMINISTIC TIMERS matching the
  // leg durations — NOT onAnimationComplete/await (animation-completion events
  // can stall, e.g. under StrictMode's double-mount or a throttled tab, leaving
  // the intro hung). "idle" = not committing. The envelope still ANIMATES to each
  // phase's target declaratively; the timers only sequence the phases + finish.
  const [commitPhase, setCommitPhase] = useState<"idle" | "rise" | "drop">("idle");
  useEffect(() => {
    if (!committing) {
      setCommitPhase("idle");
      return;
    }
    if (reduce) {
      ll?.finishIntro();
      return;
    }
    const needsRise = !peeked; // already at the peak (hover→click) ⇒ skip the rise
    setCommitPhase(needsRise ? "rise" : "drop");
    const timers: ReturnType<typeof setTimeout>[] = [];
    let at = 0;
    if (needsRise) {
      at += RISE_DUR * 1000;
      timers.push(setTimeout(() => setCommitPhase("drop"), at));
    }
    at += DROP_DUR * 1000;
    timers.push(setTimeout(() => ll?.finishIntro(), at));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committing, reduce]);

  // Resolve the current animation target.
  let target: { y: string; rotate: number };
  if (committing) target = commitPhase === "rise" ? PEEK : LANDED;
  else if (letterOpen) target = REST;
  else target = peeked ? PEEK : REST;

  // Rising overshoots (backOut); dropping anticipates (backIn).
  const goingUp = target.y !== "0vh";
  const transition = reduce
    ? { duration: 0 }
    : {
        duration: goingUp ? RISE_DUR : DROP_DUR,
        ease: (goingUp ? "backOut" : "backIn") as "backOut" | "backIn",
      };

  if (reduce) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-full z-50 flex justify-center">
      {/* The envelope rests just BELOW the screen (top-full puts its top at the
          bottom edge); rising translates it up by PEEK_VH into view. Hovering it
          keeps it up (grace period) and clicking it opens — same as the trigger. */}
      <motion.button
        type="button"
        aria-label="Open the love letter to design"
        onClick={() => ll?.open()}
        onMouseEnter={() => ll?.showPreview()}
        onMouseLeave={() => ll?.hidePreviewSoon()}
        className="pointer-events-auto w-[45vw] cursor-pointer sm:w-[20vw]"
        initial={REST}
        animate={target}
        transition={transition}
      >
        <EnvelopeGraphic className="h-auto w-full drop-shadow-2xl" />
      </motion.button>
    </div>
  );
}

// ---- provider (hosts the portal) -------------------------------------------
export function LoveLetterProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false); // letter modal mounted
  const [committing, setCommitting] = useState(false); // click intro in flight
  // Bumped on every open so the modal gets a fresh key/instance — otherwise a
  // fast close-then-reopen (during the sheet's exit) reuses the same instance.
  const [openId, setOpenId] = useState(0);

  // Hover state. Hovering a "Love letter" trigger — or the envelope itself —
  // RAISES the envelope to its peak; leaving either schedules it to DROP back out
  // after PREVIEW_HIDE_MS, the grace period to travel to the envelope and click.
  const [previewShown, setPreviewShown] = useState(false);
  const shownRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showPreview = () => {
    if (open || committing) return; // the intro/letter own the envelope now
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!shownRef.current) {
      shownRef.current = true;
      setPreviewShown(true);
    }
  };
  const hidePreviewSoon = () => {
    if (committing) return; // a commit is dropping it already
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      shownRef.current = false;
      setPreviewShown(false);
    }, PREVIEW_HIDE_MS);
  };
  const clearPeek = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    shownRef.current = false;
    setPreviewShown(false);
  };
  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  // Lock the PAGE while the intro is committing OR the letter is open, so
  // scrolling only moves the modal, never the content behind it. This site
  // scrolls on <html> (see globals.css), so locking body overflow alone doesn't
  // hold — lock the documentElement, padding the scrollbar gutter to avoid shift.
  useEffect(() => {
    if (!open && !committing) return;
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
  }, [open, committing]);

  const value: LoveLetterAPI = {
    open: () => {
      posthog.capture("love_letter_opened");
      if (hideTimer.current) clearTimeout(hideTimer.current);
      // Reduced motion has no envelope — go straight to the letter.
      if (reduce) {
        setOpenId((n) => n + 1);
        setOpen(true);
        return;
      }
      // Otherwise hand off to the envelope stage: it continues the intro (drop,
      // rising first if needed) and calls finishIntro when the envelope lands.
      setCommitting(true);
    },
    close: () => {
      setOpen(false);
      setCommitting(false);
      clearPeek();
    },
    previewShown,
    committing,
    letterOpen: open,
    finishIntro: () => {
      setOpenId((n) => n + 1);
      setOpen(true);
      setCommitting(false);
      clearPeek();
    },
    showPreview,
    hidePreviewSoon,
  };
  const mounted = useIsMounted();
  return (
    <LoveLetterContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <>
            {/* Persistent hover envelope (client-only) — serves every trigger. */}
            <EnvelopeStage />
            <AnimatePresence>
              {open ? (
                <LoveLetterModal
                  key={`ll-${openId}`}
                  onClose={() => value.close()}
                />
              ) : null}
            </AnimatePresence>
          </>,
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
 * Portrait (footer). The hover envelope is now a single page-wide stage (see
 * EnvelopeStage), so the portrait is just the image.
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
    </div>
  );
}

/** The text "Love letter to design" button (hero + footer). Hovering RAISES the
 *  envelope (see EnvelopeStage); clicking opens the letter. `arrow` follows the
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
