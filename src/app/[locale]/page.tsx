import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAllFrontmatter } from "@/lib/mdx";
import { DisplayHeading } from "@/components/DisplayHeading";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { ContentGrid } from "@/components/ContentGrid";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nav");
  const [projects, sandbox] = await Promise.all([
    getAllFrontmatter("projects"),
    getAllFrontmatter("sandbox"),
  ]);

  return (
    <>
      {/* Hero — TODO(i18n): move copy to messages once finalized */}
      <section className="container-page flex min-h-[72vh] flex-col items-center justify-center py-24 text-center">
        <DisplayHeading>
          Daechan Kim, a product designer plans and conducts qualitative research
        </DisplayHeading>
        <p className="text-body mt-8 max-w-[60ch] text-fg-muted">
          3+ years across a B2B2C startup and global client work, leading
          end-to-end design and building impactful products validated by users,
          with the latest AI tools for prototyping and deployment.
        </p>
      </section>

      {/* Projects — featured showcase */}
      <section className="container-page py-16">
        <h2 className="text-h2 mb-8">{t("projects")}</h2>
        <FeaturedProjects items={projects} detailsLabel="Details" />
      </section>

      {/* Sandbox — 3-up grid */}
      <section className="container-page py-16">
        <h2 className="text-h2 mb-8">{t("sandbox")}</h2>
        <ContentGrid basePath="/sandbox" items={sandbox} />
      </section>
    </>
  );
}
