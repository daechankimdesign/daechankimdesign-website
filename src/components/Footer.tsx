import { getTranslations } from "next-intl/server";
import { SequenceReveal, SequenceItem } from "./SequenceReveal";
import { LinkButton } from "./LinkButton";

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
      <SequenceReveal total={6} trigger="bottom" className="container-page pt-48 pb-20">
        {/* Statement — footer copy (independent of the home hero, which has
            diverged to its own headline). */}
        <h2 className="text-display">
          <SequenceItem order={0} as="span" className="block">
            Daechan Kim is a designer capable of
          </SequenceItem>
          <SequenceItem order={1} as="span" className="block">
            conducting research to find insights,
          </SequenceItem>
          <SequenceItem order={2} as="span" className="block">
            creating comprehensive designs,
          </SequenceItem>
          <SequenceItem order={3} as="span" className="block">
            testing prototypes and deploys products.
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
        {/* CTA buttons — reveal as the final step of the sequence. */}
        <SequenceItem
          order={5}
          as="div"
          className="mt-10 flex flex-wrap items-center gap-6"
        >
          <LinkButton href="/about" arrow="right">
            About
          </LinkButton>
          {/* TODO: point at the real "Love letter to design" destination. */}
          <LinkButton href="#" external arrow="up-right">
            Love letter to design
          </LinkButton>
        </SequenceItem>

        {/* Contact / resume + copyright — STATIC (visible from first paint, not
            part of the animated sequence). */}
        <div className="mt-14 flex gap-4">
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
