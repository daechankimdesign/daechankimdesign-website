import type { WorkStatus } from "@/lib/taxonomy";

// The type badge is already a FILLED pill, so status is an OUTLINE pill with a
// leading dot to read as a matched set without a second fill competing. Dot
// filled = shipped (done), ring = concept (idea). Fully monochrome, legible
// without color. Static class map (Tailwind JIT can't see interpolated classes).
const DOT: Record<WorkStatus, string> = {
  shipped: "bg-fg",
  concept: "border border-fg-muted",
};

/**
 * Lifecycle badge for a work tile / slug header. Presentational: takes the
 * already-localized `label` so it works in both server (slug pages) and client
 * (WorkTile) trees without pulling translations itself. Square corners match the
 * type badge; the outline + dot distinguish it. Text on `fg-muted` passes AA.
 */
export function StatusBadge({
  status,
  label,
}: {
  status: WorkStatus;
  label: string;
}) {
  return (
    <span className="text-caption inline-flex items-center gap-1.5 border border-hairline px-2.5 py-1 text-fg-muted">
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${DOT[status]}`}
      />
      {label}
    </span>
  );
}
