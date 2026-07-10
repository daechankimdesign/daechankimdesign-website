"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

// Hero cadence — one line every STEP ms (mirrors HeroHeadline). Keep the item
// tween (0.55s below) strictly < STEP so each line settles before the next.
const STEP = 600;

const SeqContext = createContext<{ count: number; reduce: boolean }>({
  // Safe default (no provider): everything shown.
  count: Number.POSITIVE_INFINITY,
  reduce: true,
});

/**
 * Reusable copy of the hero's text-reveal sequence. Wrapped lines (SequenceItem)
 * light up one every `step` ms, top-to-bottom, on a fade-up. The whole thing
 * plays when it scrolls into view and REPLAYS on re-entry (IntersectionObserver
 * resets on leave), so a footer at the bottom of the page animates each time the
 * reader reaches it. Reduced-motion shows everything at once. Only opacity /
 * transform animate, so nothing below shifts.
 */
export function SequenceReveal({
  children,
  className,
  total,
  step = STEP,
  trigger = "inview",
}: {
  children: ReactNode;
  className?: string;
  total: number;
  step?: number;
  // "inview": play when the block scrolls into view (default). "bottom": play
  // only when the PAGE is scrolled fully to the bottom — used by the reveal
  // footer, which is always in the viewport (sticky), so "in view" can't gate it.
  trigger?: "inview" | "bottom";
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduce) {
      // Reduced-motion: show everything at once (intentional one-shot sync set).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(total);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let n = 0;
    let t: ReturnType<typeof setTimeout>;
    const build = () => {
      n += 1;
      setCount(n);
      if (n < total) t = setTimeout(build, step);
    };
    const play = () => {
      clearTimeout(t);
      n = 0;
      setCount(0);
      t = setTimeout(build, step);
    };
    const reset = () => {
      clearTimeout(t);
      n = 0;
      setCount(0);
    };

    // "bottom" mode: play once the reveal footer is (nearly) fully uncovered, and
    // — with HYSTERESIS — only reset once it's scrolled back to nearly hidden, so
    // a small scroll-up doesn't kill it. The reveal band ≈ the footer's own height
    // (this container ≈ the footer), so the thresholds scale with screen/content.
    // rAF-throttled so the scroll listener stays cheap.
    if (trigger === "bottom") {
      let playing = false;
      let raf = 0;
      // Fractions of the footer height, measured from the page's true bottom:
      // PLAY when within 10% of the bottom (footer ~90% uncovered); RESET only
      // past 85% away (footer ~15% uncovered).
      const PLAY_AT = 0.1;
      const RESET_AT = 0.85;
      const check = () => {
        raf = 0;
        const band = Math.max(1, el.offsetHeight);
        const distFromBottom =
          document.documentElement.scrollHeight -
          (window.scrollY + window.innerHeight);
        if (!playing && distFromBottom <= band * PLAY_AT) {
          playing = true;
          play();
        } else if (playing && distFromBottom > band * RESET_AT) {
          playing = false;
          reset();
        }
      };
      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(check);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      check();
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        if (raf) cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    }

    // Starts hidden; the observer's first callback plays it if it's already in
    // view, otherwise it waits until the reader scrolls the block into view.
    let visible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!visible) {
            visible = true;
            play();
          }
        } else if (visible) {
          visible = false;
          reset();
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, [reduce, total, step, trigger]);

  return (
    <SeqContext.Provider value={{ count, reduce: !!reduce }}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </SeqContext.Provider>
  );
}

const TAGS = {
  div: motion.div,
  p: motion.p,
  span: motion.span,
} as const;

/**
 * One line inside a SequenceReveal. Fades up once the sequence count passes its
 * `order`. Matches the hero clause tween (0.55s, EASE_OUT).
 */
export function SequenceItem({
  order,
  as = "div",
  className,
  children,
}: {
  order: number;
  as?: keyof typeof TAGS;
  className?: string;
  children: ReactNode;
}) {
  const { count, reduce } = useContext(SeqContext);
  const shown = reduce || order < count;
  const M = TAGS[as];
  return (
    <M
      className={className}
      initial={false}
      animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 16 }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
    >
      {children}
    </M>
  );
}
