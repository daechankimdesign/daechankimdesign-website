import type { CSSProperties } from "react";
import { DiagramFrame } from "./DiagramFrame";

type Bar = {
  label: string;
  value: number;
  /** The value as printed at the bar's tip, e.g. "101 months", "$1,262.77". */
  display: string;
  /** The option the passage argues for: drawn in ink; the rest in muted grey. */
  emphasis?: boolean;
};

type Group = {
  /** What the bars measure, e.g. "Months to clear the balance". */
  label: string;
  bars: Bar[];
};

const at = (i: number) => ({ "--i": i }) as CSSProperties;

// Room kept at the end of every track for the value printed at the bar's tip.
const TIP_ROOM = "6rem";

/**
 * A small side-by-side comparison: one bar chart per measure (never a second
 * axis), each bar labelled with its option and its value at the tip, so colour
 * is never the only way to tell the bars apart. One emphasised option in ink,
 * the rest in muted grey. Bars grow from the baseline on scroll-in; the closing
 * note's marked figure takes the highlighter colour last.
 */
export function CompareBars({
  groups = [],
  note,
  mark,
}: {
  groups?: Group[];
  /** A line under the charts, e.g. "Interest saved by the fixed payment:". */
  note?: string;
  /** The figure after the note, marked, e.g. "$873.87". */
  mark?: string;
}) {
  if (!groups.length) return null;
  let i = 0;
  return (
    <DiagramFrame>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10">
        {groups.map((g, k) => {
          const max = Math.max(...g.bars.map((b) => b.value));
          return (
            <div key={k} className="flex flex-col gap-4">
              <p className="dg-part text-[14px] font-medium text-fg" style={at(i++)}>
                {g.label}
              </p>
              {g.bars.map((b, j) => (
                <div key={j} className="flex flex-col gap-1.5">
                  <span className="dg-part text-note text-fg-muted" style={at(i)}>
                    {b.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`dg-grow h-5 rounded-r-[4px] ${b.emphasis ? "bg-fg" : "bg-fg-muted"}`}
                      style={{ width: `calc((100% - ${TIP_ROOM}) * ${b.value / max})`, ...at(i++) }}
                    />
                    <span className="dg-part shrink-0 text-[14px] font-medium text-fg tabular-nums" style={at(i)}>
                      {b.display}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {note ? (
        <p className="dg-part mt-8 text-[14px] text-fg" style={at(i + 1)}>
          {note}{" "}
          {mark ? (
            <span className="dg-mark rounded px-1.5 py-0.5 font-medium" style={at(i + 2)}>
              {mark}
            </span>
          ) : null}
        </p>
      ) : null}
    </DiagramFrame>
  );
}
