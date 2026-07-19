import { ProgressiveImage } from "../ProgressiveImage";

type PhotoGridItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * A set of documentary/photographic images shown together as one editorial unit,
 * with a single shared caption. Think contact sheet or photo-essay, not product
 * shots: four curbside photos that read as one piece of evidence, or a pair of
 * process shots.
 *
 * Two columns on `sm+`, one on mobile. Four items wrap to a 2x2; two items make a
 * single row. Images that share an aspect ratio (the intended use) resolve to
 * equal heights for free, since each grid cell is the same width.
 *
 * IMAGE-FRAME RULE (see ProgressiveImage): content photos stay flat and
 * borderless. Unlike ImageFrame, this adds NO panel, NO rounded corners, NO
 * shadow. ImageFrame's tinted rounded cards are a license for UI screenshots
 * standing in for a product surface; real photographs get the plain frame.
 */
export function PhotoGrid({
  items = [],
  caption,
  columns = 2,
}: {
  items?: PhotoGridItem[];
  caption?: string;
  /** Columns on `sm+`. Defaults to 2. Static classes below satisfy Tailwind JIT. */
  columns?: 2 | 3;
}) {
  if (!items.length) return null;

  const colClass = columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <figure className="my-8">
      <div className={`grid grid-cols-1 gap-3 ${colClass}`}>
        {items.map((item) => (
          <ProgressiveImage
            key={item.src}
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ))}
      </div>
      {caption ? (
        <figcaption className="text-note mt-2 text-fg-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
