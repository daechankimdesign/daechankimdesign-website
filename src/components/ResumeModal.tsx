"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Xmark, ArrowUpRight, Download } from "iconoir-react";
import posthog from "posthog-js";
import { RESUME_URL } from "@/lib/links";

// pdf.js is the bulk of this feature's weight, so the renderer is a separate
// chunk fetched on FIRST OPEN, never on first paint. ssr:false because pdf.js
// needs a DOM (and a worker) — there is nothing to render on the server.
const ResumeDocument = dynamic(() => import("./ResumeDocument"), {
  ssr: false,
});

/* ============================================================================
   Resume viewer — the live PDF presented as the SAME bottom sheet as the love
   letter (LoveLetter.tsx): it slides up clipped at the screen bottom, rests as
   a tilted peek, and grows to full screen on a scroll or a click. No dim
   overlay; Escape / click-outside / Xmark close; the page behind is locked.

   The sheet mechanics below are deliberately a mirror of LoveLetterModal — same
   constants, same gesture thresholds — so the two modals feel identical. If one
   changes, change both. (They are duplicated rather than shared because the
   letter's sheet is entangled with its highlight-timing contexts; extracting a
   common <BottomSheet> is a worthwhile follow-up, not a change to make blind.)

   The document itself: a single US Letter page (verified — /Count 1, MediaBox
   [0 0 612 792]). It is laid into the sheet's own scroll column at the column's
   width with the paper's exact aspect, so it reads as a sheet of paper on the
   sheet, exactly like the letter's text column — no viewer chrome, no
   letterboxed void.
   ============================================================================ */

type ResumeAPI = { open: (source: string) => void; close: () => void };
const ResumeContext = createContext<ResumeAPI | null>(null);
export const useResume = () => useContext(ResumeContext);

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

// ---- sheet geometry (identical to LoveLetterModal) -------------------------
const PARTIAL_VW = 80; // peek width on desktop
const MOBILE_VW = 100; // ...and full-width on mobile
const PARTIAL_VH = 36; // peek height
const GROW_AT_PX = 40; // scroll accumulated in the peek before it opens full
const CLOSE_AT_PX = 320; // over-scroll "pull down" past the top to close
const PEEK_DROP_PX = 44; // peek rests this far below the edge so the 3° tilt tucks in

