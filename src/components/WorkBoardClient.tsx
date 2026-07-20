"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import posthog from "posthog-js";
import { WorkTile } from "./WorkTile";
import { FilterSheet } from "./FilterSheet";
import { Reveal, RevealItem } from "./Reveal";
import { RevealTile } from "./RevealTile";
import { EASE_OUT, DURATION, DELAY, STAGGER } from "@/lib/motion";
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
  /** Discipline accordion header, e.g. "Discipline". */
  filterBy: string;
  clear: string;
  empty: string;
  /** Live-region template with %shown%/%total% tokens. */
  showing: string;
  /** English discipline name → localized label. */
  disciplines: Record<string, string>;
};

// ── EXPERIMENT: disciplines as a bottom-LEFT "Filters" button · EASY REVERT ──
// When true, the discipline filter lives in a pill fixed to the viewport's
// bottom-left corner (see FilterSheet), on BOTH boards, shown only while the work
// grid is on screen. The type tabs stay in the side tab either way. Flip to FALSE
// to move disciplines back INTO the rail as a plain accordion under the tabs — all
// filter logic, labels, and URL sync are shared and untouched, so the button is
// purely additive and reverting is one boolean.
const FILTER_BUTTON = false;

type FilterKey = WorkType | "all";

const TYPE_FILTERS: { key: FilterKey; labelKey: "all" | "caseStudy" | "play" }[] =
  [
    { key: "all", labelKey: "all" },
    { key: "projects", labelKey: "caseStudy" },
    { key: "sandbox", labelKey: "play" },
  ];

// One SINGLE-SELECT filter spanning type + disciplines. "all" is the default /
// reset; picking a type or a discipline is mutually exclusive with everything
// else (no AND-combining). Disciplines live in a collapsible accordion but are
// otherwise first-class options in the same group.
export type Active =
  | { kind: "all" }
  | { kind: "type"; value: WorkType }
  | { kind: "disc"; value: string };

/** URL slug for a discipline: "Product Design" → "product-design". */
const discSlug = (d: string) => d.toLowerCase().replace(/\s+/g, "-");

/** Shared option styling — disciplines read IDENTICALLY to the type tabs:
    muted, full-opacity + medium weight when active. */
const optionClass = (isActive: boolean) =>
  `text-body text-left no-underline transition-colors ${
    isActive ? "font-medium text-fg" : "text-fg-muted hover:text-fg"
  }`;

// Accordion children entrance — the same fade-up + easeOutExpo vocabulary as the
// side tab, cascaded down the list (staggerChildren) so the options settle in one
// after another when the accordion opens. No delay: this fires on click, so it
// starts immediately (unlike the page-load side tab, which trails everything).
const DISC_LIST: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER } },
};
const DISC_ITEM: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE_OUT } },
};

