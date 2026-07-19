import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAllFrontmatter, getWorkBoardItems } from "@/lib/mdx";
import { HeroHeadline } from "@/components/HeroHeadline";
import { HomeWorkSection } from "@/components/HomeWorkSection";

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
    headline:
      "If I'm financially stable and settle in one place, I will definitely buy better furniture.",
    caption:
      "My design research starts with stakeholder interviews. It is a crucial part of the project to listen and understand people's pain beyond their surface language.",
  },
  {
    // Design exhibition — presenting the work to a visitor at the showcase (square).
    src: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fstack-5-480.jpg?alt=media",
    full: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fstack-5.jpg?alt=media",
    w: 480,
    h: 480,
    headline: "",
    caption: "At a design exhibition, walking a visitor through the work.",
  },
  {
    // The critique photo (landscape) — reviewing the work pinned to the wall.
    src: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fcritique-480.jpg?alt=media",
    full: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fcritique.jpg?alt=media",
    w: 480,
    h: 356,
    headline: "",
    caption: "A design critique, working through the board pinned to the wall.",
  },
  {
    // The lede — the team photo ("the last photo", square).
    src: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fimpact-480.jpg?alt=media",
    full: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fimpact.jpeg?alt=media",
    w: 480,
    h: 480,
    headline: "",
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
  const [projects, sandbox, boardItems] = await Promise.all([
    getAllFrontmatter("projects", locale),
    getAllFrontmatter("sandbox", locale),
    getWorkBoardItems(locale),
  ]);

  return (
    <>
      {/* Hero — header lines reveal step by step, then the sub text and CTAs,
          with a card flying into the stack per step (see HeroHeadline).
          TODO(i18n): move copy to messages once finalized */}
      <section className="snap-section container-page flex min-h-[70vh] flex-col items-start pt-16 pb-24 text-left lg:pt-40">
        <HeroHeadline stack={HERO_STACK} />
      </section>
      {/* Marks the hero's bottom edge — GlobalNav reveals once this scrolls past
          the top of the viewport. */}
      <div id="hero-sentinel" aria-hidden />

      {/* Work — the whole region behind a view toggle: the current stacked read
          (case-study image stacks + Experiments strip) or the merged /work tile
          board with its filter side-tab. See HomeWorkSection. */}
      <HomeWorkSection
        projects={projects}
        sandbox={sandbox}
        boardItems={boardItems}
        labels={{
          caseStudy: t("caseStudy"),
          play: t("play"),
          details: t("details"),
          work: t("work"),
          all: t("all"),
          stackedView: t("stackedView"),
          tileView: t("tileView"),
          viewOptions: t("viewOptions"),
        }}
      />
    </>
  );
}
