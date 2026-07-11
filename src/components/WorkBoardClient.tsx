"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { WorkTile } from "./WorkTile";
import { Reveal, RevealItem, RevealOnView } from "./Reveal";
import { EASE_OUT, DURATION, DELAY } from "@/lib/motion";
import type { BoardItem, Span, WorkType } from "@/lib/mdx";

// span → column span, STATIC literal strings (Tailwind JIT can't see interpolated
// class names). base 1-col, sm 2-col, lg 12-col → standard 3-up, feature 2-up.
const SPAN_CLASS: Record<Span, string> = {
  standard: "lg:col-span-4",
  feature: "sm:col-span-2 lg:col-span-6",
  wide: "sm:col-span-2 lg:col-span-8",
};

type Labels = { all: string; caseStudy: string; play: string };

type FilterKey = WorkType | "all";

// "All" (default) sits above the two type filters and clears any active filter.
const FILTERS: { key: FilterKey; labelKey: keyof Labels }[] = [
  { key: "all", labelKey: "all" },
  { key: "projects", labelKey: "caseStudy" },
  { key: "sandbox", labelKey: "play" },
];

/**
 * The combined work board. Layout + intro mirror the About page: a side tab on
 * the left (here a category FILTER, not scroll-spy nav) that settles in last, and
 * a main content column whose heading ("Work") sits where About's "Daechan Kim"
 * does — top of the content column, next to the tab, above the grid — revealed by
 * the same mount-time Reveal cascade. There's no profile image, so the content
 * column sits directly beside the tab.
 *
 * Filter: by default nothing is active and every item shows; clicking a type
 * filters the board to it; clicking the active type again clears the filter.
 */
export function WorkBoardClient({
  items,
  heading,
  labels,
}: {
  items: BoardItem[];
  heading: string;
  labels: Labels;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<WorkType | null>(null);
  const shown = active ? items.filter((it) => it.type === active) : items;
  const labelFor = (type: WorkType) =>
    type === "projects" ? labels.caseStudy : labels.play;

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
      {/* Left: category filter side tab — settles in last, like the About tab.
          Sticky vertical list on desktop, a horizontal row above the board on
          mobile. */}
      <aside className="lg:order-first lg:w-48 lg:shrink-0">
        <div className="lg:sticky lg:top-24">
          <motion.nav
            aria-label="Filter work by type"
            className="flex flex-row gap-5 border-b border-hairline pb-4 lg:flex-col lg:items-start lg:gap-3 lg:border-0 lg:pb-0"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={
              reduce
                ? undefined
                : { duration: DURATION, ease: EASE_OUT, delay: DELAY.sideTab }
            }
          >
            {FILTERS.map((f) => {
              const isActive =
                f.key === "all" ? active === null : active === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    setActive(f.key === "all" ? null : (f.key as WorkType))
                  }
                  className={`text-body text-left no-underline transition-colors ${
                    isActive
                      ? "font-medium text-fg"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {labels[f.labelKey]}
                </button>
              );
            })}
          </motion.nav>
        </div>
      </aside>

      {/* Right: main content — the "Work" heading (About-style Reveal entrance)
          then the grid. */}
      <div className="min-w-0 flex-1">
        <header className="mb-8">
          <Reveal>
            <RevealItem as="h1" className="text-display">
              {heading}
            </RevealItem>
          </Reveal>
        </header>

        {shown.length === 0 ? (
          <p className="text-body text-fg-muted">No work yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-y-16">
            {shown.map((item, i) => (
              <li
                key={`${item.type}-${item.slug}`}
                className={SPAN_CLASS[item.span]}
              >
                <RevealOnView>
                  <WorkTile
                    item={item}
                    typeLabel={labelFor(item.type)}
                    priority={i === 0}
                  />
                </RevealOnView>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
