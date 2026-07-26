import { AppIconButton } from '@/components/AppIconButton';
import { Icon } from '@/design-system/icons';
import { AuthenticatedUserMenu } from './AuthenticatedUserMenu';
import { CurrentContextCard } from './CurrentContextCard';

interface OrbitTopbarProps {
  contextLabel: string;
  onOpenMobileNav: () => void;
}

export function OrbitTopbar({ contextLabel, onOpenMobileNav }: OrbitTopbarProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-orbita-border/60 bg-orbita-bg px-4 py-3 sm:px-6 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <AppIconButton label="Abrir menu de navegação" className="lg:hidden" onClick={onOpenMobileNav}>
          {Icon.menu}
        </AppIconButton>
        <CurrentContextCard label="Contexto atual" value={contextLabel} />
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="relative">
          <AppIconButton label="Notificações">{Icon.bell}</AppIconButton>
          <span aria-hidden="true" className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-orbita-danger" />
        </span>
        <span aria-hidden="true" className="hidden h-8 w-px bg-orbita-border/60 sm:block" />
        <AuthenticatedUserMenu />
      </div>
    </header>
  );
}
