import { AppIcon } from '@/components/AppIcon';

export function LoginInfoCallout() {
  return (
    <div className="pointer-events-none max-w-[260px] rounded-[var(--radius-card)] border border-orbita-border/70 bg-orbita-card/95 p-4 shadow-[var(--shadow-overlay)] backdrop-blur">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-white">
        <AppIcon name="check" size={16} tone="success" />
        O caminho certo, sempre visível
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-orbita-text-muted">
        Área, equipe, período e destino permanecem claros até a confirmação final.
      </p>
    </div>
  );
}
