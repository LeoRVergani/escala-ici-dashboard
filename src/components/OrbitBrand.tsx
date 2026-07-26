import { AppBadge } from './AppBadge';

export type OrbitBrandVariant = 'login' | 'sidebar' | 'compact';

/** Official Órbita mark — single source for every variant, never a per-screen placeholder. */
export const ORBITA_MARK_SRC = '/orbita-mark.webp';

interface OrbitBrandProps {
  variant?: OrbitBrandVariant;
}

/**
 * Single source of truth for the Órbita brand mark — replaces what used to be
 * two independent implementations (Brand.tsx for /login, OrbitBrandMark.tsx
 * for the sidebar), and now renders the official mark asset in every variant.
 * See docs/design/DESIGN-SYSTEM-ORBITA.md.
 */
export function OrbitBrand({ variant = 'login' }: OrbitBrandProps) {
  if (variant === 'sidebar') {
    return (
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orbita-elevated">
          <img src={ORBITA_MARK_SRC} alt="" aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="text-[15px] font-bold tracking-tight text-white">Escala</span>
        <AppBadge tone="info" dot={false}>
          ICI
        </AppBadge>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orbita-elevated">
        <img src={ORBITA_MARK_SRC} alt="" aria-hidden="true" className="h-4 w-4" />
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orbita-elevated">
        <img src={ORBITA_MARK_SRC} alt="" aria-hidden="true" className="h-6 w-6" />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-white">ESCALA ICI</span>
    </div>
  );
}
