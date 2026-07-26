import { AppIcon } from '@/components/AppIcon';

export function ProtectedEnvironmentCard() {
  return (
    <div className="rounded-[var(--radius-card-sm)] border border-orbita-success/30 bg-orbita-success/10 p-3">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-orbita-success">
        <AppIcon name="shield" size={16} tone="success" /> Ambiente protegido
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-orbita-text-muted">
        As ações deste ambiente local não alteram escalas reais.
      </p>
    </div>
  );
}
