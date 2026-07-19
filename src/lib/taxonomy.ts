/**
 * Work taxonomy — the closed vocabularies behind the discipline filter and the
 * visual tags (year / tools / status).
 *
 * All of these are read EN-ONLY off the canonical source (the same rail `span`
 * and `aspect` ride in `getWorkBoardItems`), so NONE of them enter the
 * translation-preservation contract. Do not add `tools`/`status` to
 * `PRESERVED_KEYS` or the gemini.ts prompt — they are never read from a
 * translated document, so there is nothing to preserve.
 */

/**
 * Canonical, ORDERED discipline vocabulary. Two jobs:
 *  1. the closed set every item's `tags` frontmatter must draw from, and
 *  2. the fixed facet display order in the filter rail — never sorted by
 *     localized label (Korean/Spanish collate differently and would reshuffle
 *     the chips between locales). Order here is by portfolio frequency.
 * Stored verbatim in `tags`; localized for display via the i18n key below.
 */
export const DISCIPLINES = [
  "Product Design",
  "User Experience",
  "Service Design",
  "AI Experience",
  "Design Research",
  "AI Development",
] as const;
export type Discipline = (typeof DISCIPLINES)[number];

/** Lifecycle badge. A canonical key, rendered via i18n (WorkTags.shipped/concept),
    never a display string — so the label localizes but the value never gets
    translated. */
export const WORK_STATUSES = ["shipped", "concept"] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

/** Soft reference list — the content validity check WARNS on tools outside this
    set, never fails. Tools render verbatim, so a new one can appear freely. */
export const KNOWN_TOOLS = [
  "Claude Code",
  "Codex",
  "Antigravity",
  "Figma",
] as const;

/** camelCase i18n key for a discipline label: "Product Design" → "productDesign".
    Used to look up WorkTags[key]; a miss falls back to the (already English)
    stored string, so a new discipline never renders blank. */
export function disciplineKey(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join("");
}

/** Narrow an unknown frontmatter value to a valid WorkStatus (else undefined). */
export function toWorkStatus(v: unknown): WorkStatus | undefined {
  return WORK_STATUSES.includes(v as WorkStatus) ? (v as WorkStatus) : undefined;
}

/** A frontmatter string[] field, filtered to non-empty strings (else []). */
export function stringList(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((s): s is string => typeof s === "string" && s.length > 0)
    : [];
}
