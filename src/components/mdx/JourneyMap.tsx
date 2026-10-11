import { ScrollImage } from "./ScrollImage";

type Part = { title: string; note: string; color: string };

/**
 * A wide journey map with its overview: the map pans left to right as the page
 * scrolls down (ScrollImage, the same pan as the furniture blueprint), and the
 * phases follow as a row, each keyed to the map by its colour. Nothing is
 * emphasised; the row is a legend, read in order.
 */
export function JourneyMap({
  parts = [],
  ...image
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  zoom?: number;
  compactZoom?: number;
  /** The map's own sheet colour, kept in both site themes. */
  background?: string;
  parts?: Part[];
}) {
  return (
    <div className="my-8">
      <ScrollImage {...image} />
      {parts.length ? (
        <ol className="mt-6 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4">
          {parts.map((p, k) => (
            <li key={p.title}>
              <span aria-hidden className="block h-1 w-full rounded-full" style={{ background: p.color }} />
              <p className="text-note mt-3 font-medium text-fg">
                <span className="text-fg-muted">{String(k + 1).padStart(2, "0")}</span> {p.title}
              </p>
              <p className="text-note mt-1 leading-relaxed text-fg-muted">{p.note}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
