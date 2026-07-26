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
      "“If I'm financially stable and settle in one place, I will definitely buy better furniture.”",
    caption:
      "Research begins with stakeholder interviews. What people say is rarely the whole problem, so I listen for what sits beneath it.",
  },
  {
    // With Josh Owen (President, Josh Owen LLC) — the industrial-design mentorship (square).
    src: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fstack-5-480.jpg?alt=media",
    full: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fstack-5.jpg?alt=media",
    w: 480,
    h: 480,
    headline: "With Josh Owen, President of Josh Owen LLC.",
    caption:
      "Working under Josh Owen, I learned to study how people behave and what they need, and to carry that attention from physical objects into interface design.",
  },
  {
    // The critique photo (landscape) — reviewing the work pinned to the wall.
    src: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fcritique-480.jpg?alt=media",
    full: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fcritique.jpg?alt=media",
    w: 480,
    h: 356,
    headline: "Studio critique at Other Tomorrows.",
    caption:
      "Moving between screens, printed boards, and sticky-note sketches is the part of the work I enjoy most.",
  },
  {
    // The lede — portrait, a parking lot in Providence, RI, summer 2026 (square).
    src: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fimpact-480.jpg?alt=media",
    full: "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2Fimpact.jpeg?alt=media",
    w: 480,
    h: 480,
    headline: "Hi, nice to meet you.",
    caption:
      "A corner of a parking lot in Providence, Rhode Island, in the summer of 2026. Photograph by Tim, Other Tomorrows.",
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
      <section className="container-page flex min-h-[70vh] flex-col items-start pt-16 pb-24 text-left lg:pt-40">
        <HeroHeadline stack={HERO_STACK} />
      </section>
      {/* Marks the hero's bottom edge — GlobalNav reveals once this scrolls past
          the top of the viewport. */}
      <div id="hero-sentinel" aria-hidden />

      {/* Work — the merged project + experiment grid (the same board as /project),
          shown WITHOUT its own "Work" heading since this is the home index.
          `scroll-mt-20` (5rem) keeps the "View all" /#work anchor jump cleared past
          the fixed nav now that scroll-snap is off. */}
      <section id="work" className="container-page scroll-mt-20 pb-16">
        <WorkBoard items={boardItems} showHeading={false} />
      </section>
    </>
  );
}
