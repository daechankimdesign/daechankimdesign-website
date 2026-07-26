import type { MDXComponents } from "next-mdx-remote-client/rsc";
import { VideoPlayer } from "./VideoPlayer";
import { MDXImage } from "./MDXImage";
import { ImageFrame } from "./ImageFrame";
import { TrustTiers } from "./TrustTiers";
import { ScrollImage } from "./ScrollImage";
import { PhotoGrid } from "./PhotoGrid";
import { MacbookFrame } from "./MacbookFrame";
import { QuoteCarousel } from "./QuoteCarousel";
import { Highlighter } from "./Highlighter";
import { ProjectMeta } from "./ProjectMeta";
import { Gallery } from "./Gallery";
import { ExperienceItem } from "./ExperienceItem";
import { AwardItem } from "./AwardItem";
import { ContactGrid, ContactItem } from "./Contact";
import { RevealBlock } from "./RevealBlock";

// Passed explicitly on every RSC evaluate() call (MDXProvider is effectless in
// the App Router). Custom tags used in MDX must exist here or rendering throws.
//
// Block-level elements are wrapped in RevealBlock so long-form content fades up
// as it scrolls into view — the hero's entrance motion, continued through the
// body. Inline elements (a, li) stay plain; li rides along inside its list.
export const mdxComponents: MDXComponents = {
  VideoPlayer: (props) => (
    <RevealBlock as="div">
      <VideoPlayer {...props} />
    </RevealBlock>
  ),
  MDXImage: (props) => (
    <RevealBlock as="div">
      <MDXImage {...props} />
    </RevealBlock>
  ),
  // NOT wrapped in RevealBlock: ImageFrame runs its own scroll-triggered
  // choreography, and RevealBlock's y-rise would compound with each card's
  // entrance direction — turning a "slide right" into a diagonal. The panel is
  // the stage and stays put; the cards animate into it.
  ImageFrame: (props) => <ImageFrame {...props} />,
  // NOT wrapped in RevealBlock (like ImageFrame): runs its own staggered card
  // reveal, so a RevealBlock y-rise would compound with each card's entrance.
  TrustTiers: (props) => <TrustTiers {...props} />,
  // NOT wrapped in RevealBlock: ScrollImage owns its own scroll-linked pan, and a
  // transformed ancestor (RevealBlock) would offset the useScroll measurement.
  ScrollImage: (props) => <ScrollImage {...props} />,
  // NOT wrapped in RevealBlock: QuoteCarousel pins with position: sticky, and a
  // transformed ancestor (which RevealBlock is) breaks sticky's viewport anchor.
  QuoteCarousel: (props) => <QuoteCarousel {...props} />,
  // Wrapped like MDXImage: PhotoGrid is static, so it takes the standard block
  // fade-up. Flat, borderless documentary photos as one editorial unit.
  PhotoGrid: (props) => (
    <RevealBlock as="div">
      <PhotoGrid {...props} />
    </RevealBlock>
  ),
  // Wrapped, unlike ImageFrame: the MacBook frame is static (no motion of its
  // own), so it takes the same quiet block fade-up every other image gets rather
  // than popping in while the surrounding prose fades.
  MacbookFrame: (props) => (
    <RevealBlock as="div">
      <MacbookFrame {...props} />
    </RevealBlock>
  ),
  ProjectMeta: (props) => (
    <RevealBlock as="div">
      <ProjectMeta {...props} />
    </RevealBlock>
  ),
  Gallery: (props) => (
    <RevealBlock as="div">
      <Gallery {...props} />
    </RevealBlock>
  ),
  ExperienceItem: (props) => (
    <RevealBlock as="div">
      <ExperienceItem {...props} />
    </RevealBlock>
  ),
  AwardItem: (props) => (
    <RevealBlock as="div">
      <AwardItem {...props} />
    </RevealBlock>
  ),
  // The grid reveals as one block; the items inside are plain flex children.
  ContactGrid: (props) => (
    <RevealBlock as="div">
      <ContactGrid {...props} />
    </RevealBlock>
  ),
  ContactItem: (props) => <ContactItem {...props} />,
  img: (props) => (
    <RevealBlock as="div">
      <MDXImage src={String(props.src ?? "")} alt={props.alt ?? ""} />
    </RevealBlock>
  ),
  h1: (props) => <RevealBlock as="h1" className="text-h1 mt-12 mb-4" {...props} />,
  h2: (props) => <RevealBlock as="h2" className="text-h2 mt-10 mb-3" {...props} />,
  h3: (props) => <RevealBlock as="h3" className="text-h3 mt-8 mb-2" {...props} />,
  // Section dek — a quiet one-line summary that sits just under an h2, briefing
  // the section. Muted and body-sized so it reads as a subtitle, not a heading.
  Dek: (props) => (
    <RevealBlock
      as="p"
      className="text-body text-fg-muted measure-lede mt-0 mb-6"
      {...props}
    />
  ),
  p: (props) => <RevealBlock as="p" className="text-body my-4 measure" {...props} />,
  ul: (props) => (
    <RevealBlock as="ul" className="text-body my-4 list-dash" {...props} />
  ),
  ol: (props) => (
    <RevealBlock as="ol" className="text-body my-4 list-decimal pl-6" {...props} />
  ),
  li: (props) => <li className="my-1" {...props} />,
  blockquote: (props) => (
    <RevealBlock
      as="blockquote"
      className="hairline-l text-body my-6 pl-6 text-fg-muted"
      {...props}
    />
  ),
  a: (props) => <a className="link" {...props} />,
  // Explicit inline highlighter, if ever wanted in place of **…** for one phrase.
  Highlighter: (props) => <Highlighter {...props} />,
  hr: () => <RevealBlock as="hr" className="hairline-b my-12 border-0" />,
};

/**
 * Component set for long-form WORK documents (case studies). Identical to the
 * base, except every **bold** (`strong`) renders with the scroll-triggered
 * highlighter behind it — the same mark as the work-tile hover. Non-work pages
 * (About) keep `mdxComponents`, so a bold NAME in the endorsement stays a plain
 * <strong> and isn't marked.
 */
export const workMdxComponents: MDXComponents = {
  ...mdxComponents,
  strong: ({ children }) => <Highlighter>{children}</Highlighter>,
};
