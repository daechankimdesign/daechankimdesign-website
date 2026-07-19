"use client";

import { useState, type ReactElement } from "react";
import posthog from "posthog-js";
import { FeaturedProjects } from "./FeaturedProjects";
import { SandboxCarousel } from "./SandboxCarousel";
import { WorkBoardClient } from "./WorkBoardClient";
import { RevealOnView } from "./Reveal";
import type { ContentItem, BoardItem } from "@/lib/mdx";

/**
 * Home work region with a view toggle — an A/B of two ways to present the same
 * body of work, so the feel of each can be compared in place.
 *
 *  - "stacked" (default): the current long vertical read. Case studies render as
 *    tall image stacks (FeaturedProjects) under a sticky "Project" heading, then
 *    Experiments below in their own cover-flow strip. Two separate sections.
 *  - "tiles": the exact /work board — case studies and experiments MERGED into
 *    one editorial tile grid with the category filter side-tab (WorkBoardClient).
 *    In this mode the separate Experiments strip is gone, because the board
 *    already contains those items (showing both would double them).
 *
 * The toggle is the icon-only, opacity-state control the SandboxEmbed device
 * switch established (no pill, no background; selected / hover / default read
 * purely through opacity). Default is "stacked" so the server render is
 * deterministic — no hydration flip.
 *
 * This is a client component, but every child it renders is client-safe:
 * FeaturedProjects and LinkButton are server-default yet import nothing
 * server-only, so they compile into the client bundle without issue.
 */

type View = "stacked" | "tiles";

type Labels = {
  /** "Project" — stacked-view projects heading AND the board's case-study label. */
  caseStudy: string;
  /** "Experiment" — sandbox heading AND the board's play label. */
  play: string;
  /** "Details" CTA on each stacked project / sandbox entry. */
  details: string;
  /** "Work" — the board's own heading (tiles view). */
  work: string;
  /** "All" — the board's clear-filter label (tiles view). */
  all: string;
  /** Toggle a11y: per-option labels and the group label. */
  stackedView: string;
  tileView: string;
  viewOptions: string;
};

export function HomeWorkSection({
  projects,
  sandbox,
  boardItems,
  labels,
}: {
  projects: ContentItem[];
  sandbox: ContentItem[];
  boardItems: BoardItem[];
  labels: Labels;
}) {
  const [view, setView] = useState<View>("stacked");

  const change = (next: View) => {
    if (next === view) return;
    setView(next);
    posthog.capture("home_work_view_changed", { view: next });
  };

  const OPTIONS: { key: View; label: string; Icon: () => ReactElement }[] =
    [
      { key: "stacked", label: labels.stackedView, Icon: StackedIcon },
      { key: "tiles", label: labels.tileView, Icon: TilesIcon },
    ];

  return (
    <section id="work" className="scroll-mt-24">
      {/* Toggle row — stable across both views, so flipping never moves it. */}
      <div className="container-page flex justify-end pt-16 pb-4">
        <div
          role="group"
          aria-label={labels.viewOptions}
          className="flex items-center gap-3"
        >
          {OPTIONS.map((o) => {
            const active = o.key === view;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => change(o.key)}
                aria-pressed={active}
                aria-label={o.label}
                title={o.label}
                className={`p-1 text-fg transition-opacity ${
                  active ? "opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <o.Icon />
              </button>
            );
          })}
        </div>
      </div>

      {view === "stacked" ? (
        <>
          {/* Opacity-only reveal (rise=false): the section holds a sticky
              heading, which a transformed ancestor would break. */}
          <RevealOnView rise={false}>
            <div className="container-page grid grid-cols-1 gap-x-8 gap-y-0 pb-16 lg:grid-cols-12 lg:gap-x-16">
              <h3 className="text-h3 z-20 mb-8 lg:sticky lg:top-24 lg:col-span-4">
                {labels.caseStudy}
              </h3>
              <FeaturedProjects items={projects} detailsLabel={labels.details} />
            </div>
          </RevealOnView>

          <RevealOnView rise={false}>
            <SandboxCarousel
              items={sandbox}
              heading={labels.play}
              detailsLabel={labels.details}
            />
          </RevealOnView>
        </>
      ) : (
        <div className="container-page pb-16">
          <WorkBoardClient
            items={boardItems}
            heading={labels.work}
            labels={{
              all: labels.all,
              caseStudy: labels.caseStudy,
              play: labels.play,
            }}
          />
        </div>
      )}
    </section>
  );
}

/* Icons — the SandboxEmbed idiom: 24-box, hairline stroke, currentColor. */

// Two tall stacked cards → the long vertical read.
function StackedIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="3" width="16" height="7" rx="1.5" />
      <rect x="4" y="14" width="16" height="7" rx="1.5" />
    </svg>
  );
}

// A 2x2 grid → the tile board.
function TilesIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}
