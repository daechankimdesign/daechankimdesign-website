"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

type Explanation = { title: string; paragraphs: string[]; sources: string[] };

// Highlight colours from the Zeto chat screens.
const MARK = { o: "#fdba8c", g: "#86e5a8" } as const;
const GREEN = "#22c55e";

/** "[[o:text]]" or "[[g:text]]" marks a figure, orange (cost) or green (saving). */
const parse = (text: string) =>
  text.split(/(\[\[[og]:[^\]]+\]\])/).filter(Boolean).map((part) => {
    const m = part.match(/^\[\[([og]):(.+)\]\]$/);
    return m ? { mark: m[1] as "o" | "g", text: m[2] } : { mark: null, text: part };
  });

/** The answer's words, in order, each with its mark (for streaming). */
const words = (paragraphs: string[]) =>
  paragraphs.map((p) =>
    parse(p).flatMap((seg) =>
      seg.text
        .split(/(\s+)/)
        .filter((w) => w.length)
        .map((w) => ({ w, mark: seg.mark })),
    ),
  );

const Zt0 = () => (
  <span className="font-black tracking-tight" style={{ color: GREEN }}>
    zt0
  </span>
);

// How long the finished chat holds before the loop starts over (ms).
const LOOP_HOLD = 4500;

type Phase = "idle" | "explain" | "typing" | "sent" | "thinking" | "answer" | "done";

/**
 * Zeto AI's explanation and follow-up, rebuilt as a working chat (no
 * screenshots). On scroll-in it plays as the product would: the explanation
 * sheet with its sources, the follow-up typed into "Ask Zeto AI" and sent as a
 * bubble, a short thinking beat, then the answer streaming in word by word with
 * its figures marked, ending in the action it recommends. The view keeps the
 * newest line in sight, as a chat does. It loops: the finished chat holds for a
 * few seconds, clears, and plays again while it stays in view. Light UI in both site themes. Reduced motion: the finished chat, still.
 */
