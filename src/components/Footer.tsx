import { getTranslations } from "next-intl/server";
import { SequenceReveal, SequenceItem } from "./SequenceReveal";

export async function Footer() {
  const t = await getTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="surface-invert hairline-t reveal-footer">
      {/* Reveal footer: a STATIONARY layer fixed to the viewport bottom (z-0),
          behind the opaque page card (z-10). The card carries a margin-bottom of
          the footer's height (--footer-reveal-h, set by <FooterReveal>), so it
          slides up over exactly that scroll to uncover the footer. The headline +
          lede fade up one line at a time, but only once the footer is ~fully
          uncovered (trigger="bottom"), replaying on each return. Contact / resume
          + copyright are static (outside the sequence). */}
      <SequenceReveal total={5} trigger="bottom" className="container-page pt-32 pb-12">
        {/* Hero statement — copied from the home hero (HeroHeadline). Keep in sync
            with page.tsx HERO_ROTATIONS / lede if that copy changes. */}
        <h2 className="text-display">
          <SequenceItem order={0} as="span" className="block">
            Daechan Kim, a designer,
          </SequenceItem>
          <SequenceItem order={1} as="span" className="block">
            conducts research to find insights,
          </SequenceItem>
          <SequenceItem order={2} as="span" className="block">
            creates comprehensive designs,
          </SequenceItem>
          <SequenceItem order={3} as="span" className="block">
            tests prototypes and deploys products.
          </SequenceItem>
        </h2>
        <SequenceItem
          order={4}
          as="p"
          className="text-sub-display measure-lede mt-8 text-fg-muted"
        >
          3+ years across a B2B2C startup and global client work, creating
          comprehensive designs and building impactful products validated by
          users, with the latest AI tools for prototyping and deployment.
        </SequenceItem>

        {/* Contact / resume + copyright — STATIC (visible from first paint, not
            part of the animated sequence). */}
        <div className="mt-6 flex gap-4">
          <a
            href="mailto:daechankim.design@gmail.com"
            className="text-body text-fg-muted no-underline transition-colors hover:text-fg"
          >
            {t("contact")}
          </a>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-body text-fg-muted no-underline transition-colors hover:text-fg"
          >
            {t("resume")}
          </a>
        </div>
        <p className="text-caption mt-4 text-fg-muted">
          © {year} Daechan Kim. All rights reserved.
        </p>
      </SequenceReveal>
    </footer>
  );
}