function ResumeModal({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  // Tracked in STATE, not a ref: the gesture/scroll effects below must re-run
  // once the element exists (a child effect runs before the parent ref attaches).
  const [scrollerEl, setScrollerEl] = useState<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
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
  // in their deps — otherwise a grow mid-gesture tears the listeners down and
  // re-inits their drag anchors, firing a spurious close.
  const fullRef = useRef(full);
  useEffect(() => {
    fullRef.current = full;
  }, [full]);

  // Full always opens at the top of the document.
  useEffect(() => {
    if (full && scrollerEl) scrollerEl.scrollTo({ top: 0 });
  }, [full, scrollerEl]);

  // Collapse back to the peek when scrolled all the way back to the top. The
  // prevTop guard means it only fires after actually scrolling down first, so a
  // fresh grow (which opens at scrollTop 0) never self-collapses.
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

  // Gestures, same as the letter: in the peek a downward scroll accumulates to
  // GROW_AT_PX and opens full (the rest of that gesture is absorbed so a flick
  // never scrolls the document); an upward pull past CLOSE_AT_PX at the top
  // dismisses. Wheel is non-passive so the peek's scroll can be prevented.
  useEffect(() => {
    const el = scrollerEl;
    if (!el) return;
    let grow = 0;
    let pull = 0;
    let startY = 0;
    let pinned = false;
    let pinTimer = 0;
    const atTop = () => el.scrollTop <= 0;
    const armPin = () => {
      pinned = true;
      clearTimeout(pinTimer);
      pinTimer = window.setTimeout(() => {
        pinned = false;
      }, 200);
    };
    const onWheel = (e: WheelEvent) => {
      if (!fullRef.current) {
        e.preventDefault();
        if (e.deltaY > 0) {
          pull = 0;
          grow += e.deltaY;
          if (grow > GROW_AT_PX) {
            grow = 0;
            setFull(true);
            armPin();
          }
        } else {
          grow = 0;
          pull += -e.deltaY;
          if (pull > CLOSE_AT_PX) onClose();
        }
      } else if (pinned) {
        e.preventDefault();
        el.scrollTo({ top: 0 });
        armPin();
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
      if (!fullRef.current) {
        const dy = y - startY;
        if (-dy > GROW_AT_PX) {
          setFull(true);
          armPin();
        } else if (dy > CLOSE_AT_PX) onClose();
      } else if (pinned) {
        el.scrollTo({ top: 0 });
        armPin();
      } else if (!atTop()) {
        startY = y;
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
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Resume"
    >
      {/* Transparent click-to-close area — no dim overlay, same as the letter. */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={onClose}
      />

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
      >
        {/* Sticky close, top-right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close resume"
          className="absolute right-5 top-5 z-10 text-fg-muted transition-colors hover:text-fg"
        >
          <Xmark width={26} height={26} />
        </button>

        {/* Scroll region. Fixed at the peek (overflow-clip, so it is NOT a scroll
            container) and always shows the top of the page; scrollable once full.
            In the peek a click/tap expands it, so small screens don't have to
            scroll to open it. */}
        <div
          ref={setScrollerEl}
          onClick={full ? undefined : () => setFull(true)}
          className={`h-full overscroll-contain ${
            full ? "overflow-y-auto" : "cursor-pointer overflow-clip"
          }`}
        >
          {/* Same column geometry as the letter's prose: holds the peek width and
              centers when the sheet grows, so the page never resizes mid-open.
              UNPADDED, unlike the letter's text column — the resume is a sheet of
              paper, so it runs flush to the sheet's edges rather than sitting in
              a margin. */}
          <div
            style={{ width: `${peekVw}vw` }}
            className="mx-auto max-w-full"
          >
            {/* The page itself — a canvas + text + link layers rendered straight
                into this column by react-pdf (see ResumeDocument). Being real
                DOM, wheel and touch bubble to the scroller below, so the
                peek-to-grow gesture and the sheet's scroll work exactly as the
                letter's do, while the text stays selectable and the resume's
                links stay clickable. */}
            <ResumeDocument />

            {/* Same action row as the letter's Reply / Forward. It carries its
                OWN padding because the column above is flush (see the note there).
                Download hits the proxy with ?download=1, which sets
                Content-Disposition: attachment — a `download` attribute alone is
                ignored cross-origin, so the Storage URL could never force a save. */}
            <div className="mt-14 flex flex-wrap items-center gap-8 px-8 pb-24 sm:px-16">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
                  this is a file download from a route handler, not a page: a
                  next/link would try to client-side route to a PDF. */}
              <a
                href="/api/resume?download=1"
                className="link-button hairline-b"
                onClick={() =>
                  posthog.capture("resume_downloaded", { from: "modal" })
                }
              >
                <span>Download</span>
                <Download aria-hidden />
              </a>
              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="link-button hairline-b"
                onClick={() => posthog.capture("resume_opened_new_tab")}
              >
                <span>Open in new tab</span>
                <ArrowUpRight aria-hidden />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom fade — hints there's more below the peek; gone once full. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-canvas)] to-transparent"
          initial={{ opacity: 1 }}
          animate={{ opacity: full ? 0 : 1 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Hosts the resume sheet + the open/close bridge. Mount once, high in the tree
 * (the locale layout), so any trigger can call `useResume()?.open(source)`.
 */
export function ResumeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Bumped on every open so a fast close-then-reopen (during the sheet's exit)
  // gets a fresh instance rather than reusing the old one — same as the letter.
  const [openId, setOpenId] = useState(0);
  const mounted = useIsMounted();

  // Lock the PAGE while the sheet is up. This site scrolls on <html> (see
  // globals.css), so locking body overflow alone does not hold — lock
  // documentElement and pad the scrollbar gutter to avoid a layout shift.
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

  const close = useCallback(() => setOpen(false), []);
  const value: ResumeAPI = {
    open: (source: string) => {
      posthog.capture("resume_opened", { source });
      setOpenId((n) => n + 1);
      setOpen(true);
    },
    close,
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open ? (
              <ResumeModal key={`resume-${openId}`} onClose={close} />
            ) : null}
          </AnimatePresence>,
          document.body,
        )}
    </ResumeContext.Provider>
  );
}
