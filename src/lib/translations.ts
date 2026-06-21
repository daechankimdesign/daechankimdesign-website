import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { evaluate } from "next-mdx-remote-client/rsc";
import rehypeSlug from "rehype-slug";
import rehypeUnwrapImages from "rehype-unwrap-images";
import { mdxComponents } from "@/components/mdx";
import { adminDb } from "@/lib/firebase/admin";
import { checkPreservedFrontmatter, checkComponentTags } from "@/lib/mdx-validate";
import type { ContentType, Frontmatter } from "@/lib/mdx";

export type TranslationStatus = "pending" | "complete";

/**
 * Firestore document at `translations/{slug}_{locale}`. `mdx` is the FULL
 * translated document (frontmatter fence + body) so the render path can treat
 * it exactly like a disk source. `sourceHash` lets the Phase 6 offline script
 * detect when the English source changed.
 */
export type TranslationDoc = {
  slug: string;
  locale: string;
  type: ContentType;
  status: TranslationStatus;
  mdx: string;
  frontmatter: Frontmatter;
  sourceHash: string;
  // Per-attempt owner of a `pending` lock, so a failed attempt only ever rolls
  // back its OWN lock and can't clobber a sibling that re-acquired it.
  lockId?: string;
  createdAt: number;
  updatedAt: number;
};

export type RateLimitStatus = "pending" | "failed";

/**
 * Windowed per-(uid, slug, locale) rate-limit record. `expiresAt` makes it a
 * bounded window, not a permanent marker — treat an expired record as absent,
 * and configure a Firestore TTL policy on this field so the collection
 * self-cleans (see the provisioning checklist).
 */
export type RateLimitDoc = {
  uid: string;
  slug: string;
  locale: string;
  status: RateLimitStatus;
  createdAt: number;
  expiresAt: number;
};

/** A trigger counts against a user's budget for this long before it can retry. */
export const RATE_LIMIT_TTL_MS = 24 * 60 * 60 * 1000;

export const TRANSLATIONS = "translations";
export const RATE_LIMITS = "rateLimits";

export const translationDocId = (slug: string, locale: string) =>
  `${slug}_${locale}`;
export const rateLimitDocId = (uid: string, slug: string, locale: string) =>
  `${uid}_${slug}_${locale}`;

/** Cache tag tying a page's read to its translation, so the action can bust it. */
export const translationTag = (slug: string, locale: string) =>
  `translations:${slug}:${locale}`;

export const sourceHash = (source: string) =>
  createHash("sha256").update(source).digest("hex");

/**
 * Page-render read path: returns the completed translation's full MDX, or null.
 * Wrapped in `unstable_cache` and tagged so `updateTag(translationTag(...))`
 * inside the translate action invalidates both this entry AND the full-route
 * cache of any page that read through it (incl. the English-fallback render).
 */
export function getCachedTranslation(
  slug: string,
  locale: string,
): Promise<{ mdx: string } | null> {
  return unstable_cache(
    async () => {
      try {
        const snap = await adminDb()
          .collection(TRANSLATIONS)
          .doc(translationDocId(slug, locale))
          .get();
        if (!snap.exists) return null;
        const data = snap.data() as TranslationDoc;
        return data.status === "complete" ? { mdx: data.mdx } : null;
      } catch (err) {
        // No credentials / Firestore unreachable: degrade to the English
        // fallback rather than 500 the page, but log so outages are visible.
        console.error(`getCachedTranslation(${slug}, ${locale}) failed:`, err);
        return null;
      }
    },
    ["translation", slug, locale],
    // `tags` gives same-instance read-your-own-writes via updateTag(); the
    // bounded `revalidate` is the cross-instance safety net (updateTag's manifest
    // is per-process and App Hosting runs up to maxInstances), so a `null` cached
    // before a sibling instance completed the translation self-heals within ~60s.
    { tags: [translationTag(slug, locale)], revalidate: 60 },
  )();
}

/**
 * Full pre-store validation, reusing the EXACT render-time MDX pipeline. Three
 * layers: (1) structural frontmatter preservation; (2) component-tag identity
 * (renamed/undefined components compile but crash at render); (3) the translated
 * document compiles with the same hardened options the renderer uses.
 */
export async function validateTranslatedMdx(
  sourceMdx: string,
  translatedMdx: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const preserved = checkPreservedFrontmatter(sourceMdx, translatedMdx);
  if (!preserved.ok) return preserved;

  // Catches renamed/dropped/invented components, which compile but throw at
  // render (evaluate() only surfaces syntax errors).
  const tags = checkComponentTags(sourceMdx, translatedMdx);
  if (!tags.ok) return tags;

  const { error } = await evaluate<Frontmatter>({
    source: translatedMdx,
    options: {
      parseFrontmatter: true,
      disableImports: true,
      disableExports: true,
      mdxOptions: { rehypePlugins: [rehypeUnwrapImages, rehypeSlug] },
    },
    components: mdxComponents,
  });
  if (error) return { ok: false, reason: `MDX failed to compile: ${error}` };
  return { ok: true };
}
