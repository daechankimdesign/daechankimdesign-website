"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import type { WorkType } from "@/lib/mdx";
import type { Active, WorkLabels } from "./WorkBoardClient";

// Local copy of the rail's option styling (deliberately NOT imported from
// WorkBoardClient, which imports this file — a runtime import back would be a
// cycle). Keep in sync with WorkBoardClient.optionClass.
const optionClass = (isActive: boolean) =>
  `text-body text-left no-underline transition-colors ${
    isActive ? "font-medium text-fg" : "text-fg-muted hover:text-fg"
  }`;

// Interactive overlay, so it's snappy — NOT the 2s page-reveal duration.
const SHEET_DURATION = 0.28;
// Hide the pill this close to the page bottom so it never floats over the
// reveal-footer (which is `fixed bottom-0`, revealed under the page card).
const FOOTER_GUARD = 160;

/**
 * BOTTOM-SHEET presentation of the work filter (feature-flagged in
 * WorkBoardClient via BOTTOM_SHEET). A "Filters" pill sticks to the viewport
 * bottom; tapping it expands a panel UPWARD with the same options and the same
 * single-select behavior. Purely a re-presentation — all state and handlers are
 * owned by WorkBoardClient and passed in, so nothing about filtering changes.
 *
 * It renders only fixed chrome (nothing inline). Every AnimatePresence child
 * carries a stable `key` — required by framer, and without it a persistent child
 * won't reconcile prop updates (the pill's selection label would go stale).
 */
export function FilterSheet({
  active,
  facets,
  labels,
  onSelectType,
  onSelectDisc,
}: {
  active: Active;
  facets: string[];
  labels: WorkLabels;
  onSelectType: (key: "all" | WorkType) => void;
  onSelectDisc: (d: string) => void;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [nearBottom, setNearBottom] = useState(false);

  // Hide the pill near the footer so the two `fixed bottom` elements never clash
  // — but ONLY when the page is tall enough to actually scroll there. On a short
  // page (e.g. filtered to one result) the whole page is within the guard, so
  // guarding unconditionally would hide the pill with no way to change filters.
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight > FOOTER_GUARD * 2;
      const atBottom =
        scrollable &&
        window.innerHeight + window.scrollY >= doc.scrollHeight - FOOTER_GUARD;
      setNearBottom(atBottom);
      if (atBottom) setOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const typeLabelFor = (key: "all" | WorkType) =>
    key === "all"
      ? labels.all
      : key === "projects"
        ? labels.caseStudy
        : labels.play;

  const selectionLabel =
    active.kind === "all"
      ? null
      : active.kind === "type"
        ? typeLabelFor(active.value)
        : (labels.disciplines[active.value] ?? active.value);

  const pick = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  const dur = reduce ? 0 : SHEET_DURATION;

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="filter-scrim"
            className="fixed inset-0 z-40 bg-fg/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur }}
            onClick={() => setOpen(false)}
          />
        ) : null}
        {open ? (
          <motion.div
            key="filter-panel"
            role="dialog"
            aria-modal="true"
            aria-label={labels.filterBy}
            className="fixed bottom-24 left-1/2 z-50 max-h-[70vh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 overflow-y-auto rounded-2xl border border-hairline bg-canvas p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: dur, ease: EASE_OUT }}
          >
            <div className="flex flex-col items-start gap-3">
              {(["all", "projects", "sandbox"] as const).map((key) => {
                const isActive =
                  key === "all"
                    ? active.kind === "all"
                    : active.kind === "type" && active.value === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => pick(() => onSelectType(key))}
                    className={optionClass(isActive)}
                  >
                    {typeLabelFor(key)}
                  </button>
                );
              })}
            </div>

            {facets.length > 0 ? (
              <>
                <hr className="hairline-b my-4 border-0" />
                <p className="text-caption mb-3 text-fg-muted uppercase">
                  {labels.filterBy}
                </p>
                <div className="flex flex-col items-start gap-3">
                  {facets.map((d) => {
                    const isActive =
                      active.kind === "disc" && active.value === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => pick(() => onSelectDisc(d))}
                        className={optionClass(isActive)}
                      >
                        {labels.disciplines[d] ?? d}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* The sticky pill — always mounted (NOT wrapped in AnimatePresence) so its
          selection label reconciles on every render; it fades/lifts out near the
          footer instead of unmounting, and drops pointer events while hidden. */}
      <motion.div
        className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={
          reduce
            ? { opacity: nearBottom ? 0 : 1 }
            : { opacity: nearBottom ? 0 : 1, y: nearBottom ? 12 : 0 }
        }
        transition={{ duration: dur, ease: EASE_OUT }}
        style={{ pointerEvents: nearBottom ? "none" : "auto" }}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((o) => !o)}
          className="text-body inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-canvas no-underline shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]"
        >
          <span>{labels.filterBy}</span>
          {selectionLabel ? (
            <span className="text-canvas/70">· {selectionLabel}</span>
          ) : null}
          <svg
            aria-hidden
            viewBox="0 0 12 12"
            className={`h-3 w-3 transition-transform duration-200 ${
              open ? "" : "rotate-180"
            }`}
          >
            <path
              d="M2.5 4.5 6 8l3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </motion.div>
    </>
  );
}
