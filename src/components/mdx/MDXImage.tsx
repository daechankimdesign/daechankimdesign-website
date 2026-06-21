import { ProgressiveImage } from "../ProgressiveImage";

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
      <ProgressiveImage
        src={src}
        alt={alt}
        width={Number(width)}
        height={Number(height)}
        sizes="(max-width: 768px) 100vw, 800px"
        className="rounded-md"
      />
      {caption ? (
        <figcaption className="text-caption mt-2 text-fg-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
