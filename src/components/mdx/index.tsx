import type { MDXComponents } from "next-mdx-remote-client/rsc";
import { VideoPlayer } from "./VideoPlayer";
import { MDXImage } from "./MDXImage";
import { ProjectMeta } from "./ProjectMeta";
import { Gallery } from "./Gallery";

// Passed explicitly on every RSC evaluate() call (MDXProvider is effectless in
// the App Router). Custom tags used in MDX must exist here or rendering throws.
export const mdxComponents: MDXComponents = {
  VideoPlayer,
  MDXImage,
  ProjectMeta,
  Gallery,
  img: (props) => (
    <MDXImage src={String(props.src ?? "")} alt={props.alt ?? ""} />
  ),
  h1: (props) => <h1 className="text-h1 mt-12 mb-4" {...props} />,
  h2: (props) => <h2 className="text-h2 mt-10 mb-3" {...props} />,
  h3: (props) => <h3 className="text-h3 mt-8 mb-2" {...props} />,
  p: (props) => <p className="text-body my-4 max-w-[70ch]" {...props} />,
  ul: (props) => <ul className="text-body my-4 list-disc pl-6" {...props} />,
  ol: (props) => <ol className="text-body my-4 list-decimal pl-6" {...props} />,
  li: (props) => <li className="my-1" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="hairline-l text-body my-6 pl-6 text-fg-muted"
      {...props}
    />
  ),
  a: (props) => <a className="link" {...props} />,
  hr: () => <hr className="hairline-b my-12 border-0" />,
};
