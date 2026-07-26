interface CurrentContextCardProps {
  label: string;
  value: string;
}

export function CurrentContextCard({ label, value }: CurrentContextCardProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[var(--radius-control)] border border-orbita-border/60 bg-orbita-elevated/60 py-1.5 pr-4 pl-3">
      <span aria-hidden="true" className="h-6 w-0.5 shrink-0 rounded-[var(--radius-pill)] bg-orbita-blue" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-widest text-orbita-text-faint uppercase">{label}</p>
        <p className="truncate text-[13px] font-medium text-white">{value}</p>
      </div>
      <div
        aria-hidden="true"
        className="ml-2 hidden h-1 w-24 shrink-0 rounded-[var(--radius-pill)] bg-gradient-to-r from-orbita-blue via-orbita-warning to-orbita-success sm:block"
      />
    </div>
  );
}
