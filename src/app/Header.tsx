import { Link } from 'wouter';
import { OrbitBrand } from '@/components/OrbitBrand';
import { AppIconButton } from '@/components/AppIconButton';
import { AppDropdownMenu, AppDropdownItem } from '@/components/AppDropdownMenu';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { Icon } from '@/design-system/icons';
import { useAuth } from './auth';

interface HeaderProps {
  breadcrumb?: { sectorCode: string; teamCode?: string };
}

export function Header({ breadcrumb }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-y-2 border-b border-orbita-border/60 bg-orbita-bg px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <Link href="/organizacoes" aria-label="Ir para minhas organizações">
          <OrbitBrand variant="login" />
        </Link>
        <span className="hidden shrink-0 rounded-[var(--radius-pill)] border border-orbita-border bg-orbita-elevated px-2.5 py-1 text-[11px] text-orbita-text-muted sm:inline-block">
          Ambiente local de desenvolvimento
        </span>
        <span className="shrink-0 rounded-[var(--radius-pill)] border border-orbita-border bg-orbita-elevated px-2 py-1 text-[10px] text-orbita-text-muted sm:hidden">
          Local
        </span>
        {breadcrumb && (
          <AppBreadcrumb
            variant="pill"
            segments={breadcrumb.teamCode ? [breadcrumb.sectorCode, breadcrumb.teamCode] : [breadcrumb.sectorCode]}
          />
        )}
      </div>
      {user && (
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <AppIconButton label="Notificações">{Icon.bell}</AppIconButton>
          <AppDropdownMenu
            trigger={(triggerProps) => (
              <button
                {...triggerProps}
                className="focus-ring flex items-center gap-2 rounded-[var(--radius-pill)] pr-1 hover:bg-orbita-elevated"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-gradient-to-br from-orbita-blue to-orbita-violet-dark text-[12px] font-bold text-white">
                  {user.name.charAt(0)}
                </span>
                <span className="hidden text-[13px] font-medium text-white sm:inline">{user.name}</span>
              </button>
            )}
          >
            <AppDropdownItem onClick={() => void signOut()}>Sair do ambiente local</AppDropdownItem>
          </AppDropdownMenu>
        </div>
      )}
    </header>
  );
}
