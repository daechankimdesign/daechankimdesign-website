import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { evaluate } from "next-mdx-remote-client/rsc";
import { getFrontmatter } from "next-mdx-remote-client/utils";
import rehypeSlug from "rehype-slug";
import rehypeUnwrapImages from "rehype-unwrap-images";
import { mdxComponents } from "@/components/mdx";
import { getCachedTranslation } from "@/lib/translations";
import { routing } from "@/i18n/routing";
import {
  type WorkStatus,
  stringList,
  toWorkStatus,
} from "@/lib/taxonomy";

export type ContentType = "projects" | "sandbox" | "blog";

/** Frontmatter shape. Translate: title, summary. Preserve: slug, thumbnail, date,
    updated, org, tags. EN-only (NOT in the translation contract, like span/aspect):
    tools, status. */
export type Frontmatter = {
  title: string;
  summary?: string;
  thumbnail?: string;
  date?: string;
  /** Craft tools used, verbatim proper nouns (e.g. "Claude Code", "Figma").
      A visual tag on the tile + slug header. EN-only — never translated. */
  tools?: string[];
  /** Lifecycle: "shipped" | "concept". A canonical key rendered via i18n
      (WorkTags.*), not a display string. EN-only. Absent ⇒ no status badge. */
  status?: WorkStatus;
  /** ISO date the DOCUMENT was last revised (distinct from `date`, which is when
      the WORK happened). Shown in the end-of-story colophon; falls back to
      `date`. A date is language-agnostic, so it's preserved, never translated. */
  updated?: string;
  /** Organization the work was done UNDER — the employer/school/self, not the
      client. Rendered as "@Oria" in the colophon. A proper noun, so preserved. */
  org?: string;
  /** DISCIPLINES only (from the closed DISCIPLINES vocabulary) — the work-board
      filter facets. Repurposed: was a mixed bag of disciplines + tools + topics.
      Stays in PRESERVED_KEYS (already there); read EN-only for the board/header. */
  tags?: string[];
  /** Sandbox live-demo URL — rendered as an interactive frame atop the body. */
  embed?: string;
  /** Per-device facade screenshots (set by scripts/screenshot-embeds.mjs). Each
      falls back to `embedPoster`, then `thumbnail`. */
  embedPosterDesktop?: string;
  embedPosterTablet?: string;
  embedPosterMobile?: string;
  /** Single facade screenshot used when no per-device shot is set. */
  embedPoster?: string;
  /** Optional embed frame height in px (default 720). */
  embedHeight?: number;
  /** Curated home-preview media — image + .mp4 loop URLs, in order. Overrides auto-extraction. */
  cover?: string[];
  /** Work-board layout weight — drives the tile's column span (standard/feature/
      wide). Read from the EN source only (language-agnostic), so it never needs
      translating and never enters the translation-preservation contract. */
  span?: "standard" | "feature" | "wide";
  /** Optional explicit tile aspect ratio (e.g. "4/3"); falls back to the span
      tier default. EN-only, like `span`. */
  aspect?: string;
  [key: string]: unknown;
};

export type ContentItem = { slug: string; frontmatter: Frontmatter; images: string[] };

// English source is canonical on disk; non-English locales come from Firestore.
const CONTENT_ROOT = path.join(process.cwd(), "src", "content", "en");
const dirFor = (type: ContentType) => path.join(CONTENT_ROOT, type);

export async function getSlugs(type: ContentType): Promise<string[]> {
  try {
    const files = await fs.readdir(dirFor(type));
    return files
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, ""));
  } catch {
    return [];
  }
}

/** Canonical English source straight from disk. Null if the slug is absent. */
export const readDiskSource = cache(async (
  type: ContentType,
  slug: string,
): Promise<string | null> => {
  try {
    return await fs.readFile(path.join(dirFor(type), `${slug}.mdx`), "utf8");
  } catch {
    return null;
  }
});

export type LoadedSource = { mdx: string; translated: boolean };

/**
 * Locale-aware source — THE Phase-5 seam. English reads disk. Other locales
 * read the cached Firestore translation when `complete`, else fall back to the
 * English source (never 404 purely because a translation is missing). Returns
 * null only when the English source itself is absent (a genuine 404).
 */
export const readSource = cache(async (
  type: ContentType,
  slug: string,
  locale: string = routing.defaultLocale,
): Promise<LoadedSource | null> => {
  if (locale === routing.defaultLocale) {
    const mdx = await readDiskSource(type, slug);
    return mdx === null ? null : { mdx, translated: false };
  }
  const translation = await getCachedTranslation(slug, locale);
  if (translation) return { mdx: translation.mdx, translated: true };

  const fallback = await readDiskSource(type, slug);
  return fallback === null ? null : { mdx: fallback, translated: false };
});

