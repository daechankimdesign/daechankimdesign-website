type MetaItem = { label: string; value: string };

/**
 * Case-study metadata as side-by-side vertical stacks (small muted label over
 * the value). Wraps on narrow screens. Used near the top of a project MDX.
 */
export function ProjectMeta({ items }: { items: MetaItem[] }) {
  return (
    <dl className="my-8 flex flex-wrap gap-x-12 gap-y-6">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-1">
          <dt className="text-caption text-fg-muted">{it.label}</dt>
          <dd className="text-body text-fg">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
