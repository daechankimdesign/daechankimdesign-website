import { ProgressiveImage } from "../ProgressiveImage";
import { ClickZoom } from "../ClickZoom";

type MDXImageProps = {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  caption?: string;
};

export function MDXImage({
  src,
  alt = "",
  width = 1600,
  height = 900,
  caption,
}: MDXImageProps) {
  return (
    <figure className="my-8">
      <ClickZoom>
        <ProgressiveImage
          src={src}
          alt={alt}
          width={Number(width)}
          height={Number(height)}
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </ClickZoom>
      {caption ? (
        <figcaption className="text-note mt-2 text-fg-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
