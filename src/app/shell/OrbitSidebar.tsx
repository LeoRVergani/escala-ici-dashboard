import { Link } from 'wouter';
import { Brand } from '@/components/Brand';
import { useToast } from '@/components/AppToast';
import { ProtectedEnvironmentCard } from './ProtectedEnvironmentCard';

interface NavItem {
  key: string;
  label: string;
  href?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'organizacoes', label: 'Minhas organizações', href: '/organizacoes' },
  { key: 'escalas', label: 'Escalas' },
  { key: 'trocas', label: 'Solicitações de troca' },
  { key: 'historico', label: 'Histórico' },
  { key: 'configuracoes', label: 'Configurações' },
];

interface OrbitSidebarProps {
  activeKey: string;
  onNavigate?: () => void;
}

export function OrbitSidebar({ activeKey, onNavigate }: OrbitSidebarProps) {
  const { show } = useToast();

  return (
    <div className="flex h-full w-64 flex-col justify-between border-r border-orbita-border/60 bg-orbita-surface p-4">
      <div>
        <div className="px-2 py-2">
          <Brand />
        </div>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeKey;
            if (!item.href) {
              return (
                <button
                  key={item.key}
                  type="button"
                  className="focus-ring rounded-[var(--radius-control)] px-3 py-2 text-left text-[13px] text-orbita-text-muted transition hover:bg-orbita-elevated hover:text-white"
                  onClick={() => show('Funcionalidade disponível em um próximo checkpoint', 'info')}
                >
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
                className={`focus-ring block rounded-[var(--radius-control)] px-3 py-2 text-[13px] transition ${
                  isActive
                    ? 'bg-orbita-elevated text-white shadow-[0_0_0_1px_rgba(59,130,246,0.15)]'
                    : 'text-orbita-text-muted hover:bg-orbita-elevated hover:text-white'
                }`}
              >
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
