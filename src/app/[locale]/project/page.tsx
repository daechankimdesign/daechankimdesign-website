import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAllFrontmatter } from "@/lib/mdx";
import { RevealOnView } from "@/components/Reveal";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { SandboxCarousel } from "@/components/SandboxCarousel";

// Unified Work index. Two labeled showcases: Case Study (the former /project
// list, rendered as per-piece vertical cover-flow decks) and Play (the former
// /sandbox list, a horizontal cover-flow strip). Each keeps its own on-disk
// content type — the merge is routing + labeling only.
export default async function WorkIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nav");
  const [caseStudies, play] = await Promise.all([
    getAllFrontmatter("projects", locale),
    getAllFrontmatter("sandbox", locale),
  ]);

  return (
    <main className="pt-24">
      {/* Page title for a11y/SEO — the visible design carries the two section
          labels (Case Study / Play), so the top-level "Work" heading is
          screen-reader/crawler-only. */}
      <h1 className="sr-only">{t("work")}</h1>

      {/* Case Study — each piece is its own vertical cover-flow deck. Opacity-only
          reveal (rise=false): the section holds a sticky heading, which a
          transformed ancestor would break. */}
      <RevealOnView rise={false}>
        <section
          id="case-study"
          className="container-page py-16 grid grid-cols-1 lg:grid-cols-12 gap-x-8 lg:gap-x-16 gap-y-0 scroll-mt-24"
        >
          <h2 className="text-h3 sticky top-24 z-20 lg:col-span-3">
            {t("caseStudy")}
          </h2>
          <FeaturedProjects items={caseStudies} detailsLabel={t("details")} />
        </section>
      </RevealOnView>

      {/* Play — native horizontal cover-flow strip (its own section + heading). */}
      <RevealOnView rise={false}>
        <SandboxCarousel
          items={play}
          heading={t("play")}
          detailsLabel={t("details")}
          headingLevel={2}
        />
      </RevealOnView>
    </main>
  );
}
