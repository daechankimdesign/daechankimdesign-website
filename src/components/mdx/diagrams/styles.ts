/** The small uppercase label the diagrams share (row names, field names). Kept
 *  out of DiagramFrame: that module is a client one, and a constant exported
 *  from it reaches server components as a client reference, not a string. */
export const LABEL = "text-note font-medium uppercase tracking-[0.08em] text-fg-muted";
