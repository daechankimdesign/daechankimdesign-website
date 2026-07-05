/**
 * Entrance-motion tokens — the ONE source of truth for every on-load / scroll-in
 * reveal across the site (page headers, long-form body blocks, on-view sections,
 * and the side document tab). Change timing here and it applies project-wide.
 *
 * Timings are in SECONDS (framer-motion `transition.duration` / `delay`).
 */

/**
 * Extreme ease-out (easeOutExpo): the motion rushes off the start and settles
 * very slowly into place — a long, gentle tail over the full 2s.
 */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Every entrance animation runs for 2 seconds. */
export const DURATION = 2;

/** Header line-to-line cascade step (time between staggered header lines). */
export const STAGGER = 0.15;

/**
 * Delay hierarchy (seconds). Deliberate order: the HEADER appears first, the
 * BODY always trails it, and the SIDE TAB (supporting chrome) settles in last.
 * Body > header holds at all times because `body` also clears the header's last
 * staggered line (`header + 2·STAGGER = 0.6`).
 */
export const DELAY = {
  header: 0.3,
  body: 0.8,
  sideTab: 1.2,
} as const;
