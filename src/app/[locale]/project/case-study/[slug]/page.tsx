import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getCompiled, getSlugs, getWorkMeta } from "@/lib/mdx";
import { routing } from "@/i18n/routing";
import { Reveal, RevealItem } from "@/components/Reveal";
import { SideDocumentTab } from "@/components/SideDocumentTab";
import { StatusBadge } from "@/components/StatusBadge";
import { MoreWork } from "@/components/MoreWork";
import { Colophon } from "@/components/Colophon";

// Pre-render only the canonical English combos; ko/es render on first request
// (dynamicParams defaults to true) so a freshly-translated locale appears
// without a redeploy. Unknown slugs still 404 via getCompiled -> notFound().
export async function generateStaticParams() {
  const slugs = await getSlugs("projects");
  return slugs.map((slug) => ({ locale: routing.defaultLocale, slug }));
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const result = await getCompiled("projects", slug, locale);
  if (!result) notFound();
  const { content, frontmatter, error, translated } = result;
  const showUntranslated = locale !== routing.defaultLocale && !translated;

  if (error) {
    return (
      <main className="container-page pt-32 pb-16">
        <p className="text-body text-fg-muted">
          This case study could not be rendered.
        </p>
      </main>
    );
  }

  // Only the non-English, untranslated case renders the notice — fetch its copy
  // lazily so English requests don't await translations they never use.
  const untranslatedNotice = showUntranslated
    ? (await getTranslations("Content"))("untranslated")
    : null;

  const typeLabel = (await getTranslations("Nav"))("caseStudy");
  const wt = await getTranslations("WorkTags");
  const meta = await getWorkMeta("projects", slug);

  return (
    <main className="container-page pt-32 pb-16">
      {untranslatedNotice ? (
        <p className="text-note mb-6 rounded-md border border-hairline bg-surface-subtle px-4 py-3 text-fg-muted">
          {untranslatedNotice}
        </p>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left Side: Sticky Side Document Tab */}
        <aside className="hidden lg:block lg:w-48 lg:shrink-0">
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto pr-2">
            <SideDocumentTab />
          </div>
        </aside>

        {/* Right Side: Main Case Study Content */}
        <div className="flex-1 min-w-0 content-column-narrow">
          <header className="mb-8 measure">
            <Reveal>
              <RevealItem as="p" className="mb-4">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <span className="text-caption inline-flex items-center bg-fg px-2.5 py-1 text-canvas">
                    {typeLabel}
                  </span>
                  {meta.status ? (
                    <StatusBadge status={meta.status} label={wt(meta.status)} />
                  ) : null}
                </span>
              </RevealItem>
              <RevealItem as="h1" className="text-display">
                {frontmatter.title}
              </RevealItem>
              {/* `summary` is intentionally NOT rendered here: it's kept in the
                  MDX frontmatter (still used for the board tiles / metadata) but
                  hidden from the detail page header. Disciplines (tags) live in
                  the board filter, not here — the header shows year + tools. */}
              {meta.year || meta.tools.length > 0 ? (
                <RevealItem as="p" className="text-caption mt-3 text-fg-muted uppercase">
                  {[meta.year, ...meta.tools].filter(Boolean).join("  ·  ")}
                </RevealItem>
              ) : null}
            </Reveal>
          </header>
          <article>{content}</article>

          {/* Closes the story out — updated date + @org over the rule. Renders
              the rule even when MoreWork below has nothing to show. */}
          <Colophon
            updated={frontmatter.updated}
            date={frontmatter.date}
            org={frontmatter.org}
            locale={locale}
          />

          {/* Sibling of <article>, inside the content column: inherits the
              article's edge + 768px cap, and stays out of SideDocumentTab's
              `article :is(h1,h2,h3)` scroll-spy. See MoreWork. */}
          <MoreWork
            currentType="projects"
            currentSlug={slug}
            locale={locale}
          />
        </div>
      </div>
    </main>
  );
}