export function ZetoChat({
  explanation,
  question,
  basedOn,
  answer = [],
  action,
}: {
  explanation: Explanation;
  question: string;
  /** The line over the answer, e.g. "Based on 3 source documents." */
  basedOn: string;
  answer?: string[];
  /** The button the answer ends in, e.g. "Update payment to $400". */
  action?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.45 });
  // The screen's own entrance: it rises in and comes into focus the first time
  // it reaches the viewport, before the run inside it starts.
  const appeared = useInView(ref, { amount: 0.15, once: true });
  const entrance = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 32, scale: 0.97, filter: "blur(4px)" },
        animate: appeared ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : undefined,
        transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
      };
  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState(0);
  const [shownWords, setShownWords] = useState(0);
  // Each pass of the script; bumping it starts the next loop.
  const [run, setRun] = useState(0);
  // The action button: its own step, after the highlights have swept in.
  const [cta, setCta] = useState(false);
  // The finished chat's exit: it fades up and out of focus as one, then clears.
  const [leaving, setLeaving] = useState(false);
  const all = words(answer);
  const total = all.reduce((n, p) => n + p.length, 0);

  // The script. Every state change runs from a timer, so a new run simply
  // replaces the old one when the chat re-enters view.
  useEffect(() => {
    if (reduce || !inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    // A beat first, so the screen's entrance lands before the chat begins.
    let t = 650;
    at(t, () => {
      setPhase("explain");
      setTyped(0);
      setShownWords(0);
      setCta(false);
    });
    // Typing starts as soon as the explanation is in.
    t += 450;
    at(t, () => setPhase("typing"));
    for (let c = 1; c <= question.length; c++) at(t + c * 38, () => setTyped(c));
    t += question.length * 38 + 450;
    at(t, () => setPhase("sent"));
    t += 500;
    at(t, () => setPhase("thinking"));
    t += 1100;
    at(t, () => setPhase("answer"));
    for (let w = 1; w <= total; w++) at(t + w * 32, () => setShownWords(w));
    t += total * 32 + 300;
    at(t, () => setPhase("done"));
    // Highlights: each paragraph 120ms after the last, each 500ms long; the
    // button follows once the last one has landed.
    at(t + answer.length * 120 + 500 + 350, () => setCta(true));
    // Hold the finished chat, then clear it and play again (while in view).
    t += answer.length * 120 + 850 + LOOP_HOLD;
    at(t, () => setLeaving(true));
    t += 600;
    at(t, () => {
      // Clear the button with the rest, so it is never left on screen alone.
      setPhase("idle");
      setCta(false);
      setLeaving(false);
      scroller.current?.scrollTo({ top: 0 });
    });
    at(t + 450, () => setRun((n) => n + 1));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce, question.length, total, run, answer.length]);

  const finished = reduce || phase === "done";
  const show = (p: Phase) => {
    const order: Phase[] = ["idle", "explain", "typing", "sent", "thinking", "answer", "done"];
    return reduce || order.indexOf(phase) >= order.indexOf(p);
  };
  const visibleWords = finished ? total : shownWords;

  // Keep the newest line in view, as a chat does.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [phase, shownWords, cta, reduce]);

  // Where each paragraph starts in the word count, so streaming can show the
  // first visibleWords words across paragraphs.
  const starts = all.map((_, k) => all.slice(0, k).reduce((n, p) => n + p.length, 0));
  const answerNodes: ReactNode[] = all.map((p, k) => {
    const take = Math.max(0, Math.min(p.length, visibleWords - starts[k]));
    if (!take) return null;
    return (
      <p key={k} className="mt-3 first:mt-0">
        {p.slice(0, take).map((tok, n) =>
          // Spaces inside a marked figure are marked too, so "12 years 9
          // months" reads as one band, as in the screens.
          tok.mark ? (
            // The marks wait for the whole answer, then sweep in left to right.
            <span
              key={n}
              className={reduce ? "" : "transition-[background-size] duration-500 ease-out"}
              style={{
                backgroundImage: `linear-gradient(${MARK[tok.mark]}, ${MARK[tok.mark]})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: finished ? "100% 100%" : "0% 100%",
                transitionDelay: finished ? `${k * 120}ms` : "0ms",
              }}
            >
              {tok.w}
            </span>
          ) : (
            <span key={n}>{tok.w}</span>
          ),
        )}
      </p>
    );
  });

  const fade = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10, filter: "blur(3px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const, delay },
        };

  return (
    <div ref={ref} className="my-10 flex justify-center bg-surface-panel px-4 py-8 sm:py-10">
      <motion.div {...entrance} className="flex h-[38rem] w-full max-w-[360px] flex-col overflow-hidden rounded-[28px] bg-white text-[#1e1e1e] shadow-[0_2px_6px_-2px_rgba(0,0,0,0.06),0_16px_36px_-12px_rgba(0,0,0,0.18)]">
        {/* Sheet header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <p className="text-[16px] font-semibold" style={{ color: GREEN }}>
            <Zt0 /> Zeto AI
          </p>
          <svg aria-hidden width="14" height="14" viewBox="0 0 12 12" stroke="#6f6f6f" strokeWidth="1.4" strokeLinecap="round">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </div>

        {/* The conversation */}
        <div
          ref={scroller}
          className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 [scrollbar-width:none]"
          aria-live="polite"
          style={{
            opacity: leaving ? 0 : 1,
            transform: leaving ? "translateY(-14px)" : "none",
            filter: leaving ? "blur(4px)" : "none",
            transition: leaving ? "opacity 0.55s ease-in, transform 0.55s ease-in, filter 0.55s ease-in" : "none",
          }}
        >
          {show("explain") ? (
            <motion.div {...fade()}>
              <p className="mt-2 text-[16px] font-bold">{explanation.title}</p>
              {explanation.paragraphs.map((t, k) => (
                <p key={k} className="mt-2 text-[13px] leading-snug">
                  {t}
                </p>
              ))}
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-[#6f6f6f]">
                Sources:
                {explanation.sources.map((s) => (
                  <span key={s} className="rounded-[2px] px-1 text-[#1e1e1e]" style={{ background: MARK.g }}>
                    {s}
                  </span>
                ))}
              </p>
            </motion.div>
          ) : null}

          <AnimatePresence>
            {show("sent") ? (
              <motion.div key="q" className="mt-5 flex justify-end" {...fade()}>
                <p className="max-w-[78%] rounded-2xl rounded-br-md bg-[#eef1f4] px-4 py-3 text-[14px] leading-snug">{question}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {show("thinking") ? (
            <motion.div className="mt-5" {...fade()}>
              <p className="flex items-center gap-2 text-[11px] text-[#6f6f6f]">
                <Zt0 /> {basedOn}
              </p>
              {phase === "thinking" && !reduce ? (
                <div className="mt-3 flex gap-1" aria-label="Zeto AI is writing">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-[#9aa1a9]"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-[14px] leading-relaxed">{answerNodes}</div>
              )}
            </motion.div>
          ) : null}

          {/* The action arrives once the highlights have swept in (each paragraph
              120ms apart, 500ms long), so the figures are read before the button. */}
          {(reduce || cta) && action ? (
            <motion.div {...fade()}>
              <div className="mt-5 flex h-10 items-center justify-center rounded-xl bg-[#26262e] text-[13px] font-semibold text-white">
                {action}
              </div>
            </motion.div>
          ) : null}
        </div>

        {/* Ask Zeto AI */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 rounded-xl border-2 border-[#5fd68a] py-1.5 pr-1.5 pl-3">
            <p className="min-w-0 flex-1 truncate text-[13px]">
              {phase === "typing" ? (
                <>
                  {question.slice(0, typed)}
                  <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-[#1e1e1e]" />
                </>
              ) : (
                <span className="text-[#9aa1a9]">| Ask Zeto AI</span>
              )}
            </p>
            <motion.span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
              style={{ background: GREEN }}
              animate={phase === "sent" && !reduce ? { scale: [1, 0.86, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f3d1f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </motion.span>
          </div>
          <p className="mt-2 text-center text-[9px] text-[#8a8a8a]">Zeto AI is an artificial intelligence and can make mistakes.</p>
        </div>
      </motion.div>
    </div>
  );
}