/**
 * The combined work board. Layout + intro mirror the About page: a side tab on
 * the left and a main content column whose "Work" heading sits where About's
 * "Daechan Kim" does, revealed by the same mount-time Reveal cascade.
 *
 * FILTER: a single exclusive selection — All (default), a type (Project /
 * Experiment), or one discipline. Disciplines sit in a collapsible "Discipline"
 * accordion but belong to the same single-select group, so choosing one clears
 * any type and vice versa. Filtering is pure `.filter()` over the props array
 * (never mutates the cache()d board). On `/project`, the selection syncs to the
 * URL (`?f=…`) via the history API — shareable, and with no useSearchParams /
 * Suspense, so the home reuse (`syncUrl={false}`) stays fully static.
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
  /** Sync selection to the URL. Only the standalone /project board does. */
  syncUrl?: boolean;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Active>({ kind: "all" });
  const [discOpen, setDiscOpen] = useState(false);
  // On the home reuse (no URL sync) we're "hydrated" immediately; the /project
  // board flips it true after reading the initial URL so the writer below never
  // clobbers a shared link on first paint.
  const [hydrated, setHydrated] = useState(!syncUrl);
  // The fixed bottom-left pill shows only while the work grid is on screen, so it
  // never floats over the hero above the board or the footer below it.
  const contentRef = useRef<HTMLDivElement>(null);
  const [gridInView, setGridInView] = useState(false);

  // Facets: the closed vocabulary, registry order, limited to disciplines
  // actually present — a fixed spine, never reshuffled by locale or data order.
  const facets = DISCIPLINES.filter((d) =>
    items.some((it) => it.disciplines.includes(d)),
  );

  // Read the initial selection from the URL once (client-only; no useSearchParams).
  useEffect(() => {
    if (!syncUrl) return;
    const f = new URLSearchParams(window.location.search).get("f");
    if (f === "projects" || f === "sandbox") {
      setActive({ kind: "type", value: f });
    } else if (f) {
      const d = facets.find((x) => discSlug(x) === f);
      if (d) {
        setActive({ kind: "disc", value: d });
        setDiscOpen(true);
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write the selection to the URL (shareable). replaceState keeps history clean.
  useEffect(() => {
    if (!syncUrl || !hydrated) return;
    const f =
      active.kind === "type"
        ? active.value
        : active.kind === "disc"
          ? discSlug(active.value)
          : "";
    window.history.replaceState(
      null,
      "",
      f ? `?f=${f}` : window.location.pathname,
    );
  }, [active, hydrated, syncUrl]);

  const shown = items.filter((it) =>
    active.kind === "all"
      ? true
      : active.kind === "type"
        ? it.type === active.value
        : it.disciplines.includes(active.value),
  );

  const labelFor = (type: WorkType) =>
    type === "projects" ? labels.caseStudy : labels.play;
  const statusLabelFor = (it: BoardItem) =>
    it.status ? labels[it.status] : undefined;

  const selectType = (key: FilterKey) => {
    setActive(key === "all" ? { kind: "all" } : { kind: "type", value: key });
    posthog.capture("work_filter_applied", { filter: key });
  };
  const selectDisc = (d: string) => {
    setActive((prev) =>
      prev.kind === "disc" && prev.value === d
        ? { kind: "all" }
        : { kind: "disc", value: d },
    );
    posthog.capture("work_filter_applied", { filter: d });
  };

  const status = labels.showing
    .replace("%shown%", String(shown.length))
    .replace("%total%", String(items.length));

  // Watch the content column so the fixed pill only appears while the grid is in
  // view. rootMargin insets the trigger ~12% so it settles in once the board is
  // meaningfully on screen, not the instant its top edge peeks.
  useEffect(() => {
    if (!FILTER_BUTTON) return;
    const el = contentRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setGridInView(entry.isIntersecting),
      { rootMargin: "-12% 0px -12% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
      {/* Left: filters — settle in last, like the About tab. Type tabs always live
          here; the disciplines move to the bottom-left pill when FILTER_BUTTON. */}
      {/* Mobile: pin the filter rail just below the fixed top nav (~54px) so the
          type tabs stay reachable while the grid scrolls. Desktop uses the inner
          sticky column instead. */}
      <aside className="sticky top-16 z-20 pb-2 lg:static lg:top-auto lg:z-auto lg:pb-0 lg:order-first lg:w-48 lg:shrink-0">
        {/* Viewport-tall sticky column (calc needs the spaces → underscores) so
            mt-auto can pin the disciplines to the bottom EDGE of the screen and
            keep them there as you scroll the grid. */}
        <div className="lg:sticky lg:top-24 lg:flex lg:h-[calc(100vh_-_8rem)] lg:flex-col">
          <motion.div
            role="group"
            aria-label="Filter work"
            className="flex flex-col lg:h-full"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={
              reduce
                ? undefined
                : { duration: DURATION, ease: EASE_OUT, delay: DELAY.sideTab }
            }
          >
            {/* Type — single-select text tabs. */}
            <div className="flex flex-row gap-5 border-b border-hairline pb-4 lg:flex-col lg:items-start lg:gap-3 lg:border-0 lg:pb-0">
              {TYPE_FILTERS.map((f) => {
                const isActive =
                  f.key === "all"
                    ? active.kind === "all"
                    : active.kind === "type" && active.value === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectType(f.key)}
                    className={optionClass(isActive)}
                  >
                    {labels[f.labelKey]}
                  </button>
                );
              })}
            </div>

            {/* Disciplines accordion IN the rail (when FILTER_BUTTON=false).
                lg:mt-auto pins it to the BOTTOM EDGE of the viewport-tall column;
                the list expands UPWARD (rendered above its header) so it grows
                toward the type tabs, never off the bottom of the screen. */}
            {!FILTER_BUTTON && facets.length > 0 ? (
              <div className="mt-4 lg:mt-auto lg:pt-8">
                {/* Divider only at lg, where the tabs have no border and the
                    disciplines are pinned far below. On mobile the tabs' own
                    border-b already separates them, so this would double the line. */}
                <hr className="hidden hairline-b mb-4 border-0 lg:block" />

                {discOpen ? (
                  <motion.div
                    className="mb-3 flex flex-col items-start gap-3"
                    variants={DISC_LIST}
                    initial={reduce ? false : "hidden"}
                    animate="show"
                  >
                    {facets.map((d) => {
                      const isActive =
                        active.kind === "disc" && active.value === d;
                      return (
                        <motion.button
                          key={d}
                          type="button"
                          variants={reduce ? undefined : DISC_ITEM}
                          aria-pressed={isActive}
                          onClick={() => selectDisc(d)}
                          className={optionClass(isActive)}
                        >
                          {labels.disciplines[d] ?? d}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                ) : null}

                <button
                  type="button"
                  aria-expanded={discOpen}
                  onClick={() => setDiscOpen((o) => !o)}
                  className="text-body inline-flex items-center gap-1.5 text-left text-fg-muted transition-colors hover:text-fg"
                >
                  {labels.filterBy}
                  <svg
                    aria-hidden
                    viewBox="0 0 12 12"
                    className={`h-3 w-3 transition-transform duration-200 ${
                      discOpen ? "" : "rotate-180"
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
              </div>
            ) : null}
          </motion.div>
        </div>
      </aside>

      {/* Right: heading (About-style Reveal) then the grid. */}
      <div ref={contentRef} className="min-w-0 flex-1">
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
              onClick={() => selectType("all")}
              className="text-caption mt-3 text-fg-muted underline underline-offset-2 hover:text-fg"
            >
              {labels.clear}
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 items-start gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-y-16">
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

      {FILTER_BUTTON && facets.length > 0 ? (
        <FilterSheet
          active={active}
          facets={facets}
          labels={labels}
          onSelectDisc={selectDisc}
          onClear={() => selectType("all")}
          visible={gridInView}
        />
      ) : null}
    </div>
  );
}
