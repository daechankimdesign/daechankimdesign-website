import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAllFrontmatter } from "@/lib/mdx";
import { DisplayHeading } from "@/components/DisplayHeading";
import { HeroHeadline } from "@/components/HeroHeadline";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { SandboxCarousel } from "@/components/SandboxCarousel";

// Ubiquitous prefix stays fixed; only this trailing clause rotates (from
// content/Website notes). TODO(i18n): move to messages once finalized.
const HERO_ROTATIONS = [
  "plans and conducts user research.",
  "synthesizes and surfaces research insights.",
  "structures interface and deploy prototypes.",
  "conduct user testing and develop iterations.",
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
      {/* Hero — TODO(i18n): move copy to messages once finalized */}
      <section className="container-page flex min-h-[70vh] flex-col items-start justify-center py-16 text-left sm:py-24 md:items-center md:text-center">
        <DisplayHeading>
          <HeroHeadline phrases={HERO_ROTATIONS} />
        </DisplayHeading>
        <p className="text-sub-display mt-8 max-w-[60ch] text-fg-muted">
          3+ years across a B2B2C startup and global client work, creating
          comprehensive designs and building impactful products validated by
          users, with the latest AI tools for prototyping and deployment.
        </p>
      </section>

      {/* Projects — featured showcase */}
      <section className="container-page py-16 grid grid-cols-1 lg:grid-cols-12 gap-x-8 lg:gap-x-16 gap-y-0">
        <h3 className="text-h3 sticky top-24 z-20 lg:col-span-3">{t("projects")}</h3>
        <FeaturedProjects items={projects} detailsLabel="Details" />
      </section>

      {/* Sandbox — pinned horizontal carousel */}
      <SandboxCarousel items={sandbox} heading={t("sandbox")} />
    </>
  );
}
