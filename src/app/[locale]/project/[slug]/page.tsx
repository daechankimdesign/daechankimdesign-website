import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCompiled, getSlugs } from "@/lib/mdx";
import { routing } from "@/i18n/routing";
import { DisplayHeading } from "@/components/DisplayHeading";
import { SideDocumentTab } from "@/components/SideDocumentTab";

// Only pre-generated (locale × slug) combos exist; unknown slugs 404 without a
// runtime filesystem read. Phase 6 will revisit this for Firestore translations.
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getSlugs("projects");
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const result = await getCompiled("projects", slug);
  if (!result) notFound();
  const { content, frontmatter, error } = result;

  if (error) {
    return (
      <main className="container-page py-16">
        <p className="text-body text-fg-muted">
          This case study could not be rendered.
        </p>
      </main>
    );
  }

  return (
    <main className="container-page py-16">
      <header className="mb-8 max-w-[70ch]">
        <DisplayHeading>{frontmatter.title}</DisplayHeading>
        {frontmatter.summary ? (
          <p className="text-body mt-3 text-fg-muted">{frontmatter.summary}</p>
        ) : null}
        {frontmatter.tags && frontmatter.tags.length > 0 ? (
          <p className="text-caption mt-3 text-fg-muted">
            {frontmatter.tags.join("  ·  ")}
          </p>
        ) : null}
      </header>
      <article>{content}</article>
      <SideDocumentTab />
    </main>
  );
}
