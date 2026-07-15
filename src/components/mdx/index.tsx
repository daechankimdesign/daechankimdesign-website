import type { MDXComponents } from "next-mdx-remote-client/rsc";
import { VideoPlayer } from "./VideoPlayer";
import { MDXImage } from "./MDXImage";
import { ImageFrame } from "./ImageFrame";
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
  hr: () => <RevealBlock as="hr" className="hairline-b my-12 border-0" />,
};
