"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import posthog from "posthog-js";
import { WorkTile } from "./WorkTile";
import { Reveal, RevealItem } from "./Reveal";
import { RevealTile } from "./RevealTile";
import { EASE_OUT, DURATION, DELAY } from "@/lib/motion";
import { DISCIPLINES } from "@/lib/taxonomy";
import type { BoardItem, Span, WorkType } from "@/lib/mdx";

// span → column span, STATIC literal strings (Tailwind JIT can't see interpolated
// class names). base 1-col, sm 2-col, lg 12-col → standard 3-up, feature 2-up.
const SPAN_CLASS: Record<Span, string> = {
  standard: "lg:col-span-4",
  feature: "sm:col-span-2 lg:col-span-6",
  wide: "sm:col-span-2 lg:col-span-8",
};

export type WorkLabels = {
  all: string;
  caseStudy: string;
  play: string;
  shipped: string;
  concept: string;
  /** Discipline group eyebrow, e.g. "Discipline". */
  filterBy: string;
  clear: string;
  empty: string;
  /** Live-region template with {shown}/{total} placeholders. */
  showing: string;
  /** English discipline name → localized chip label. */
  disciplines: Record<string, string>;
};

type FilterKey = WorkType | "all";

// "All" (default) sits above the two type filters and clears the type filter.
const TYPE_FILTERS: { key: FilterKey; labelKey: "all" | "caseStudy" | "play" }[] =
  [
    { key: "all", labelKey: "all" },
    { key: "projects", labelKey: "caseStudy" },
    { key: "sandbox", labelKey: "play" },
  ];

/** URL slug for a discipline: "Product Design" → "product-design". */
const discSlug = (d: string) => d.toLowerCase().replace(/\s+/g, "-");

/**
 * The combined work board. Layout + intro mirror the About page: a side tab on
 * the left and a main content column whose "Work" heading sits where About's
 * "Daechan Kim" does, revealed by the same mount-time Reveal cascade.
 *
 * TWO filter axes:
 *  - TYPE (All / Project / Experiment): single-select, exclusive (unchanged).
 *  - DISCIPLINE: multi-select chips, OR within the axis. Combined with type via
 *    AND. Disciplines come from the repurposed `tags` field; the raw build-stack
 *    tags moved to the `tools` visual badge, so the facet list stays coherent.
 *
 * Filtering is pure `.filter()` over the props array (never mutates the cache()d
 * board). On `/project`, filter state syncs to the URL (`?type=…&d=a,b`) via the
 * history API — shareable, and no useSearchParams/Suspense needed, so the home
 * reuse (`syncUrl={false}`) stays fully static.
 */
