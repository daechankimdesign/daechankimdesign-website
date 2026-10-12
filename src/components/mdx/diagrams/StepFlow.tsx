import { Fragment, type CSSProperties } from "react";
import { DiagramFrame } from "./DiagramFrame";
import { LABEL } from "./styles";

type Step = {
  title: string;
  note?: string;
  /** A small colour dot before the title, to tie a step to a legend elsewhere
   *  (e.g. the colours of a user-journey board). */
  color?: string;
  /** Emphasise this step with the highlighter colour once the flow has built. */
  mark?: boolean;
  /** A red flag rises and waves beside the title once the step is marked. */
  flag?: boolean;
  /** A step where nothing can be seen: dashed edge and a crossed-out eye. */
  blind?: boolean;
};

type Row = {
  /** Small uppercase name over the row, e.g. "The usual way". */
  label?: string;
  steps: Step[];
  /** A line under the row for a flow that repeats, e.g. "Repeats every month". */
  loop?: string;
};

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * A process as boxes and arrows: one row (`steps`) or several labelled rows
 * (`rows`) to set two ways of doing the same thing side by side. Left to right
 * from sm up, top to bottom on phones. On scroll-in the boxes rise in one after
 * another, each arrow drawing before the next box, and any `mark`ed step takes
 * the highlighter colour last.
 *
 * `compare` sets the rows side by side as vertical columns with a dividing
 * line between them, at every width, so two ways of doing the same thing can
 * be read across. The lists fill their columns and the boxes share the height,
 * so both flows end on the same line however many steps each has.
 *
 * `connector="none"` drops the arrows for a set of parallel items rather than a
 * sequence (e.g. what each side of a product needs).
 */
export function StepFlow({
  steps,
  rows,
  connector = "arrow",
  compare = false,
}: {
  steps?: Step[];
  rows?: Row[];
  connector?: "arrow" | "none";
  /** Rows side by side as vertical columns, divided by a line. */
  compare?: boolean;
}) {
  const all: Row[] = rows ?? (steps ? [{ steps }] : []);
  if (!all.length) return null;

  // One running index across the whole figure, so rows build in reading order;
  // marks land after everything else.
  const parts = all.map((r) => r.steps.length * 2 + (r.label ? 1 : 0) + (r.loop ? 1 : 0));
  const starts = parts.map((_, r) => parts.slice(0, r).reduce((n, p) => n + p, 0));
  const total = parts.reduce((n, p) => n + p, 0);
  const longest = Math.max(...parts);
  const markAt = (compare ? longest : total) + 1;

  return (
    <DiagramFrame>
      <div
        className={compare ? "grid gap-0" : "flex flex-col gap-8"}
        style={compare ? { gridTemplateColumns: `repeat(${all.length}, minmax(0, 1fr))` } : undefined}
      >
        {all.map((row, r) => {
          // Each row counts its parts on from the rows before it; side by
          // side, the columns build at the same time, each from zero.
          let i = compare ? 0 : starts[r];
          const dense = row.steps.length >= 5;
          const box = `h-full rounded-xl border border-hairline bg-canvas ${dense ? "p-3" : "p-4"}`;
          // In compare mode each row is a column; every column after the first
          // starts with the dividing line.
          const col = compare ? `flex h-full flex-col gap-3 ${r > 0 ? "border-l border-hairline pl-3 sm:pl-6" : ""} ${r < all.length - 1 ? "pr-3 sm:pr-6" : ""}` : "flex flex-col gap-3";
          return (
            <div key={r} className={col}>
              {row.label ? (
                <div className={`dg-part ${LABEL}`} style={at(i++)}>
                  {row.label}
                </div>
              ) : null}
              {connector === "none" ? (
                <ul className="flex flex-wrap gap-2">
                  {row.steps.map((s, k) => (
                    <li
                      key={k}
                      className={`dg-part rounded-full border border-hairline bg-canvas px-3 py-1.5 text-[14px] text-fg ${s.mark ? "dg-mark" : ""}`}
                      style={at(i++)}
                    >
                      {s.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <ol className={compare ? "flex flex-1 flex-col" : "flex flex-col sm:flex-row sm:items-stretch"}>
                  {row.steps.map((s, k) => (
                    <Fragment key={k}>
                      {k > 0 ? (
                        <li
                          aria-hidden
                          className={compare ? "flex min-h-6 flex-1 items-stretch justify-center py-1" : "flex h-7 shrink-0 items-stretch justify-center py-1 sm:h-auto sm:w-8 sm:items-center sm:px-1 sm:py-0"}
                        >
                          {compare ? (
                            <span className="dg-line dg-line-v relative block w-px bg-fg-muted" style={at(i++)}>
                              <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 border-r border-b border-fg-muted" />
                            </span>
                          ) : (
                            <span className="dg-line relative block w-px bg-fg-muted sm:h-px sm:w-full" style={at(i++)}>
                              <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 border-r border-b border-fg-muted sm:top-1/2 sm:right-0 sm:bottom-auto sm:left-auto sm:translate-x-0 sm:-translate-y-1/2 sm:-rotate-45" />
                            </span>
                          )}
                        </li>
                      ) : null}
                      <li className={`dg-part min-w-0 ${compare ? "" : "sm:flex-1"}`} style={at(i++)}>
                        <div
                          className={`${box} ${compare ? "min-h-[8.5rem] sm:min-h-[6.25rem]" : ""} ${s.blind ? "border-dashed" : ""} ${s.mark ? "dg-mark" : ""}`}
                          style={s.mark ? at(markAt) : undefined}
                        >
                          <div className="flex items-center gap-2">
                            {s.color ? (
                              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                            ) : null}
                            <span className="text-[14px] leading-snug font-medium text-fg">{s.title}</span>
                            {s.blind ? (
                              <svg aria-hidden className="ml-auto shrink-0 text-fg-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3.6-7 10-7c2.1 0 3.9.7 5.4 1.7M22 12s-3.6 7-10 7c-2.1 0-3.9-.7-5.4-1.7" />
                                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                                <path d="M3 3l18 18" />
                              </svg>
                            ) : null}
                            {s.flag ? (
                              <span aria-hidden className="dg-flag ml-auto shrink-0" style={at(markAt)}>
                                <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
                                  <path className="dg-flag-pole" d="M2 17V1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                  <path className="dg-flag-cloth" d="M2.8 2h10.4l-2.6 3.4 2.6 3.4H2.8z" fill="#e5484d" />
                                </svg>
                              </span>
                            ) : null}
                          </div>
                          {s.note ? <p className="text-note mt-1.5 text-fg-muted">{s.note}</p> : null}
                        </div>
                      </li>
                    </Fragment>
                  ))}
                </ol>
              )}
              {row.loop ? (
                <div className="dg-part flex items-center gap-2 text-note text-fg-muted" style={at(i++)}>
                  <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.5" />
                    <path d="M20 3.5v5h-5" />
                    <path d="M20 12a8 8 0 0 1-13.66 5.66L4 15.5" />
                    <path d="M4 20.5v-5h5" />
                  </svg>
                  {row.loop}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </DiagramFrame>
  );
}
