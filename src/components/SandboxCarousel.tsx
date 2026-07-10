"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { LinkButton } from "./LinkButton";
import { CoverFlow, type CoverFlowItem } from "./CoverFlow";
import type { ContentItem } from "@/lib/mdx";

/**
 * Sandbox section — laid out like the Projects section: a section label, then a
 * 12-column grid with the ACTIVE entry's meta (title / tags / Details) in the
 * left column (col-span-3) and the Cover Flow filling the media column
 * (col-span-9, col-start-4), so the covers align to the same guides as the
 * project images above. The covers are large squares; drag / horizontal wheel /
 * arrow keys flip through them and the left meta cross-fades to the centred one.
 */
export function SandboxCarousel({
  items,
  heading,
  detailsLabel,
}: {
  items: ContentItem[];
  heading: string;
  detailsLabel: string;
}) {
  const router = useRouter();

  const covers: CoverFlowItem[] = items.map(
    ({ slug, frontmatter, images }) => ({
      id: slug,
      // Migrated thumbnails live on Firebase Storage; fall back to the first
      // extracted image so every cover has something to show.
      image: frontmatter.thumbnail || images[0] || "",
      title: frontmatter.title,
      subtitle: frontmatter.tags?.length
        ? frontmatter.tags.join("   ")
        : undefined,
    }),
  );

  // Start on the middle cover so the deck fans out symmetrically.
  const mid = Math.floor(covers.length / 2);
  const [active, setActive] = useState(mid);
  const current = covers[active];

  return (
    <section className="container-page py-16 scroll-mt-24">
      <h3 className="text-h3 mb-8">{heading}</h3>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8 lg:gap-x-16">
        {/* Left: the centred entry's meta — same hierarchy as a project. */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col items-start"
            >
              <h3 className="text-h2">{current?.title}</h3>
              {current?.subtitle ? (
                <p className="text-caption mt-2 text-fg-muted">
                  {current.subtitle}
                </p>
              ) : null}
              {current ? (
                <div className="mt-3">
                  <LinkButton href={`/project/play/${current.id}`} arrow="right">
                    {detailsLabel}
                  </LinkButton>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: the Cover Flow, filling the same media column as the project
            images. Height tracks the square cover so nothing is clipped. */}
        <div className="lg:col-span-9 lg:col-start-4">
          <div className="h-[min(560px,86vw)] w-full">
            <CoverFlow
              items={covers}
              itemWidth={500}
              itemHeight={500}
              centerGap={215}
              stackSpacing={44}
              initialIndex={mid}
              showCaption={false}
              enableHoverSlide
              onIndexChange={setActive}
              onItemClick={(item) => router.push(`/project/play/${item.id}`)}
              renderImage={(p) =>
                // Force eager loading: 3D-transformed covers can stop lazy
                // loading from ever firing, leaving side covers blank.
                p.priority ? (
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    priority
                    sizes={p.sizes}
                    draggable={p.draggable}
                    className={p.className}
                  />
                ) : (
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
    </section>
  );
}
