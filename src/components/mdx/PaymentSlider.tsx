"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

type Alert = {
  /** "warning" (red) or "advice" (green). */
  tone: "warning" | "advice";
  /** e.g. "AI Warning". */
  kind: string;
  /** The alert's line; wrap the figure in [[double brackets]] to colour it. */
  title: string;
  /** The smaller line under it. */
  sub: string;
};

type Stop = {
  /** Under the track, e.g. "Minimum". A "suggest" stop gets the zt0 mark. */
  label: string;
  /** Over the amount, e.g. "Minimum Payment". */
  title: string;
  amount: number;
  /** Where the stop sits along the track, 0 to 1. */
  at: number;
  tone: "warn" | "suggest" | "pay";
  /** Alerts raised at this stop. They dismiss when the stop changes. */
  alerts?: Alert[];
};

// Colours from the Zeto screens.
const FILL = { warn: "#ef4444", suggest: "#34c45c", pay: "#0ba5ec" } as const;
const ALERT = { warning: "#dc2626", advice: "#16a34a" } as const;
// ms on each stop while it plays by itself, the same at every stop, counted
// from the stop change (its alerts rise in within the first second).
const HOLD = 2200;
const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Zt0 = ({ color }: { color: string }) => (
  <span className="font-black tracking-tight" style={{ color }}>
    zt0
  </span>
);

// "[[figure]]" in an alert line renders in the alert's colour.
const coloured = (text: string, color: string): ReactNode[] =>
  text.split(/(\[\[[^\]]+\]\])/).map((part, k) =>
    part.startsWith("[[") ? (
      <span key={k} style={{ color }}>
        {part.slice(2, -2)}
      </span>
    ) : (
      part
    ),
  );

/**
 * Zeto's Make Payment screen, rebuilt as a working component (flat, no device
 * frame) rather than screenshots. It plays through the slider's stops when it
 * scrolls into view: the bar fills to the stop in that stop's colour and the
 * amount counts to the new figure. Alerts belong to a stop: at the minimum,
 * the AI Warning and AI Advice are raised; moving to another stop dismisses
 * them (they slide away and the space closes), and they come back with the
 * minimum. A visitor can click a stop label, or drag along the track and let
 * go to snap to the nearest stop; either pauses the playback for a while. The
 * screen keeps the app's light UI in both site themes. Reduced motion: no
 * playback and no tweening; clicks still work.
 */