export function WorkBoardClient({
  items,
  heading,
  labels,
  showHeading = true,
  syncUrl = false,
}: {
  items: BoardItem[];
  heading: string;
  labels: WorkLabels;
  showHeading?: boolean;
  /** Sync filter state to the URL. Only the standalone /project board does. */
  syncUrl?: boolean;
}) {
  const reduce = useReducedMotion();
  const [activeType, setActiveType] = useState<WorkType | null>(null);
  const [activeDisc, setActiveDisc] = useState<string[]>([]);
  // On the home reuse (no URL sync) we're "hydrated" immediately; the /project
  // board flips it true after reading the initial URL, so the writer below never
  // clobbers a shared link on first paint.
  const [hydrated, setHydrated] = useState(!syncUrl);
  const gridRef = useRef<HTMLUListElement>(null);

  // Facets: the closed vocabulary, in registry order, limited to disciplines
  // actually present — a fixed spine, never reshuffled by locale or data order.
  const facets = DISCIPLINES.filter((d) =>
    items.some((it) => it.disciplines.includes(d)),
  );

  // Read initial state from the URL once (client-only; avoids useSearchParams).
  useEffect(() => {
    if (!syncUrl) return;
    const p = new URLSearchParams(window.location.search);
    const t = p.get("type");
    if (t === "projects" || t === "sandbox") setActiveType(t);
    const d = p.get("d");
    if (d) {
      const wanted = d.split(",");
      setActiveDisc(facets.filter((f) => wanted.includes(discSlug(f))));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write state to the URL (shareable). replaceState keeps history clean.
  useEffect(() => {
    if (!syncUrl || !hydrated) return;
    const p = new URLSearchParams();
    if (activeType) p.set("type", activeType);
    if (activeDisc.length) p.set("d", activeDisc.map(discSlug).join(","));
    const qs = p.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `?${qs}` : window.location.pathname,
    );
  }, [activeType, activeDisc, hydrated, syncUrl]);

  const byType = activeType
    ? items.filter((it) => it.type === activeType)
    : items;
  const countFor = (d: string) =>
    byType.reduce((n, it) => n + (it.disciplines.includes(d) ? 1 : 0), 0);

  const shown = items.filter(
    (it) =>
      (activeType === null || it.type === activeType) &&
      (activeDisc.length === 0 ||
        it.disciplines.some((d) => activeDisc.includes(d))),
  );

  const labelFor = (type: WorkType) =>
    type === "projects" ? labels.caseStudy : labels.play;
  const statusLabelFor = (it: BoardItem) =>
    it.status ? labels[it.status] : undefined;

  const setType = (key: FilterKey) => {
    const next = key === "all" ? null : (key as WorkType);
    setActiveType(next);
    posthog.capture("work_filter_applied", {
      filter: key,
      disciplines: activeDisc,
    });
  };
  const toggleDisc = (d: string) => {
    setActiveDisc((prev) => {
      const next = prev.includes(d)
        ? prev.filter((x) => x !== d)
        : [...prev, d];
      posthog.capture("work_filter_applied", {
        filter: activeType ?? "all",
        disciplines: next,
      });
      return next;
    });
  };

  const status = labels.showing
    .replace("%shown%", String(shown.length))
    .replace("%total%", String(items.length));

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
      {/* Left: filters — settles in last, like the About tab. */}
      <aside className="lg:order-first lg:w-48 lg:shrink-0">
        <div className="lg:sticky lg:top-24">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={
              reduce
                ? undefined
                : { duration: DURATION, ease: EASE_OUT, delay: DELAY.sideTab }
            }
          >
            {/* Type — single-select text tabs (unchanged). */}
            <nav
              aria-label="Filter work by type"
              className="flex flex-row gap-5 border-b border-hairline pb-4 lg:flex-col lg:items-start lg:gap-3 lg:border-0 lg:pb-0"
            >
              {TYPE_FILTERS.map((f) => {
                const isActive =
                  f.key === "all" ? activeType === null : activeType === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setType(f.key)}
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
            </nav>

            {/* Discipline — multi-select chips (OR). Pill shape signals "these
                accumulate", vs the plain type tabs. */}
            {facets.length > 0 ? (
              <div
                role="group"
                aria-label={labels.filterBy}
                className="mt-4 flex flex-row flex-wrap gap-2 border-b border-hairline pb-4 lg:mt-6 lg:border-0 lg:pb-0"
              >
                <p className="text-caption w-full text-fg-muted uppercase">
                  {labels.filterBy}
                </p>
                {facets.map((d) => {
                  const isActive = activeDisc.includes(d);
                  const count = countFor(d);
                  const disabled = count === 0 && !isActive;
                  const label = labels.disciplines[d] ?? d;
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={isActive}
                      aria-label={`${label}, ${count}`}
                      disabled={disabled}
                      onClick={() => toggleDisc(d)}
                      className={`text-caption inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
                        isActive
                          ? "bg-fg text-canvas"
                          : disabled
                            ? "border border-hairline text-fg-subtle opacity-50"
                            : "border border-hairline text-fg-muted hover:border-fg hover:text-fg"
                      }`}
                    >
                      {label}
                      <span
                        className={
                          isActive ? "text-canvas/70" : "text-fg-subtle"
                        }
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
                {activeDisc.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveDisc([])}
                    className="text-caption w-full text-left text-fg-muted underline underline-offset-2 hover:text-fg"
                  >
                    {labels.clear}
                  </button>
                ) : null}
              </div>
            ) : null}
          </motion.div>
        </div>
      </aside>

      {/* Right: heading (About-style Reveal) then the grid. */}
      <div className="min-w-0 flex-1">
        {showHeading ? (
          <header className="mb-8">
            <Reveal>
              <RevealItem as="h1" className="text-display">
                {heading}
              </RevealItem>
            </Reveal>
          </header>
        ) : null}

        {/* Result count for assistive tech, announced on every change. */}
        <p aria-live="polite" className="sr-only">
          {status}
        </p>

        {shown.length === 0 ? (
          <div className="text-body text-fg-muted">
            <p>{labels.empty}</p>
            <button
              type="button"
              onClick={() => {
                setActiveType(null);
                setActiveDisc([]);
              }}
              className="text-caption mt-3 text-fg-muted underline underline-offset-2 hover:text-fg"
            >
              {labels.clear}
            </button>
          </div>
        ) : (
          <ul
            ref={gridRef}
            className="grid grid-cols-1 items-start gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-y-16"
          >
            {shown.map((item, i) => (
              <li
                key={`${item.type}-${item.slug}`}
                className={SPAN_CLASS[item.span]}
              >
                <RevealTile index={i}>
                  <WorkTile
                    item={item}
                    typeLabel={labelFor(item.type)}
                    statusLabel={statusLabelFor(item)}
                    priority={i === 0}
                  />
                </RevealTile>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
