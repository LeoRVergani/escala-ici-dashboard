import { Link } from 'wouter';
import { useToast } from '@/components/AppToast';
import { OrbitBrand } from '@/components/OrbitBrand';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { ProtectedEnvironmentCard } from './ProtectedEnvironmentCard';

interface NavItem {
  key: string;
  label: string;
  icon: AppIconName;
  href?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'organizacoes', label: 'Minhas organizações', href: '/organizacoes', icon: 'organizations' },
  { key: 'escalas', label: 'Escalas', icon: 'schedules' },
  { key: 'trocas', label: 'Solicitações de troca', icon: 'exchange' },
  { key: 'historico', label: 'Histórico', icon: 'history' },
  { key: 'configuracoes', label: 'Configurações', icon: 'settings' },
];

interface OrbitSidebarProps {
  activeKey: string;
  onNavigate?: () => void;
}

export function OrbitSidebar({ activeKey, onNavigate }: OrbitSidebarProps) {
  const { show } = useToast();

  return (
    <div
      style={{ width: 'var(--width-sidebar)' }}
      className="flex h-full flex-col justify-between border-r border-orbita-border/60 bg-orbita-surface p-4"
    >
      <div>
        <div className="px-2 pt-2 pb-4">
          <OrbitBrand variant="sidebar" />
        </div>
        <nav className="mt-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeKey;
            const iconEl = <AppIcon name={item.icon} tone={isActive ? 'active' : 'muted'} />;
            if (!item.href) {
              return (
                <button
                  key={item.key}
                  type="button"
                  className="focus-ring flex items-center gap-2.5 rounded-[var(--radius-control)] border-l-2 border-transparent px-3 py-2 text-left text-[13px] text-orbita-text-muted transition hover:bg-orbita-elevated hover:text-white"
                  onClick={() => show('Funcionalidade disponível em um próximo checkpoint', 'info')}
                >
                  {iconEl}
                  {item.label}
                </button>
              );
            }
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={`focus-ring flex items-center gap-2.5 rounded-[var(--radius-control)] border-l-2 px-3 py-2 text-[13px] transition ${
                  isActive
                    ? 'border-orbita-blue bg-orbita-elevated text-white'
                    : 'border-transparent text-orbita-text-muted hover:bg-orbita-elevated hover:text-white'
                }`}
              >
                {iconEl}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <ProtectedEnvironmentCard />
    </div>
  );
}
