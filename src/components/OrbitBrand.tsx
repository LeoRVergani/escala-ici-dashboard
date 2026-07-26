import { AppBadge } from './AppBadge';

export type OrbitBrandVariant = 'login' | 'sidebar' | 'compact';

export const ORBITA_MARK_SRC = '/favicon.svg';

interface OrbitBrandProps {
  variant?: OrbitBrandVariant;
}

/**
 * Single source of truth for the Órbita brand mark — replaces what used to be
 * two independent implementations (Brand.tsx for /login, OrbitBrandMark.tsx
 * for the sidebar). Per-variant visual output is unchanged from before this
 * refactor; see docs/design/DESIGN-SYSTEM-ORBITA.md for why "login" still
 * renders the ICI lettermark square instead of the swoosh asset.
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
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orbita-blue to-orbita-violet-dark text-[13px] font-bold text-white">
        ICI
      </div>
      <span className="text-[15px] font-bold tracking-tight text-white">ESCALA ICI</span>
    </div>
  );
}
