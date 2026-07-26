"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Shield, Clock, ShieldCheck } from "iconoir-react";
import { EASE_OUT, DURATION } from "@/lib/motion";

type TierLevel = 1 | 2 | 3;

type TierItem = {
  level: TierLevel;
  name: string;
  note: string;
};

/**
 * The VendorPass compliance tiers as a color-and-icon panel — no screenshot.
 *
 * It borrows ImageFrame's framing (a flat `bg-surface-subtle` panel, rounded
 * cards, a caption, a staggered scroll-in) but each card is a tier, not a photo.
 * Colors and icons reference the live product's own legend: a gray OUTLINE shield
 * for Unverified, a gray pending clock for Self-Verified (as the modal shows it,
 * not the vendor-card amber; tiers 1 and 2 share the gray, the icon carries it), and a SOLID
 * saturated-blue badge with a white check for Verified — the "the verified thing
 * is literally bolder" idea carried by weight, not a caption. Tints and borders
 * are `color-mix`ed against the canvas/hairline tokens, so the panel holds up in
 * both light and dark. (Blues nudged brighter than the product's #003D9B so the
 * icon still reads on a dark canvas.)
 */
const TIERS: Record<
  TierLevel,
  { accent: string; Icon: typeof Shield; solid: boolean }
> = {
  1: { accent: "#6b7280", Icon: Shield, solid: false },
  2: { accent: "#6b7280", Icon: Clock, solid: false },
  3: { accent: "#2563eb", Icon: ShieldCheck, solid: true },
};

// Beat between cards — a quiet "and then", shorter than ImageFrame's photo cadence.
const BEAT = 0.12;
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

export function TrustTiers({
  items = [],
  caption,
}: {
  items?: TierItem[];
  caption?: string;
}) {
  const reduce = useReducedMotion();
  if (!items.length) return null;

  const cardClass =
    "flex flex-1 flex-col gap-3 rounded-xl border p-5 sm:p-6";

  return (
    <figure className="my-8">
      <div className="flex flex-col gap-4 bg-surface-subtle p-6 sm:flex-row sm:gap-6 sm:p-8">
        {items.map((item, i) => {
          const { accent, Icon, solid } = TIERS[item.level];
          const cardStyle = {
            background: `color-mix(in srgb, ${accent} ${solid ? 12 : 7}%, var(--color-canvas))`,
            borderColor: `color-mix(in srgb, ${accent} ${solid ? 45 : 22}%, var(--color-hairline))`,
          } as CSSProperties;
          const chipStyle: CSSProperties = solid
            ? { background: accent, color: "#fff" }
            : {
                background: `color-mix(in srgb, ${accent} 14%, var(--color-canvas))`,
                color: accent,
              };

          const inner = (
            <>
              <span
                className="grid h-10 w-10 place-items-center rounded-lg"
                style={chipStyle}
                aria-hidden
              >
                <Icon width={20} height={20} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span
                  className="text-note font-medium uppercase tracking-[0.08em]"
                  style={{ color: accent }}
                >
                  Tier {item.level}
                </span>
                <span className="text-body font-medium text-fg">{item.name}</span>
              </span>
              <span className="text-note text-fg-muted">{item.note}</span>
            </>
          );

          if (reduce) {
            return (
              <div key={item.level} className={cardClass} style={cardStyle}>
                {inner}
              </div>
            );
          }
          return (
            <motion.div
              key={item.level}
              className={cardClass}
              style={cardStyle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: DURATION, ease: EASE_OUT, delay: i * BEAT }}
            >
              {inner}
            </motion.div>
          );
        })}
      </div>
      {caption ? (
        <figcaption className="text-note mt-2 text-fg-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
