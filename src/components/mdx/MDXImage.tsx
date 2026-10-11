import { ProgressiveImage } from "../ProgressiveImage";
import { ClickZoom } from "../ClickZoom";

type MDXImageProps = {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  caption?: string;
  /** A panel colour to set the image on, with padding around it. Use the
   *  image's OWN background (e.g. "#ffffff" for a white research board) so the
   *  panel reads as more of the same sheet, in both themes. Omit for none. */
  background?: string;
  /** With `background`: no bottom padding, so an image that ends at its own
   *  bottom edge (a hand mockup cut off at the wrist) sits on the panel edge. */
  flushBottom?: boolean;
};

export function MDXImage({
  src,
  alt = "",
  width = 1600,
  height = 900,
  caption,
  background,
  flushBottom = false,
}: MDXImageProps) {
  const image = (
    <ProgressiveImage
      src={src}
      alt={alt}
      width={Number(width)}
      height={Number(height)}
      sizes="(max-width: 768px) 100vw, 800px"
    />
  );
  return (
    <figure className="my-8">
      <ClickZoom>
        {background ? (
          <div className={flushBottom ? "px-5 pt-5 sm:px-10 sm:pt-10" : "p-5 sm:p-10"} style={{ background }}>
            {image}
          </div>
        ) : (
          image
        )}
      </ClickZoom>
      {caption ? (
        <figcaption className="text-note mt-2 text-fg-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
