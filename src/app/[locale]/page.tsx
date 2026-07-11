import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAllFrontmatter } from "@/lib/mdx";
import { RevealOnView } from "@/components/Reveal";
import { HeroHeadline } from "@/components/HeroHeadline";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { SandboxCarousel } from "@/components/SandboxCarousel";

// Hero image stack: one card flies into the right-hand pile per reveal step
// (3 header lines + the sub text = 4). `src` = 480px card image (quick load), `full` =
// full-res lightbox image. Hosted on Firebase Storage (media/home/hero/) because
// App Hosting does NOT serve public/ — local paths 404 on the deploy. Source
// files are kept in public/home/hero/. See docs/MEDIA-PIPELINE.md.
const HERO_STACK = [
  {
    // "conducts research to find insights" — the interview photo (landscape).
    src: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fresearch-480.jpg?alt=media",
    full: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fresearch.avif?alt=media",
    w: 480,
    h: 364,
    caption: "Conducting user research — interviews and synthesis that surface the insight.",
  },
  {
    // "creates comprehensive designs" — the "comprehensive deployment" photo (portrait).
    src: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fdesign-480.jpg?alt=media",
    full: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fdesign.webp?alt=media",
    w: 360,
    h: 480,
    caption: "Comprehensive design — the system, flows, and screens it produces.",
  },
  {
    // "tests prototypes and deploys products" — no photo supplied yet.
    src: "",
    full: "",
    caption:
      "Prototype, test, and ship. (Placeholder — add a photo; use a Firebase Storage URL for the deploy.)",
  },
  {
    // The lede — the team photo ("the last photo", square).
    src: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fimpact-480.jpg?alt=media",
    full: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fimpact.jpeg?alt=media",
    w: 480,
    h: 480,
    caption: "The team behind the work.",
  },
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
      {/* Hero — header lines reveal step by step, then the sub text and CTAs,
          with a card flying into the stack per step (see HeroHeadline).
          TODO(i18n): move copy to messages once finalized */}
      <section className="snap-section container-page flex min-h-[70vh] flex-col items-start justify-center py-16 text-left sm:py-24">
        <HeroHeadline stack={HERO_STACK} />
      </section>
      {/* Marks the hero's bottom edge — GlobalNav reveals once this scrolls past
          the top of the viewport. */}
      <div id="hero-sentinel" aria-hidden />

      {/* Projects — featured showcase. Opacity-only reveal (rise=false): the
          section holds a sticky heading, which a transformed ancestor breaks.
          No delay: it sits below the hero's min-h-[70vh] section, so it reveals
          on scroll-in — a hold here would just be dead air before content. */}
      <RevealOnView rise={false}>
        <section id="work" className="container-page py-16 grid grid-cols-1 lg:grid-cols-12 gap-x-8 lg:gap-x-16 gap-y-0 scroll-mt-24">
          <h3 className="text-h3 sticky top-24 z-20 mb-8 lg:col-span-3">{t("caseStudy")}</h3>
          <FeaturedProjects items={projects} detailsLabel={t("details")} />
        </section>
      </RevealOnView>

      {/* Sandbox — native horizontal scroll strip (overscroll-x-contain guards
          Chrome's back-swipe). Opacity-only reveal keeps it unobtrusive. */}
      <RevealOnView rise={false}>
        <SandboxCarousel
          items={sandbox}
          heading={t("play")}
          detailsLabel={t("details")}
        />
      </RevealOnView>
    </>
  );
}
