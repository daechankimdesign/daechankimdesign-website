import { SequenceReveal, SequenceItem } from "./SequenceReveal";
import { LinkButton } from "./LinkButton";
import { LoveLetterButton, LoveLetterPortrait } from "./LoveLetter";
import { LiveClock } from "./LiveClock";

export function Footer() {
  // "Last Updated" = the static build/deploy date, in Eastern time (these pages are
  // statically rendered, so new Date() is the build moment). Redeploying after a
  // code change refreshes it. Format: "July 12, 2026".
  const lastUpdated = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <footer className="surface-invert hairline-t reveal-footer">
      {/* Reveal footer: a STATIONARY layer fixed to the viewport bottom (z-0),
          behind the opaque page card (z-10). The card carries a margin-bottom of
          the footer's height (--footer-reveal-h, set by <FooterReveal>), so it
          slides up over exactly that scroll to uncover the footer. The headline +
          lede fade up one line at a time, but only once the footer is ~fully
          uncovered (trigger="bottom"), replaying on each return. The last-updated
          line is static (outside the sequence). */}
      <div className="container-page relative flex flex-col-reverse gap-12 pt-20 pb-20 lg:flex-row lg:items-start lg:justify-between lg:gap-16 lg:pt-48">
        <SequenceReveal total={5} step={300} trigger="bottom" className="flex-1 mb-5">
        {/* Statement — footer copy (independent of the home hero, which has
            diverged to its own headline). */}
        <h2 className="text-display">
          <SequenceItem order={0} as="span" className="block">
            Daechan Kim is a designer capable of
          </SequenceItem>
          <SequenceItem order={1} as="span" className="block">
            conducting user research,
          </SequenceItem>
          <SequenceItem order={2} as="span" className="block">
            creating impactful visuals, and
          </SequenceItem>
          <SequenceItem order={3} as="span" className="block">
            creating AI-powered products.
          </SequenceItem>
        </h2>
        <SequenceItem
          order={4}
          as="p"
          className="text-sub-display measure-lede mt-10 text-fg-muted"
        >
          3+ years across a B2B2C startup and global client work, I design,
          build, and ship products with the latest AI tools, bridging technology
          and people through design.
        </SequenceItem>
        {/* CTA buttons — reveal in sync with the lede (same order) as the final
            step of the sequence. */}
        <SequenceItem
          order={4}
          as="div"
          className="mt-5 flex flex-wrap items-center gap-6"
        >
          <LinkButton href="/about" arrow="right">
            About
          </LinkButton>
          <LoveLetterButton arrow="right" />
        </SequenceItem>
        </SequenceReveal>
        <LoveLetterPortrait className="size-[clamp(120px,_60px_+_15vw,_240px)] shrink-0 self-start" />
      </div>
      {/* Bottom credit line, centered at the VERY bottom of the footer (below the
          docked universal nav pill): the live "Today …" clock in the visitor's own
          (auto-detected) timezone, a divider, then the static "Last Updated …"
          build date (kept in Eastern — it marks when the site was deployed). */}
      <p className="container-page pb-4 text-center text-note text-fg-muted">
        <LiveClock />
        Last Updated {lastUpdated}
      </p>
    </footer>
  );
}
