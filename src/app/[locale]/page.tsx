import { setRequestLocale } from "next-intl/server";
import { getWorkBoardItems } from "@/lib/mdx";
import { HeroHeadline, type HeroMedia } from "@/components/HeroHeadline";
import { WorkBoard } from "@/components/WorkBoard";

// Hero media. Every file lives on Firebase Storage (media/home/hero/, uploaded
// first, see docs/MEDIA-PIPELINE.md) and is served through /api/hero-media,
// which relays it from our own origin with a one-year cache (Storage sends
// max-age=0 and no CORS header, and the ID card's WebGL texture needs a readable
// image). sq160 / sq320 = the square crops the polaroids show (1x / 2x); `full`
// = the lightbox image. Originals live in media-src/home/hero/.
const m = (file: string) => `/api/hero-media/${file}`;
const HERO_MEDIA: HeroMedia = {
  photos: [
    {
      // The interview photo (landscape).
      sq160: m("research-sq160.jpg"),
      sq320: m("research-sq320.jpg"),
      src: m("research-sq320.jpg"),
      full: m("research.avif"),
      w: 1024,
      h: 777,
      label: "Interviewing people",
      headline:
        "“If I'm financially stable and settle in one place, I will definitely buy better furniture.”",
      caption:
        "Research begins with stakeholder interviews. What people say is rarely the whole problem, so I listen for what sits beneath it.",
    },
    {
      // With Josh Owen (President, Josh Owen LLC) at the show, the app on the screens (square).
      sq160: m("stack-5-sq160.jpg"),
      sq320: m("stack-5-sq320.jpg"),
      src: m("stack-5-sq320.jpg"),
      full: m("stack-5.jpg"),
      w: 850,
      h: 850,
      label: "Presenting hi-fi",
      headline: "With Josh Owen, President of Josh Owen LLC.",
      caption:
        "Working under Josh Owen, I learned to study how people behave and what they need, and to carry that attention from physical objects into interface design.",
    },
    {
      // The critique photo (landscape): sticky notes on the printed boards.
      sq160: m("critique-sq160.jpg"),
      sq320: m("critique-sq320.jpg"),
      src: m("critique-sq320.jpg"),
      full: m("critique.jpg"),
      w: 1089,
      h: 809,
      label: "Sketching ideas",
      headline: "Studio critique at Other Tomorrows.",
      caption:
        "Moving between screens, printed boards, and sticky-note sketches is the part of the work I enjoy most.",
    },
  ],
  // The ID card's photo (square): a parking lot in Providence, RI, summer 2026.
  // Also the lightbox's last slide, so its photo credit stays on the page.
  portrait: {
    sq320: m("impact-sq320.jpg"),
    sq480: m("impact-sq480.jpg"),
    src: m("impact-sq480.jpg"),
    full: m("impact-1400.avif"),
    w: 1400,
    h: 1400,
    headline: "Hi, nice to meet you.",
    caption:
      "A corner of a parking lot in Providence, Rhode Island, in the summer of 2026. Photograph by Tim, Other Tomorrows.",
  },
};

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
          while the wall builds beside them and the ID card drops in (see
          HeroHeadline). `relative`: the card's canvas spans this section.
          TODO(i18n): move copy to messages once finalized */}
      <section className="container-page relative flex min-h-[70vh] flex-col items-start pt-16 pb-24 text-left lg:pt-40">
        <HeroHeadline media={HERO_MEDIA} />
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
