import { LABEL } from "./diagrams/styles";

/**
 * A participant's words, set as the loudest thing in its section: larger than
 * the page's display type, across the full column, with room above and below
 * so it reads as a statement and not a line of body copy. The source sits
 * under it as a small label.
 */
export function PullQuote({ quote, by }: { quote: string; by?: string }) {
  return (
    <figure className="my-16 sm:my-24">
      <blockquote
        className="font-medium tracking-[-0.035em] text-fg"
        style={{ fontSize: "clamp(32px, 22px + 2.6vw, 56px)", lineHeight: 1.12 }}
      >
        {/* The opening mark hangs in the margin from sm up, so the words align
            with the column. */}
        <span aria-hidden className="text-fg-muted sm:-ml-[0.45em]">
          &ldquo;
        </span>
        {quote}
        <span aria-hidden className="text-fg-muted">
          &rdquo;
        </span>
      </blockquote>
      {by ? <figcaption className={`${LABEL} mt-6`}>{by}</figcaption> : null}
    </figure>
  );
}
