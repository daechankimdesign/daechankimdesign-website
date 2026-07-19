import { ProgressiveImage } from "../ProgressiveImage";
import { ClickZoom } from "../ClickZoom";

type GalleryImage = { src: string; alt?: string };

/**
 * Responsive image grid for MDX (e.g. the About page). Square crops in a
 * 2-up / 3-up grid; each image crossfades in via ProgressiveImage.
 */
export function Gallery({ images = [] }: { images?: GalleryImage[] }) {
  if (!images.length) return null;
  return (
    <div className="my-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((img, i) => (
        <ClickZoom key={`${img.src}-${i}`}>
          <ProgressiveImage
            src={img.src}
            alt={img.alt ?? ""}
            width={800}
            height={800}
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        </ClickZoom>
      ))}
    </div>
  );
}
