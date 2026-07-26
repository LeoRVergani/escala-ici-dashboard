interface OrganizationCountBadgeProps {
  count: number;
}

export function OrganizationCountBadge({ count }: OrganizationCountBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-orbita-border bg-orbita-elevated px-3 py-1 text-[12px] text-orbita-text-muted">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-orbita-success" />
      {count} {count === 1 ? 'organização autorizada' : 'organizações autorizadas'}
    </span>
  );
}
