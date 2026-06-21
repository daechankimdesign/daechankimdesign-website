import { getFrontmatter } from "next-mdx-remote-client/utils";

/**
 * Frontmatter contract for translation (rules §6). These keys must survive a
 * Gemini translation untouched; `title`/`summary` values are translated.
 * Kept here — dependency-light (gray-matter only, no React) — so the
 * preservation check can be unit-tested without the Next/RSC runtime.
 */
export const PRESERVED_KEYS = ["slug", "thumbnail", "date", "tags"] as const;
export const TRANSLATED_KEYS = ["title", "summary"] as const;

export type PreservationResult =
  | { ok: true; frontmatter: Record<string, unknown> }
  | { ok: false; reason: string };

const normalize = (v: unknown): string => JSON.stringify(v ?? null);

/**
 * Structural check that a translated MDX document preserved everything it was
 * told to: preserved-key values are byte-for-byte identical, and translated
 * keys remain present and non-empty. Pure — safe to call outside Next.
 */
export function checkPreservedFrontmatter(
  sourceMdx: string,
  translatedMdx: string,
): PreservationResult {
  const src = getFrontmatter<Record<string, unknown>>(sourceMdx).frontmatter;
  const out = getFrontmatter<Record<string, unknown>>(translatedMdx).frontmatter;

  for (const key of PRESERVED_KEYS) {
    if (normalize(src[key]) !== normalize(out[key])) {
      return {
        ok: false,
        reason: `frontmatter "${key}" was altered (expected ${normalize(
          src[key],
        )}, got ${normalize(out[key])})`,
      };
    }
  }
  for (const key of TRANSLATED_KEYS) {
    if (key in src) {
      const val = out[key];
      if (typeof val !== "string" || val.trim() === "") {
        return { ok: false, reason: `translated "${key}" is missing or empty` };
      }
    }
  }
  return { ok: true, frontmatter: out };
}

/** Capitalized JSX tag names (components), as a sorted multiset. */
function componentTags(mdx: string): string[] {
  const tags: string[] = [];
  const re = /<\/?([A-Z][A-Za-z0-9.]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(mdx)) !== null) tags.push(m[1]);
  return tags.sort();
}

/**
 * Reject a translation that renamed, dropped, or invented a JSX component tag
 * (e.g. localizing `<VideoPlayer>` to `<비디오플레이어>` or hallucinating a new
 * component). evaluate() only catches a *syntax* error — an undefined component
 * compiles fine and then throws at render time — so this deterministic
 * source-vs-translated diff is the real guard, with no need to execute the MDX.
 */
export function checkComponentTags(
  sourceMdx: string,
  translatedMdx: string,
): { ok: true } | { ok: false; reason: string } {
  const src = componentTags(sourceMdx);
  const out = componentTags(translatedMdx);
  if (src.length !== out.length || src.some((t, i) => t !== out[i])) {
    return {
      ok: false,
      reason: `component tags changed (expected [${src.join(", ")}], got [${out.join(", ")}])`,
    };
  }
  return { ok: true };
}