/** Frontmatter only — cheap (no compile). For index grids. Newest first. */
export const getAllFrontmatter = cache(async (
  type: ContentType,
  locale: string = routing.defaultLocale,
): Promise<ContentItem[]> => {
  const slugs = await getSlugs(type);
  const items = await Promise.all(
    slugs.map(async (slug) => {
      const loaded = await readSource(type, slug, locale);
      if (!loaded) return null;
      const { frontmatter } = getFrontmatter<Frontmatter>(loaded.mdx);

      // A curated `cover` (image + .mp4 loop URLs, in order) drives the home
      // preview verbatim; otherwise auto-extract images from the body below.
      const cover = Array.isArray(frontmatter.cover)
        ? frontmatter.cover.filter(
            (s): s is string => typeof s === "string" && s.length > 0,
          )
        : [];
      if (cover.length > 0) {
        return { slug, frontmatter, images: cover.slice(0, 6) } satisfies ContentItem;
      }

      // Extract images from the MDX source
      const images: string[] = [];
      if (frontmatter.thumbnail) {
        images.push(frontmatter.thumbnail);
      }

      const jsxRegex = /<MDXImage\s+[^>]*src=["']([^"']+)["']/g;
      let match;
      while ((match = jsxRegex.exec(loaded.mdx)) !== null) {
        images.push(match[1]);
      }

      const mdRegex = /!\[.*?\]\((.*?)\)/g;
      while ((match = mdRegex.exec(loaded.mdx)) !== null) {
        images.push(match[1]);
      }

      const uniqueImages = Array.from(new Set(images));

      // Hide items with no real media — drop them from every listing (home +
      // index). "Real" = a non-placeholder image or a <VideoPlayer>; a curated
      // `cover` (handled above) always counts. No placeholder padding: an item
      // either has its own images or it isn't shown.
      const realImages = uniqueImages.filter((u) => !u.includes("placehold.co"));
      const hasVideo = /<VideoPlayer[\s/>]/.test(loaded.mdx);
      if (realImages.length === 0 && !hasVideo) return null;

      return {
        slug,
        frontmatter,
        images: realImages.slice(0, 5),
      } satisfies ContentItem;
    }),
  );
  return items
    .filter((x): x is ContentItem => x !== null)
    .sort((a, b) =>
      String(b.frontmatter.date ?? "").localeCompare(
        String(a.frontmatter.date ?? ""),
      ),
    );
});

// ── Work board ───────────────────────────────────────────────────────────────
// The unified /project board merges the two work content types at the PRESENTATION
// layer only: each on-disk type stays separate and routes to its own detail
// sub-tree. See docs / the work-board plan.

export type WorkType = "projects" | "sandbox";
export type Span = "standard" | "feature" | "wide";

/** A work item tagged for the board: its content type, detail base path, resolved
    layout weight, and a normalized ISO sort key. */
export type BoardItem = ContentItem & {
  type: WorkType;
  basePath: string;
  span: Span;
  aspect?: string;
  sortKey: string;
  // Taxonomy, read EN-only (like span/aspect) — never from the translated doc.
  /** 4-digit work year, derived from `date`. */
  year: string;
  /** Filter facets — the closed discipline vocabulary. */
  disciplines: string[];
  /** Craft tools, verbatim. Visual tag. */
  tools: string[];
  /** Lifecycle badge; absent ⇒ no badge. */
  status?: WorkStatus;
};

// case-study ↔ projects, play ↔ sandbox (mirrors SettingsModal's SEGMENT_TO_TYPE).
const WORK_BASE_PATH: Record<WorkType, string> = {
  projects: "/project/case-study",
  sandbox: "/project/play",
};

// YAML coerces an UNQUOTED `date: 2026-03-01` to a Date but leaves a QUOTED
// "2025-05-04" a string. String(Date) is "Fri Mar 01 2026 …", which sorts wrong
// against ISO strings — so normalize everything to `YYYY-MM-DD` before merging.
export function normalizeDate(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return typeof d === "string" ? d : "";
}

// Default tile size by TYPE (Pentagram-style editorial rhythm): case studies read
// as the large ⅔-width tiles, play pieces as the small ⅓-width tiles. An explicit
// `span` in the EN frontmatter still overrides, for hand-tuning a standout piece.
function resolveSpan(s: unknown, type: WorkType): Span {
  if (s === "standard" || s === "feature" || s === "wide") return s;
  return type === "projects" ? "wide" : "standard";
}

/**
 * Always lead a board with a case study (project), never a play piece: hoist the
 * most recent project to the front; everything else stays reverse-chronological.
 *
 * PURE, and it must stay that way. `getWorkBoardItems` is `cache()`d, so its
 * result is one array shared by every consumer in a request. `MoreWork` filters
 * that array and re-leads the copy — doing it with splice/unshift in place would
 * reorder the board for everyone else on the page.
 */
export function leadWithCaseStudy(items: BoardItem[]): BoardItem[] {
  const out = items.slice();
  const lead = out.findIndex((it) => it.type === "projects");
  if (lead > 0) out.unshift(...out.splice(lead, 1));
  return out;
}

