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
 * `connector="none"` drops the arrows for a set of parallel items rather than a
 * sequence (e.g. what each side of a product needs).
 */
export function StepFlow({
  steps,
  rows,
  connector = "arrow",
}: {
  steps?: Step[];
  rows?: Row[];
  connector?: "arrow" | "none";
}) {
  const all: Row[] = rows ?? (steps ? [{ steps }] : []);
  if (!all.length) return null;

  // One running index across the whole figure, so rows build in reading order;
  // marks land after everything else.
  let i = 0;
  const total = all.reduce((n, r) => n + r.steps.length * 2 + (r.label ? 1 : 0) + (r.loop ? 1 : 0), 0);
  const markAt = total + 1;

  return (
    <DiagramFrame>
      <div className="flex flex-col gap-8">
        {all.map((row, r) => {
          const dense = row.steps.length >= 5;
          const box = `h-full rounded-xl border border-hairline bg-canvas ${dense ? "p-3" : "p-4"}`;
          return (
            <div key={r} className="flex flex-col gap-3">
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
                <ol className="flex flex-col sm:flex-row sm:items-stretch">
                  {row.steps.map((s, k) => (
                    <Fragment key={k}>
                      {k > 0 ? (
                        <li
                          aria-hidden
                          className="flex h-7 shrink-0 items-stretch justify-center py-1 sm:h-auto sm:w-8 sm:items-center sm:px-1 sm:py-0"
                        >
                          <span className="dg-line relative block w-px bg-fg-muted sm:h-px sm:w-full" style={at(i++)}>
                            <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 border-r border-b border-fg-muted sm:top-1/2 sm:right-0 sm:bottom-auto sm:left-auto sm:translate-x-0 sm:-translate-y-1/2 sm:-rotate-45" />
                          </span>
                        </li>
                      ) : null}
                      <li className="dg-part min-w-0 sm:flex-1" style={at(i++)}>
                        <div className={`${box} ${s.mark ? "dg-mark" : ""}`} style={s.mark ? at(markAt) : undefined}>
                          <div className="flex items-center gap-2">
                            {s.color ? (
                              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                            ) : null}
                            <span className="text-[14px] leading-snug font-medium text-fg">{s.title}</span>
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
