import { LABEL } from "./diagrams/styles";

/**
 * A participant's words, set apart from the body at heading size, with a
 * little room above and below. The source sits under it as a small label.
 */
export function PullQuote({ quote, by }: { quote: string; by?: string }) {
  return (
    <figure className="my-10 sm:my-12">
      <blockquote className="text-h1 measure font-medium text-fg">
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
      {by ? <figcaption className={`${LABEL} mt-3`}>{by}</figcaption> : null}
    </figure>
  );
}
