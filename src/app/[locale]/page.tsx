import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAllFrontmatter } from "@/lib/mdx";
import { DisplayHeading } from "@/components/DisplayHeading";
import { RotatingText } from "@/components/RotatingText";
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
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <DisplayHeading>
          <span className="block">Daechan Kim, a product designer</span>
          <RotatingText phrases={HERO_ROTATIONS} />
        </DisplayHeading>
        <p className="text-h3 mt-8 max-w-[60ch] text-fg-muted">
          3+ years across a B2B2C startup and global client work, leading
          end-to-end design and building impactful products validated by users,
          with the latest AI tools for prototyping and deployment.
        </p>
      </section>

      {/* Projects — featured showcase */}
      <section className="container-page py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <h3 className="text-h3 sticky top-24 z-20 lg:col-span-3">{t("projects")}</h3>
        <FeaturedProjects items={projects} detailsLabel="Details" />
      </section>

      {/* Sandbox — pinned horizontal carousel */}
      <SandboxCarousel items={sandbox} heading={t("sandbox")} />
    </>
  );
}
