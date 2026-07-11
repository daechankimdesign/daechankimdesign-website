"use client";

import {
  createElement,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT, DURATION, DELAY } from "@/lib/motion";

/**
 * Long-form content reveal. Each MDX block fades up the first time it scrolls
 * into view (or immediately if already visible on load), so the body content
 * follows the same entrance motion as the hero cascade — just triggered per
 * block on scroll instead of all at once.
 *
 * Only opacity + transform animate, so there is no layout shift: every block
 * occupies its final space and merely fades/rises into it. Reduced-motion
 * renders the plain element, fully visible.
 *
 * Delay policy: only blocks in the INITIAL viewport on load carry `DELAY.body`
 * so they trail the header. Blocks below the fold reveal with NO delay the
 * moment the reader scrolls to them, so mid-story reading is never held up.
 */

const HIDDEN = { opacity: 0, y: 16 } as const;
const SHOW = { opacity: 1, y: 0 } as const;

// Reveal slightly before the block is fully on-screen so it reads as settled by
// the time the reader reaches it, never lagging behind the scroll.
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

const TAGS = {
  div: motion.div,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  ul: motion.ul,
  ol: motion.ol,
  blockquote: motion.blockquote,
  hr: motion.hr,
} as const;

type Tag = keyof typeof TAGS;

export function RevealBlock({
  as = "div",
  children,
  ...rest
}: {
  as?: Tag;
  children?: ReactNode;
} & Record<string, unknown>) {
  const reduce = useReducedMotion();

  // Default to the header-trailing delay; the ref measures on mount and clears
  // it (→ 0) for any block that starts below the fold. The ref runs at commit,
  // before the whileInView observer can fire, and below-fold blocks aren't in
  // view until long after — so the delay is always correct with no race.
  const [delay, setDelay] = useState<number>(DELAY.body);
  const measured = useRef(false);
  const measure = useCallback((node: HTMLElement | null) => {
    if (!node || measured.current) return;
    measured.current = true;
    if (node.getBoundingClientRect().top >= window.innerHeight) setDelay(0);
  }, []);

  // Headings carry an inline `.hl-mark` wrapper around their text: the side
  // document tab flashes a snug, text-width highlighter over the section title
  // when you jump to it (see src/lib/highlight.ts). Layout-inert — it's just a
  // target box for rough-notation to measure.
  const isHeading = as === "h1" || as === "h2" || as === "h3";
  const inner: ReactNode = isHeading ? (
    <span className="hl-mark">{children}</span>
  ) : (
    children
  );

  if (reduce) return createElement(as, rest, inner);

  const M = TAGS[as];
  // Entrance (framer) sits on M; the position-based edge-fade dim sits on an
  // inner wrapper so the two opacities multiply. The wrapper goes INSIDE M (not
  // around it) so M keeps its own margins — no collapsing surprises. Wrapper tag
  // matches the content model: a phrasing span for text headings/paragraphs, a
  // div for blockquote/media. Lists (ul/ol) and rules (hr) ride along undimmed.
  let content: ReactNode = inner;
  if (isHeading) {
    // `hl-host` is position:relative so rough-notation's absolutely-positioned
    // highlight SVG (inserted here, next to `.hl-mark`) anchors to THIS box —
    // right at the title — instead of bubbling up to the document. That keeps
    // the mark's coordinate space small and scroll-independent, so the flash's
    // clip-path wipe (src/lib/highlight.ts) works for sections anywhere down the
    // page, not just the first couple near the top.
    content = <span className="edge-fade block hl-host">{inner}</span>;
  } else if (as === "p") {
    content = <span className="edge-fade block">{inner}</span>;
  } else if (as === "blockquote" || as === "div") {
    content = <div className="edge-fade">{children}</div>;
  }

  return (
    <M
      ref={measure}
      initial={HIDDEN}
      whileInView={SHOW}
      viewport={VIEWPORT}
      transition={{ duration: DURATION, ease: EASE_OUT, delay }}
      {...rest}
    >
      {content}
    </M>
  );
}
