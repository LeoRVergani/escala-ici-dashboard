import { AppIconButton } from '@/components/AppIconButton';
import { Icon } from '@/design-system/icons';
import { AuthenticatedUserMenu } from './AuthenticatedUserMenu';

interface OrbitTopbarProps {
  contextLabel: string;
  onOpenMobileNav: () => void;
}

export function OrbitTopbar({ contextLabel, onOpenMobileNav }: OrbitTopbarProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-orbita-border/60 bg-orbita-bg px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <AppIconButton label="Abrir menu de navegação" className="lg:hidden" onClick={onOpenMobileNav}>
          {Icon.menu}
        </AppIconButton>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-widest text-orbita-text-faint uppercase">Contexto atual</p>
          <p className="truncate text-[13px] font-medium text-white">{contextLabel}</p>
          <div
            aria-hidden="true"
            className="mt-1 h-1 w-32 rounded-[var(--radius-pill)] bg-gradient-to-r from-orbita-blue via-orbita-warning to-orbita-success"
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <AppIconButton label="Notificações">{Icon.bell}</AppIconButton>
        <AuthenticatedUserMenu />
      </div>
    </header>
  );
}
