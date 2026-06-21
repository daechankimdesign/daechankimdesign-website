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

export type ContentType = "projects" | "sandbox" | "blog";

/** Frontmatter shape. Translate: title, summary. Preserve: slug, thumbnail, date, tags. */
export type Frontmatter = {
  title: string;
  summary?: string;
  thumbnail?: string;
  date?: string;
  tags?: string[];
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

      // Generate fallback placeholders using the slug as seed if we have fewer than 3 images
      if (uniqueImages.length < 3) {
        const seedBase = slug || "project";
        while (uniqueImages.length < 3) {
          const index = uniqueImages.length;
          uniqueImages.push(`https://picsum.photos/seed/${seedBase}-${index}/1600/900`);
        }
      }

      const finalImages = uniqueImages.slice(0, 5);

      return { slug, frontmatter, images: finalImages } satisfies ContentItem;
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