export function PaymentSlider({
  balance,
  apr,
  stops = [],
  account,
}: {
  balance: number;
  /** The card's rate, stated on the screen, e.g. "22.99% APR". */
  apr?: string;
  stops?: Stop[];
  /** The account row at the foot: bank and account name. */
  account?: { bank: string; name: string };
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
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
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(stops[0]?.amount ?? 0);
  const [drag, setDrag] = useState<number | null>(null);
  const [pausedUntil, setPausedUntil] = useState(0);
  // The run is live once the screen is in view: the first stop's alerts rise
  // in a beat after it arrives (after its entrance, the first time), so the start is seen, not found already done.
  // Leaving view resets it to the first stop, to play again on return.
  const [live, setLive] = useState(false);
  const from = useRef(shown);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => {
      setLive(inView);
      if (!inView) setI(0);
    }, inView ? 450 : 0);
    return () => clearTimeout(t);
  }, [inView, reduce]);

  useEffect(() => {
    if (reduce || !live || stops.length < 2) return;
    const hold = HOLD;
    const wait = Math.max(hold, pausedUntil - Date.now());
    const t = setTimeout(() => setI((n) => (n + 1) % stops.length), wait);
    return () => clearTimeout(t);
  }, [i, live, reduce, stops, pausedUntil]);

  useEffect(() => {
    const target = stops[i]?.amount ?? 0;
    const start = from.current;
    if (reduce) {
      from.current = target;
      const id = requestAnimationFrame(() => setShown(target));
      return () => cancelAnimationFrame(id);
    }
    const t0 = performance.now();
    let id = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 700);
      const v = start + (target - start) * (1 - Math.pow(1 - k, 3));
      from.current = v;
      setShown(v);
      if (k < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [i, reduce, stops]);

  if (!stops.length) return null;
  const stop = stops[i];
  const pos = drag ?? stop.at;
  const choose = (n: number) => {
    setI(n);
    setPausedUntil(Date.now() + 8000);
  };
  const nearest = (x: number) =>
    stops.reduce((best, s, n) => (Math.abs(s.at - x) < Math.abs(stops[best].at - x) ? n : best), 0);
  const fraction = (e: ReactPointerEvent) => {
    const r = track.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };
  // Ticks and labels sit inside the track's rounded ends.
  const place = (at: number) => `calc(0.85rem + (100% - 1.7rem) * ${at})`;

  return (
    <div ref={ref} className="my-10 flex justify-center bg-surface-panel px-4 py-8 sm:py-10">
      <motion.div {...entrance} className="w-full max-w-[360px] overflow-hidden rounded-[28px] bg-[#f5f7f9] text-[#1e1e1e] shadow-[0_2px_6px_-2px_rgba(0,0,0,0.06),0_16px_36px_-12px_rgba(0,0,0,0.18)]">
        {/* Nav */}
        <div className="relative flex items-center justify-center px-5 pt-5 pb-3">
          <p className="text-[14px] font-semibold">Make Payment</p>
        </div>

        <div className="px-5" role="group" aria-label="Payment amount">
          <p className="mt-2 text-[15px] font-semibold">{stop.title}</p>
          <p className="text-[34px] leading-tight font-extrabold tracking-tight tabular-nums">{fmt(shown)}</p>
          <p className="text-[13px] text-[#6f6f6f]">
            out of {fmt(balance)} total balance{apr ? ` · ${apr}` : ""}
          </p>

          {/* Track: a rounded rectangle, as in the screens. Tap or drag; it
              snaps to the nearest stop on release. */}
          <div
            ref={track}
            className="relative mt-4 h-9 cursor-pointer touch-none rounded-[8px] bg-[#d9dadd]"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setDrag(fraction(e));
              setPausedUntil(Date.now() + 8000);
            }}
            onPointerMove={(e) => {
              if (drag !== null) setDrag(fraction(e));
            }}
            onPointerUp={(e) => {
              if (drag === null) return;
              const n = nearest(fraction(e));
              setDrag(null);
              choose(n);
            }}
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.18)] ${drag === null && !reduce ? "transition-[width,background-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" : ""}`}
              style={{ width: `calc(1.7rem + (100% - 1.7rem) * ${pos})`, background: FILL[stop.tone] }}
            />
            {stops.map((s) => (
              <span
                key={s.label}
                aria-hidden
                className="absolute top-1/2 h-[18px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                style={{ left: place(s.at) }}
              />
            ))}
          </div>
          <div className="relative mt-1.5 h-4">
            {stops.map((s, n) => (
              <button
                key={s.label}
                type="button"
                aria-pressed={n === i}
                onClick={() => choose(n)}
                className={`absolute text-[10px] whitespace-nowrap ${n === 0 ? "" : n === stops.length - 1 ? "-translate-x-full" : "-translate-x-1/2"} ${n === i ? "font-semibold" : ""} ${
                  s.tone === "suggest" ? "text-[#16a34a]" : "text-[#6f6f6f]"
                }`}
                style={{ left: n === 0 ? 0 : n === stops.length - 1 ? "100%" : place(s.at) }}
              >
                {s.tone === "suggest" ? (
                  <>
                    <Zt0 color="#16a34a" /> {s.label}
                  </>
                ) : (
                  s.label
                )}
              </button>
            ))}
          </div>

          {/* Alerts: raised at a stop, dismissed when the stop changes. */}
          {/* Fixed height, room for the largest set (two alerts), so the screen
              never changes size as alerts come and go. */}
          <div aria-live="polite" className="mt-4 h-[19.5rem] overflow-hidden pb-2 min-[400px]:h-[17.5rem]">
            {/* Notifications: the old set dismisses first (mode "wait"), then the
                new one rises in, fading up and coming into focus, the second a
                beat after the first. No height animation: the area is fixed. */}
            <AnimatePresence initial={false} mode="wait">
              {reduce || live ? (
              <motion.div
                key={i}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: 28, filter: "blur(2px)", transition: { duration: 0.28, ease: "easeIn" } }}
              >
              {(stop.alerts ?? []).map((a, k) => (
                <motion.div
                  key={a.kind}
                  initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 + k * 0.14 } }}
                  style={{ transformOrigin: "50% 0%" }}
                >
                  <div className="mb-3 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold" style={{ color: ALERT[a.tone] }}>
                        <Zt0 color={ALERT[a.tone]} /> {a.kind}
                      </p>
                      <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" stroke="#9a9a9a" strokeWidth="1.4" strokeLinecap="round">
                        <path d="M2 2l8 8M10 2l-8 8" />
                      </svg>
                    </div>
                    <p className="mt-1.5 text-[14px] leading-snug font-semibold">{coloured(a.title, ALERT[a.tone])}</p>
                    <p className="mt-1.5 text-[11px] leading-snug text-[#6f6f6f]">{a.sub}</p>
                  </div>
                </motion.div>
              ))}
              </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Account and confirm */}
        {account ? (
          <div className="mt-2 border-t border-[#e4e4e7] bg-white px-5 pt-4 pb-5">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-9 w-9 shrink-0 rounded-md bg-[#3b82f6]" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-[#6f6f6f]">{account.bank}</p>
                <p className="truncate text-[14px] font-medium">{account.name}</p>
              </div>
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h4L19 9l-4-4L4 16v4z" />
              </svg>
            </div>
            <div className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#6dd38a] text-[14px] font-semibold text-[#14532d]">
              <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 9v1M15 9v1M12 9v4h-1M9 15.5c1.6 1.3 4.4 1.3 6 0" />
              </svg>
              Confirm with Face ID
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
