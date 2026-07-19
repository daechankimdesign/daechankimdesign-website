import { MacbookMockUp } from "../MacbookMockUp";

/**
 * A screenshot presented on a MacBook, sitting on the site's standard tinted
 * panel — the device counterpart to ImageFrame. STATIC by design: no entrance
 * choreography of its own (it rides the same block-level fade-up every MDX block
 * gets via RevealBlock, nothing more), so it reads as a quiet hero still.
 *
 * The panel is the flat, square-cornered #F5F5F5 surface used across the site
 * (bg-surface-subtle); the rounded corners belong to the laptop on it, not to
 * the panel — consistent with the IMAGE-FRAME RULE.
 */
export function MacbookFrame({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-8">
      <div className="flex justify-center bg-surface-subtle p-6 sm:p-10">
        <MacbookMockUp src={src} alt={alt} />
      </div>
      {caption ? (
        <figcaption className="text-note mt-2 text-fg-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
