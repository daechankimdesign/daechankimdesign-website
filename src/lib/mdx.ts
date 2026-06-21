import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { evaluate } from "next-mdx-remote-client/rsc";
import { getFrontmatter } from "next-mdx-remote-client/utils";
import rehypeSlug from "rehype-slug";
import { mdxComponents } from "@/components/mdx";

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

export type ContentItem = { slug: string; frontmatter: Frontmatter };

// English source lives on disk; translations come from Firestore (Phase 6).
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

export async function readSource(
  type: ContentType,
  slug: string,
): Promise<string | null> {
  try {
    return await fs.readFile(path.join(dirFor(type), `${slug}.mdx`), "utf8");
  } catch {
    return null;
  }
}

/** Frontmatter only — cheap (no compile). For index grids. Newest first. */
export async function getAllFrontmatter(
  type: ContentType,
): Promise<ContentItem[]> {
  const slugs = await getSlugs(type);
  const items = await Promise.all(
    slugs.map(async (slug) => {
      const source = await readSource(type, slug);
      if (!source) return null;
      const { frontmatter } = getFrontmatter<Frontmatter>(source);
      return { slug, frontmatter } satisfies ContentItem;
    }),
  );
  return items
    .filter((x): x is ContentItem => x !== null)
    .sort((a, b) =>
      String(b.frontmatter.date ?? "").localeCompare(
        String(a.frontmatter.date ?? ""),
      ),
    );
}

/** Full compile for a detail page. Returns null if the file is missing. */
export async function getCompiled(type: ContentType, slug: string) {
  const source = await readSource(type, slug);
  if (source === null) return null;

  const { content, frontmatter, error } = await evaluate<Frontmatter>({
    source,
    options: {
      parseFrontmatter: true,
      // Untrusted-content hardening (matters for Firestore MDX in Phase 6).
      disableImports: true,
      disableExports: true,
      mdxOptions: { rehypePlugins: [rehypeSlug] },
    },
    components: mdxComponents,
  });

  return { content, frontmatter, error };
}
