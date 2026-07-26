import { Link } from 'wouter';
import { useToast } from '@/components/AppToast';
import { Icon } from '@/design-system/icons';
import { OrbitBrandMark } from './OrbitBrandMark';
import { ProtectedEnvironmentCard } from './ProtectedEnvironmentCard';

interface NavItem {
  key: string;
  label: string;
  icon: string;
  href?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'organizacoes', label: 'Minhas organizações', href: '/organizacoes', icon: Icon.building },
  { key: 'escalas', label: 'Escalas', icon: Icon.calendar },
  { key: 'trocas', label: 'Solicitações de troca', icon: Icon.exchange },
  { key: 'historico', label: 'Histórico', icon: Icon.clock },
  { key: 'configuracoes', label: 'Configurações', icon: Icon.settings },
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
          <OrbitBrandMark />
        </div>
        <nav className="mt-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeKey;
            const iconSpan = (
              <span aria-hidden="true" className={isActive ? 'text-orbita-blue' : 'text-orbita-text-faint'}>
                {item.icon}
              </span>
            );
            if (!item.href) {
              return (
                <button
                  key={item.key}
                  type="button"
                  className="focus-ring flex items-center gap-2.5 rounded-[var(--radius-control)] border-l-2 border-transparent px-3 py-2 text-left text-[13px] text-orbita-text-muted transition hover:bg-orbita-elevated hover:text-white"
                  onClick={() => show('Funcionalidade disponível em um próximo checkpoint', 'info')}
                >
                  {iconSpan}
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
                {iconSpan}
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
