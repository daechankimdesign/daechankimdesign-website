"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import type { Active, WorkLabels } from "./WorkBoardClient";

// Disciplines read IDENTICALLY to the type tabs: muted, full-opacity + medium
// weight when active. (Kept local — importing from WorkBoardClient, which imports
// this file, would be a runtime cycle.)
const optionClass = (isActive: boolean) =>
  `text-body text-left no-underline transition-colors ${
    isActive ? "font-medium text-fg" : "text-fg-muted hover:text-fg"
  }`;

// Interactive overlay — snappy, NOT the 2s page-reveal duration.
const DUR = 0.28;

/**
 * The DISCIPLINE filter, as a button fixed to the viewport's BOTTOM-LEFT corner.
 * The type tabs (All / Project / Experiment) stay in the side tab; this owns only
 * the disciplines. Clicking the pill expands the list UPWARD (single-select, same
 * state as the tabs — picking a discipline clears any type, and "All" clears
 * everything).
 *
 * `visible` gates the whole thing to when the work grid is on screen (an
 * IntersectionObserver in WorkBoardClient), so the fixed pill never floats over
 * the hero above the board or the footer below it. The pill is always MOUNTED so
 * its selection label reconciles on every render; it just fades/lifts out when
 * `visible` flips false and drops pointer events so it can't be clicked while gone.
 */
export function FilterSheet({
  active,
  facets,
  labels,
  onSelectDisc,
  onClear,
  visible,
}: {
  active: Active;
  facets: string[];
  labels: WorkLabels;
  onSelectDisc: (d: string) => void;
  /** Clear back to "All" (deselects a discipline OR a type). */
  onClear: () => void;
  /** Show the pill (work grid is on screen). */
  visible: boolean;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  // Close when the pill hides (scrolled out of the grid).
  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const activeDisc = active.kind === "disc" ? active.value : null;
  const selectionLabel = activeDisc
    ? (labels.disciplines[activeDisc] ?? activeDisc)
    : null;
  const dur = reduce ? 0 : DUR;

  return (
    <>
      <AnimatePresence>
        {open && visible ? (
          <>
            {/* Transparent click-catcher — tap outside to close, no page dim. */}
            <motion.div
              key="disc-catch"
              className="fixed inset-0 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur }}
              onClick={() => setOpen(false)}
            />
            {/* Panel — expands UPWARD from just above the pill. */}
            <motion.div
              key="disc-panel"
              role="dialog"
              aria-modal="true"
              aria-label={labels.filterBy}
              className="fixed bottom-20 left-6 z-50 max-h-[70vh] w-60 max-w-[calc(100vw-3rem)] overflow-y-auto rounded-2xl border border-hairline bg-canvas p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: dur, ease: EASE_OUT }}
            >
              <div className="flex flex-col items-start gap-3">
                <button
                  type="button"
                  aria-pressed={active.kind !== "disc"}
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className={optionClass(active.kind !== "disc")}
                >
                  {labels.all}
                </button>
                {facets.map((d) => {
                  const isActive = activeDisc === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        onSelectDisc(d);
                        setOpen(false);
                      }}
                      className={optionClass(isActive)}
                    >
                      {labels.disciplines[d] ?? d}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {/* The fixed bottom-left pill. Always mounted; fades/lifts with `visible`. */}
      <motion.div
        className="fixed bottom-6 left-6 z-40"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={
          reduce
            ? { opacity: visible ? 1 : 0 }
            : { opacity: visible ? 1 : 0, y: visible ? 0 : 12 }
        }
        transition={{ duration: dur, ease: EASE_OUT }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
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
