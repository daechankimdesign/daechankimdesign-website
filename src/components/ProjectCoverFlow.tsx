"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Link, useRouter } from "@/i18n/navigation";
import { LinkButton } from "./LinkButton";
import { ProgressiveImage } from "./ProgressiveImage";
import { CoverFlow, type CoverFlowItem } from "./CoverFlow";
import type { ContentItem } from "@/lib/mdx";

interface Props {
  slug: string;
  frontmatter: ContentItem["frontmatter"];
  images: string[];
  detailsLabel: string;
}

const isVideo = (src: string) => /\.mp4($|\?)/i.test(src);

// Vertical scroll distance (in svh) that advances the deck by one image while the
// project is pinned. Larger = you scroll further per image (calmer); smaller =
// images flip faster. Tune to taste.
const SCROLL_PER_IMAGE = 70;

function ProjectMeta({
  slug,
  frontmatter,
  detailsLabel,
}: Omit<Props, "images">) {
  return (
    <div className="flex flex-col items-start">
      <h3 className="text-h2">{frontmatter.title}</h3>
      {frontmatter.tags && frontmatter.tags.length > 0 ? (
        <p className="text-caption mt-2 text-fg-muted">
          {frontmatter.tags.join("   ")}
        </p>
      ) : null}
      <div className="mt-3">
        <LinkButton href={`/project/${slug}`} arrow="right">
          {detailsLabel}
        </LinkButton>
      </div>
    </div>
  );
}

/**
 * Scroll-driven vertical cover flow for ONE project (Model B). The project is
 * PINNED to the viewport for a tall scroll region; as the page scrolls, that
 * progress drives the deck through the project's images — so it's one continuous
 * page-scroll motion (no separate, hover-captured scroll). When the last image
 * centres the pin releases and the page flows on to the next project. Clicking
 * the centred card opens the case study.
 */
function PinnedProjectDeck({
  slug,
  frontmatter,
  images,
  detailsLabel,
}: Props) {
  const router = useRouter();
  const pinRef = useRef<HTMLDivElement>(null);
  const last = Math.max(images.length - 1, 0);

  // Card height tracks the VIEWPORT height (responsive) rather than a fixed px.
  // CoverFlow needs a numeric px height for its 3D math, so we measure
  // innerHeight — this deck is desktop-only (capable gate), so it's stable with
  // no mobile URL-bar dynamics — and recompute on resize. itemWidth stays fixed
  // so height follows the viewport while width still responds to the column via
  // CoverFlow's own width-scaling.
  const [viewportH, setViewportH] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 900,
  );
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const cardHeight = Math.round(viewportH * 0.7);

  // Progress across the pinned region, snapped to WHOLE images: round the
  // continuous scroll position to the nearest integer, then spring toward it. At
  // rest the target is a constant integer, so the spring settles on an EXACT
  // integer and exactly one card faces straight (0° tilt) — in every browser.
  // During scroll the spring chases each new integer, which reads as the deck
  // flipping through images. Per-image snapping lives here in JS (not CSS
  // scroll-snap), so it adds no page-scroll snap points and can't strand the
  // footer or trap the inter-section gaps.
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ["start start", "end end"],
  });
  const target = useTransform(scrollYProgress, (v) =>
    Math.min(Math.max(Math.round(v * last), 0), last),
  );
  const pos = useSpring(target, {
    stiffness: 260,
    damping: 34,
    mass: 1,
    restDelta: 0.001,
  });

  const covers: CoverFlowItem[] = images.map((src, i) => ({
    id: `${slug}-${i}`,
    image: src,
    title: frontmatter.title,
  }));

  return (
    <article className="snap-section hairline-b col-span-1 lg:col-span-12">
      <div
        ref={pinRef}
        style={{ height: `${100 + last * SCROLL_PER_IMAGE}svh` }}
      >
        <div className="sticky top-0 h-svh">
          <div className="grid h-full w-full grid-cols-1 gap-x-8 lg:grid-cols-12 lg:gap-x-16">
            {/* Meta pinned to the TOP-LEFT, just below the sticky "Projects"
                heading (which sits at top-24). The deck stays vertically centred. */}
            <div className="pt-32 lg:col-span-3 lg:col-start-1">
              <ProjectMeta
                slug={slug}
                frontmatter={frontmatter}
                detailsLabel={detailsLabel}
              />
            </div>
            <div className="flex h-full items-center lg:col-span-9 lg:col-start-4">
              <div className="h-[80svh] w-full">
                <CoverFlow
                  items={covers}
                  orientation="vertical"
                  positionValue={pos}
                  itemWidth={760}
                  itemHeight={cardHeight}
                  centerGap={150}
                  stackSpacing={26}
                  rotation={38}
                  showCaption={false}
                  onItemClick={() => router.push(`/project/${slug}`)}
                  renderImage={(p) =>
                    isVideo(p.src) ? (
                      <video
                        src={p.src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        aria-label={p.alt}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      // Eager: 3D-transformed covers can stop lazy loading from
                      // ever firing, leaving side covers blank.
                      <Image
                        src={p.src}
                        alt={p.alt}
                        fill
                        loading="eager"
                        sizes={p.sizes}
                        draggable={p.draggable}
                        className={p.className}
                      />
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Plain vertical image stack — the fallback for touch / coarse pointer (a pinned
 * scroll deck fights native scrolling on phones) and reduced-motion. Scrolls
 * naturally with the page, which is already the desired "one continuous scroll".
 */
function FallbackStack({ slug, frontmatter, images, detailsLabel }: Props) {
  return (
    <article className="snap-section relative pb-16 mb-16 hairline-b col-span-1 lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-6 lg:gap-x-16">
      <div className="hidden lg:col-span-3 lg:col-start-1 lg:block">
        <div className="flex flex-col items-start lg:sticky lg:top-[136px]">
          <ProjectMeta
            slug={slug}
            frontmatter={frontmatter}
            detailsLabel={detailsLabel}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-9 lg:col-start-4">
        <div className="lg:hidden">
          <ProjectMeta
            slug={slug}
            frontmatter={frontmatter}
            detailsLabel={detailsLabel}
          />
        </div>

        {images.map((src, i) => (
          <Link
            key={src}
            href={`/project/${slug}`}
            className="edge-fade block no-underline overflow-hidden rounded-md border border-hairline"
          >
            {isVideo(src) ? (
              <video
                src={src}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-label={`${frontmatter.title} preview ${i + 1}`}
                className="w-full object-cover aspect-[16/9] rounded-md bg-surface-subtle"
              />
            ) : (
              <ProgressiveImage
                src={src}
                alt={`${frontmatter.title} preview ${i + 1}`}
                width={1600}
                height={900}
                sizes="(max-width: 1024px) 100vw, 1680px"
                className="w-full object-cover aspect-[16/9] rounded-md"
              />
            )}
          </Link>
        ))}
      </div>
    </article>
  );
}

export function ProjectCoverFlow(props: Props) {
  const reduce = useReducedMotion();
  // SSR renders the fallback stack; a desktop fine-pointer client upgrades to the
  // scroll-driven pinned deck after mount (initial false → no hydration mismatch).
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const apply = () => setCapable(mq.matches && !reduce);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, [reduce]);

  return capable && props.images.length > 0 ? (
    <PinnedProjectDeck {...props} />
  ) : (
    <FallbackStack {...props} />
  );
}
