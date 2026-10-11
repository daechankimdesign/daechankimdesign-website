import type { CSSProperties } from "react";
import { DiagramFrame } from "./DiagramFrame";
import { LABEL } from "./styles";

type Phase = {
  /** The phase's theme, e.g. "Exploration". */
  theme: string;
  /** The hypothesis, in one sentence. Wrap its key areas in [[double
   *  brackets]] to underline them. Omit for a step without one (its column
   *  under the sankey stays blank). */
  hypothesis?: string;
  /** The scope this phase works on, labelled on its sankey node. */
  scope: string;
  /** The research method used in this phase, under the node's label. */
  method?: string;
  /** Relative size of that scope (the first phase is the largest). */
  size: number;
  /** What was set aside on the way to the next phase: it becomes a node of
   *  its own in the next column, sized by the difference. */
  dropped?: string;
  /** A groundwork step (e.g. step 0, observing communities): drawn as one
   *  large input with no node bar, the sankey's full height, narrowing into
   *  the next step's node. Its size is not used. */
  ghost?: boolean;
};

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** The underline shared with the phase text below the diagram. */
export const KEY_UNDERLINE = "underline decoration-1 underline-offset-[3px]";

// "[[key]]" in a hypothesis renders underlined.
const keyed = (text: string) =>
  text.split(/(\[\[[^\]]+\]\])/).map((part, i) =>
    part.startsWith("[[") ? (
      <u key={i} className={KEY_UNDERLINE}>
        {part.slice(2, -2)}
      </u>
    ) : (
      part
    ),
  );

// Sankey layout, in viewBox units. The SVG stretches to the panel (no aspect
// lock: only the horizontal run of the bands changes), and the labels are
// HTML placed by percentage, so text stays at its real size at any width.
const W = 1000;
const H = 300;
const NODE_W = 28; // thick, so the steps read as the bars, not the bands
const GAP = 28; // vertical gap between the nodes of one column
const POOL_SHARE = 0.5; // share of the height the rest of the sankey takes beside a pool

// `group`: the phase (1-based) a part belongs to, for the hover link to its
// hypothesis. A step owns its column: the flow leaving its node and what that
// flow sets aside.
type Node = { x: number; y: number; h: number; label: string; main: boolean; group: number; step?: number; method?: string };
/** `th`: the band's height where it lands, when it differs from `h` (a pool
 *  strand narrows as it gathers into the next node). */
type Link = { sx: number; sy: number; tx: number; ty: number; h: number; th?: number; tone: "main" | "drop" | "end" | "pool"; group: number };
type NodeDraw = Node & { ghost?: boolean };

/**
 * Phased hypotheses: a sankey shows the question narrowing, one column per
 * phase. Each phase's scope is a node; what the next phase keeps flows on to
 * the next main node, and what it sets aside flows into a node of its own
 * below (bands keep their width, so a node's height is the flow into it).
 * Under each column, a small "01 · theme" label and the hypothesis. On
 * scroll-in the sankey draws left to right, then the hypotheses appear.
 */
