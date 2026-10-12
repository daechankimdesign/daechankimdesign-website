"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { LABEL } from "./diagrams/styles";

type Line = { label: string; text: string };

// How much of the details shows while closed: the divider and the first row,
// fading out, so a reader can see there is more before opening it.
const PEEK = 84;
// Rows already in the peek (two columns from sm up); the rest reveal on open.
const PEEKED = 2;

/**
 * A case study's summary, set apart from the story in a bordered box on the
 * case-study panel colour: one sentence, then the details (problem, the AI
 * decision, result, role) as a faded peek. "Read more" (or a click on the
 * peek) opens it: the box grows to its full height, the remaining rows rise in
 * one after another, and the chevron turns. Reduced motion opens it at once.
 *
 * Open state is on the box as `data-open`, so the reveal and the mask are CSS
 * keyed off it; only the height is set here, measured at the click.
 */
export function Brief({ summary, items = [] }: { summary: string; items?: Line[] }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const id = useId();

  const toggle = () => {
    const h = body.current?.scrollHeight ?? 0;
    setFull(h);
    if (!open) {
      setSettled(false);
      setOpen(true);
    } else {
      // From "none" back to a measured height first, and let the browser
      // register it (two frames) before animating down to the peek.
      setSettled(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setOpen(false)));
    }
  };

  const maxHeight = open ? (settled ? "none" : `${full ?? 0}px`) : `${PEEK}px`;

  return (
    <aside
      className="group my-8 rounded-xl border border-hairline-panel bg-surface-panel p-5 sm:p-6"
      data-open={open ? "true" : "false"}
      data-brief=""
    >
      <p className={LABEL}>Project Summary</p>
      <p className="text-body mt-2 text-fg">{summary}</p>
      {items.length ? (
        <>
          <div
            id={id}
            ref={body}
            data-brief-body=""
            onClick={open ? undefined : toggle}
            onTransitionEnd={(e) => {
              if (e.propertyName === "max-height" && open) setSettled(true);
            }}
            className={`overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] [mask-image:linear-gradient(to_bottom,black_35%,transparent)] group-data-[open=true]:[mask-image:none] motion-reduce:transition-none ${
              open ? "" : "cursor-pointer"
            }`}
            style={{ maxHeight }}
          >
            <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-hairline-panel pt-5 sm:grid-cols-2 sm:gap-x-8">
              {items.map((it, i) => (
                <div
                  key={it.label}
                  className={
                    i < PEEKED
                      ? ""
                      : "translate-y-1.5 opacity-0 transition duration-500 ease-out group-data-[open=true]:translate-y-0 group-data-[open=true]:opacity-100 group-data-[open=true]:[transition-delay:var(--d)] motion-reduce:transition-none"
                  }
                  style={{ "--d": `${120 + (i - PEEKED) * 90}ms` } as CSSProperties}
                >
                  <dt className={LABEL}>{it.label}</dt>
                  <dd className="text-note mt-1 leading-relaxed text-fg">{it.text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={toggle}
            className="group/btn text-note mt-3 inline-flex items-center gap-1.5 font-medium text-fg"
          >
            <span className="underline decoration-hairline-panel underline-offset-4 group-hover/btn:decoration-fg">
              {open ? "Show less" : "Read more"}
            </span>
            <svg
              aria-hidden
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-y-0.5 group-data-[open=true]:rotate-180 group-data-[open=true]:group-hover/btn:-translate-y-0.5 motion-reduce:transition-none"
            >
              <path d="M2.5 4.5 6 8l3.5-3.5" />
            </svg>
          </button>
        </>
      ) : null}
    </aside>
  );
}
