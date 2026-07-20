import { notFound } from "next/navigation";
import { FlaskSolid } from "iconoir-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getCompiled, getSlugs, getWorkMeta } from "@/lib/mdx";
import { routing } from "@/i18n/routing";
import { Reveal, RevealItem } from "@/components/Reveal";
import { SandboxEmbed } from "@/components/SandboxEmbed";
import { SideDocumentTab } from "@/components/SideDocumentTab";
import { MoreWork } from "@/components/MoreWork";
import { Colophon } from "@/components/Colophon";

// Pre-render only the canonical English combos; ko/es render on first request
// (dynamicParams defaults to true) so a freshly-translated locale appears
// without a redeploy. Unknown slugs still 404 via getCompiled -> notFound().
export async function generateStaticParams() {
  const slugs = await getSlugs("sandbox");
  return slugs.map((slug) => ({ locale: routing.defaultLocale, slug }));
}

export default async function PlayDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const result = await getCompiled("sandbox", slug, locale);
  if (!result) notFound();
  const { content, frontmatter, error, translated } = result;
  const showUntranslated = locale !== routing.defaultLocale && !translated;

  if (error) {
    return (
      <main className="container-page pt-32 pb-16">
        <p className="text-body text-fg-muted">
          This entry could not be rendered.
        </p>
      </main>
    );
  }

  // Only the non-English, untranslated case renders the notice — fetch its copy
  // lazily so English requests don't await translations they never use.
  const untranslatedNotice = showUntranslated
    ? (await getTranslations("Content"))("untranslated")
    : null;

  const typeLabel = (await getTranslations("Nav"))("play");
  const wt = await getTranslations("WorkTags");
  const meta = await getWorkMeta("sandbox", slug);

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

        {/* Right Side: Main Content */}
        <div className="flex-1 min-w-0 content-column-narrow">
          {/* Interactive project embed — sits above the title/header when the
              piece has a live demo (`embed` in frontmatter). Pieces without one
              (e.g. a Chrome extension) render no frame at all. */}
          {frontmatter.embed ? (
            <SandboxEmbed
              src={frontmatter.embed}
              title={frontmatter.title}
              posters={{
                desktop:
                  frontmatter.embedPosterDesktop ??
                  frontmatter.embedPoster ??
                  frontmatter.thumbnail,
                tablet:
                  frontmatter.embedPosterTablet ??
                  frontmatter.embedPoster ??
                  frontmatter.thumbnail,
                mobile:
                  frontmatter.embedPosterMobile ??
                  frontmatter.embedPoster ??
                  frontmatter.thumbnail,
              }}
              height={
                frontmatter.embedHeight
                  ? Number(frontmatter.embedHeight)
                  : undefined
              }
            />
          ) : null}

          <header className="mb-8 measure">
            <Reveal>
              <RevealItem as="p" className="mb-4">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <span className="text-caption inline-flex items-center gap-1.5 border border-hairline px-2.5 py-1 text-fg">
                    <FlaskSolid aria-hidden width={14} height={14} strokeWidth={1.5} />
                    {typeLabel}
                  </span>
                </span>
              </RevealItem>
              <RevealItem as="h1" className="text-display">
                {frontmatter.title}
              </RevealItem>
              {/* `summary` is intentionally NOT rendered here: it's kept in the
                  MDX frontmatter (still used for the board tiles / metadata) but
                  hidden from the detail page header. Disciplines (tags) live in
                  the board filter, not here — the header shows status + tools +
                  year, in that order. */}
              {(() => {
                const metaLine = [
                  meta.status ? wt(meta.status) : null,
                  ...meta.tools,
                  meta.year,
                ].filter(Boolean);
                return metaLine.length > 0 ? (
                  <RevealItem as="p" className="text-caption mt-3 text-fg-muted uppercase">
                    {metaLine.join("  ·  ")}
                  </RevealItem>
                ) : null;
              })()}
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
            currentType="sandbox"
            currentSlug={slug}
            locale={locale}
          />
        </div>
      </div>
    </main>
  );
}
