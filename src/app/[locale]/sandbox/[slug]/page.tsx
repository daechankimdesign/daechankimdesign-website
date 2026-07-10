import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getCompiled, getSlugs } from "@/lib/mdx";
import { routing } from "@/i18n/routing";
import { Reveal, RevealItem } from "@/components/Reveal";
import { SandboxEmbed } from "@/components/SandboxEmbed";
import { SideDocumentTab } from "@/components/SideDocumentTab";

// Pre-render only the canonical English combos; ko/es render on first request
// (dynamicParams defaults to true) so a freshly-translated locale appears
// without a redeploy. Unknown slugs still 404 via getCompiled -> notFound().
export async function generateStaticParams() {
  const slugs = await getSlugs("sandbox");
  return slugs.map((slug) => ({ locale: routing.defaultLocale, slug }));
}

export default async function SandboxDetailPage({
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
  const tContent = await getTranslations("Content");

  if (error) {
    return (
      <main className="container-page pt-32 pb-16">
        <p className="text-body text-fg-muted">
          This entry could not be rendered.
        </p>
      </main>
    );
  }

  return (
    <main className="container-page pt-32 pb-16">
      {showUntranslated ? (
        <p className="text-caption mb-6 rounded-md border border-hairline bg-surface-subtle px-4 py-3 text-fg-muted">
          {tContent("untranslated")}
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
        <div className="flex-1 min-w-0 content-column">
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
              <RevealItem as="h1" className="text-display">
                {frontmatter.title}
              </RevealItem>
              {frontmatter.summary ? (
                <RevealItem as="p" className="text-body mt-3 text-fg-muted">
                  {frontmatter.summary}
                </RevealItem>
              ) : null}
              {frontmatter.tags && frontmatter.tags.length > 0 ? (
                <RevealItem as="p" className="text-caption mt-3 text-fg-muted">
                  {frontmatter.tags.join("  ·  ")}
                </RevealItem>
              ) : null}
            </Reveal>
          </header>

          <article>{content}</article>
        </div>
      </div>
    </main>
  );
}
