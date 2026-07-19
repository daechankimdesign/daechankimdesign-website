import { setRequestLocale } from "next-intl/server";
import { getWorkBoardItems } from "@/lib/mdx";
import { HeroHeadline } from "@/components/HeroHeadline";
import { WorkBoard } from "@/components/WorkBoard";

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
  const boardItems = await getWorkBoardItems(locale);

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

      {/* Work — the merged project + experiment grid (the same board as /project),
          shown WITHOUT its own "Work" heading since this is the home index.
          `snap-section` makes it a scroll-snap target so the "View all" button's
          /#work jump LANDS on the grid (near the top, cleared past the nav by the
          .snap-section 5rem scroll-margin) instead of the hero — the only other
          snap point — pulling it back. */}
      <section id="work" className="snap-section container-page pb-16">
        <WorkBoard items={boardItems} showHeading={false} />
      </section>
    </>
  );
}
