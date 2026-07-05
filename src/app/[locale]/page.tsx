import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAllFrontmatter } from "@/lib/mdx";
import { RevealOnView } from "@/components/Reveal";
import { HeroHeadline } from "@/components/HeroHeadline";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { SandboxCarousel } from "@/components/SandboxCarousel";

// Ubiquitous prefix stays fixed; only this trailing clause rotates (from
// content/Website notes). TODO(i18n): move to messages once finalized.
const HERO_ROTATIONS = [
  "conducts research to find insights,",
  "creates comprehensive designs,",
  "tests prototypes and deploys products.",
];

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nav");
  const [projects, sandbox] = await Promise.all([
    getAllFrontmatter("projects", locale),
    getAllFrontmatter("sandbox", locale),
  ]);

  return (
    <>
      {/* Hero — lede pinned on top; the clauses stack downward on a timed loop
          inside HeroHeadline. TODO(i18n): move copy to messages once finalized */}
      <section className="container-page flex min-h-[70vh] flex-col items-start justify-center py-16 text-left sm:py-24">
        <HeroHeadline
          phrases={HERO_ROTATIONS}
          lede="3+ years across a B2B2C startup and global client work, creating comprehensive designs and building impactful products validated by users, with the latest AI tools for prototyping and deployment."
        />
      </section>

      {/* Projects — featured showcase. Opacity-only reveal (rise=false): the
          section holds a sticky heading, which a transformed ancestor breaks.
          Delayed so it lands after the hero cascade (it's in view on load). */}
      <RevealOnView rise={false} delay={1}>
        <section id="work" className="container-page py-16 grid grid-cols-1 lg:grid-cols-12 gap-x-8 lg:gap-x-16 gap-y-0 scroll-mt-24">
          <h3 className="text-h3 sticky top-24 z-20 lg:col-span-3">{t("projects")}</h3>
          <FeaturedProjects items={projects} detailsLabel="Details" />
        </section>
      </RevealOnView>

      {/* Sandbox — native horizontal scroll strip (overscroll-x-contain guards
          Chrome's back-swipe). Opacity-only reveal keeps it unobtrusive. */}
      <RevealOnView rise={false}>
        <SandboxCarousel items={sandbox} heading={t("sandbox")} />
      </RevealOnView>
    </>
  );
}