export function PhaseFunnel({
  phases = [],
  startAt = 1,
}: {
  phases?: Phase[];
  /** The number shown for the first step (0 when it is a groundwork step
   *  before the first hypothesis). */
  startAt?: number;
}) {
  const num = (k: number) => String(startAt + k).padStart(2, "0");
  const n = phases.length;
  if (!n) return null;
  // With a pool, the rest of the sankey takes about half the height, centred
  // on it, so the pool reads as far larger than what it gathers into.
  const pooled = phases.some((p) => p.ghost);
  const max = Math.max(...phases.filter((p) => !p.ghost).map((p) => p.size), 1);
  const scale = (H * (pooled ? POOL_SHARE : 1) - GAP) / max;
  const off = pooled ? (H - (max * scale + GAP)) / 2 : 0;
  const colX = (k: number) => (k * W) / n;

  const nodes: Node[] = [];
  const links: Link[] = [];
  phases.forEach((p, k) => {
    const h = p.size * scale;
    // The input spans the full height, so its label sits at the middle.
    nodes.push({ x: colX(k), y: p.ghost ? 0 : off, h: p.ghost ? H : h, label: p.scope, main: true, group: k + 1, step: k + 1, method: p.method, ghost: p.ghost } as NodeDraw);
    if (k === n - 1) return;
    if (p.ghost) {
      // One input: the full height at the left edge, narrowing into the whole
      // of the next node.
      links.push({ sx: colX(k), sy: 0, tx: colX(k + 1), ty: off, h: H, th: phases[k + 1].size * scale, tone: "pool", group: k + 1 });
      return;
    }
    const keep = phases[k + 1].size * scale;
    const drop = h - keep;
    const sx = colX(k) + NODE_W;
    const tx = colX(k + 1);
    // What flows on: the top of this node into the next main node.
    links.push({ sx, sy: off, tx, ty: off, h: keep, tone: "main", group: k + 1 });
    // What was set aside: the rest, into its own node below the next main one.
    if (drop > 0) {
      const dy = off + keep + GAP;
      nodes.push({ x: tx, y: dy, h: drop, label: p.dropped ?? "", main: false, group: k + 1 });
      links.push({ sx, sy: off + keep, tx, ty: dy, h: drop, tone: "drop", group: k + 1 });
    }
  });

  // d3-sankey's horizontal link: a band whose edges are cubic curves with
  // control points at the horizontal midpoint.
  const band = (l: Link) => {
    const m = (l.sx + l.tx) / 2;
    const th = l.th ?? l.h;
    return `M${l.sx},${l.sy} C${m},${l.sy} ${m},${l.ty} ${l.tx},${l.ty} L${l.tx},${l.ty + th} C${m},${l.ty + th} ${m},${l.sy + l.h} ${l.sx},${l.sy + l.h} Z`;
  };
  const tone = {
    main: "fill-fg-muted opacity-30",
    drop: "fill-fg-subtle opacity-35",
    end: "fill-[var(--hl)]",
    pool: "fill-fg-muted opacity-25",
  } as const;
  const grid = { "--n": n } as CSSProperties;

  return (
    <DiagramFrame>
      {/* .dg-steps: hovering any part of a phase (flow, node, label, or its
          hypothesis) dims the other phases; see diagram.css. */}
      <div className="dg-steps">
      {/* Taller on phones beside a pool: the rest is drawn at half height,
          and its labels need the room. */}
      <div className={`relative ${pooled ? "h-[320px]" : "h-[200px]"} sm:h-[240px]`}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="dg-grow absolute inset-0 h-full w-full"
          style={at(0)}
          aria-hidden
          // The SVG itself must not take the hover, only its phase groups.
          pointerEvents="none"
        >
          {phases.map((_, k) => (
            <g key={k} data-step={k + 1} pointerEvents="auto">
              {/* The step's column: a hover target across its whole height. */}
              <rect
                x={colX(k)}
                y={0}
                width={(k < n - 1 ? colX(k + 1) : W) - colX(k)}
                height={H}
                pointerEvents="all"
                className="fill-transparent"
              />
              {/* The final step carries on as a highlighted band to the edge:
                  the flow the design is built on. */}
              {k === n - 1 ? (
                <rect x={colX(k) + NODE_W} y={off} width={W - colX(k) - NODE_W} height={phases[k].size * scale} className="fill-[var(--hl)]" />
              ) : null}
              {links.filter((l) => l.group === k + 1).map((l, i) => (
                <path key={i} d={band(l)} className={tone[l.tone]} />
              ))}
              {nodes.filter((d) => d.group === k + 1 && !(d as NodeDraw).ghost).map((d, i) => (
                <rect key={i} x={d.x} y={d.y} width={NODE_W} height={d.h} className={d.main ? "fill-fg" : "fill-fg-subtle"} />
              ))}
            </g>
          ))}
        </svg>
        {/* Node labels, beside each node */}
        <ul aria-label={phases.map((p) => p.scope).join(", then ")}>
          {nodes.map((d, i) => (
            <li
              key={i}
              className={`dg-part absolute leading-snug ${d.main ? `${(d as NodeDraw).ghost ? "pl-1 text-[11px] sm:pl-2 sm:text-note" : "pl-2 text-note"} font-medium text-fg` : "pl-2 text-[11px] text-fg-subtle"}`}
              style={{
                left: `${((d.x + NODE_W) / W) * 100}%`,
                top: `${((d.y + d.h / 2) / H) * 100}%`,
                // The input's label sits over its own band, so it may use its
                // whole column; the others stop short of the next node.
                maxWidth: (d as NodeDraw).ghost ? `calc(${100 / n}% - 0.25rem)` : `calc(${100 / n}% - 1.5rem)`,
                translate: "0 -50%",
                ...at(1 + i),
              }}
            >
              <span data-step={d.group} className="block">
              {/* Branch nodes say what they are, so the chart needs no caption. */}
              {!d.main ? <span className="block text-[10px] font-medium tracking-[0.08em] uppercase">Set aside</span> : null}
              {d.step ? <span className="block text-[11px] font-medium tracking-[0.08em] text-fg-muted">{num(d.step - 1)}</span> : null}
              {d.label}
              {d.method ? <span className="mt-0.5 block font-normal text-fg-muted">{d.method}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* The hypotheses */}
      <ol
        className="mt-8 grid grid-cols-1 gap-8 border-t border-hairline pt-8 sm:[grid-template-columns:repeat(var(--n),minmax(0,1fr))] sm:gap-5"
        style={grid}
      >
        {phases.map((p, k) => (
          <li key={k} className="dg-part" style={at(1 + nodes.length + k)}>
            {p.hypothesis ? (
            <div data-step={k + 1}>
            <div className={LABEL}>
              {num(k)} · {p.theme}
            </div>
            <p className="mt-2 text-[16px] leading-snug text-fg">{keyed(p.hypothesis)}</p>
            </div>
            ) : null}
          </li>
        ))}
      </ol>
      </div>
    </DiagramFrame>
  );
}
