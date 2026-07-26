import { AppBadge } from '@/components/AppBadge';

/**
 * Sidebar-only brand treatment (icon + "Escala" + "ICI" badge), using the real
 * Órbita mark from public/favicon.svg — kept separate from the shared `Brand`
 * component so this ajuste never touches the already-approved /login screen.
 */
export function OrbitBrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orbita-elevated">
        <img src="/favicon.svg" alt="" aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-white">Escala</span>
      <AppBadge tone="info" dot={false}>
        ICI
      </AppBadge>
    </div>
  );
}