/**
 * Editorial cadence for the board: SPACE the case studies out so each one anchors
 * a row-pair instead of clumping at the top and bottom. Emit a project, then up to
 * 2 play pieces, and repeat. With the default spans (project = wide ⅔ tile, play =
 * standard ⅓ tile) the 12-col grid then reads:
 *   row 1 [project · play]   row 2 [play · project]   row 3 [play · play] …
 * so case studies zig-zag left→right down the page (and it still LEADS with a
 * project). Reverse-chronological WITHIN each type is preserved. PURE (same
 * cache()-sharing contract as leadWithCaseStudy) — returns a new array.
 */
export function interleaveBoard(items: BoardItem[]): BoardItem[] {
  const projects = items.filter((it) => it.type === "projects");
  const plays = items.filter((it) => it.type === "sandbox");
  const out: BoardItem[] = [];
  let p = 0;
  for (const project of projects) {
    out.push(project);
    out.push(...plays.slice(p, p + 2));
    p += 2;
  }
  out.push(...plays.slice(p));
  return out;
}

/**
 * The merged, sorted board dataset. Loads both work types for the requested
 * locale, then reads the LAYOUT fields (`span`, `aspect`) and the sort `date`
 * from the canonical EN item — those are language-agnostic, so they live only in
 * the EN source and never enter the ko/es translation-preservation contract.
 * Reverse-chronological across both types. Items whose only media is a
 * placeholder are already dropped upstream by getAllFrontmatter.
 */
export const getWorkBoardItems = cache(async (
  locale: string = routing.defaultLocale,
): Promise<BoardItem[]> => {
  const types: WorkType[] = ["projects", "sandbox"];
  const perType = await Promise.all(
    types.map(async (type) => {
      const [items, enItems] = await Promise.all([
        getAllFrontmatter(type, locale),
        getAllFrontmatter(type, routing.defaultLocale),
      ]);
      const enBySlug = new Map(enItems.map((it) => [it.slug, it.frontmatter]));
      return items.map((it): BoardItem => {
        const en = enBySlug.get(it.slug) ?? it.frontmatter;
        const sortKey = normalizeDate(en.date ?? it.frontmatter.date);
        return {
          ...it,
          type,
          basePath: WORK_BASE_PATH[type],
          span: resolveSpan(en.span, type),
          aspect: typeof en.aspect === "string" ? en.aspect : undefined,
          sortKey,
          // Taxonomy from the canonical EN item (language-agnostic).
          year: sortKey.slice(0, 4),
          disciplines: stringList(en.tags),
          tools: stringList(en.tools),
          status: toWorkStatus(en.status),
        };
      });
    }),
  );
  const sorted = perType
    .flat()
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  return interleaveBoard(sorted);
});

/**
 * EN-only visual-tag data (year / tools / status) for a slug detail header.
 * Detail pages compile the TRANSLATED doc via getCompiled, but tools/status are
 * EN-only (off the preservation contract), so they're read from the canonical
 * source here — cheap (no MDX compile), immune to translation staleness. `date`
 * is preserved, so the derived year is identical across locales anyway.
 */
export const getWorkMeta = cache(async (
  type: ContentType,
  slug: string,
): Promise<{ year: string; tools: string[]; status?: WorkStatus }> => {
  const mdx = await readDiskSource(type, slug);
  if (!mdx) return { year: "", tools: [] };
  const { frontmatter } = getFrontmatter<Frontmatter>(mdx);
  return {
    year: normalizeDate(frontmatter.date).slice(0, 4),
    tools: stringList(frontmatter.tools),
    status: toWorkStatus(frontmatter.status),
  };
});

/** Full compile for a detail page. Returns null if the source is missing. */
export const getCompiled = cache(async (
  type: ContentType,
  slug: string,
  locale: string = routing.defaultLocale,
) => {
  const loaded = await readSource(type, slug, locale);
  if (loaded === null) return null;

  const { content, frontmatter, error } = await evaluate<Frontmatter>({
    source: loaded.mdx,
    options: {
      parseFrontmatter: true,
      // Untrusted-content hardening (Firestore MDX is untrusted at render time).
      disableImports: true,
      disableExports: true,
      // unwrap-images first: lift a lone markdown image out of its <p> so the
      // <figure> MDXImage renders isn't nested in a <p> (invalid HTML).
      mdxOptions: { rehypePlugins: [rehypeUnwrapImages, rehypeSlug] },
    },
    components: mdxComponents,
  });

  return { content, frontmatter, error, translated: loaded.translated };
});

/** Compile a standalone top-level page (e.g. `about.mdx`) from disk. */
export const getCompiledPage = cache(async (name: string) => {
  let source: string;
  try {
    source = await fs.readFile(
      path.join(CONTENT_ROOT, `${name}.mdx`),
      "utf8",
    );
  } catch {
    return null;
  }

  const { content, frontmatter, error } = await evaluate<Frontmatter>({
    source,
    options: {
      parseFrontmatter: true,
      disableImports: true,
      disableExports: true,
      mdxOptions: { rehypePlugins: [rehypeUnwrapImages, rehypeSlug] },
    },
    components: mdxComponents,
  });

  return { content, frontmatter, error };
});
