import { useState, type ReactNode } from 'react';
import { AppDrawer } from '@/components/AppDrawer';
import { OrbitSidebar } from './OrbitSidebar';
import { OrbitTopbar } from './OrbitTopbar';

interface OrbitAppShellProps {
  activeNavKey: string;
  contextLabel: string;
  children: ReactNode;
}

export function OrbitAppShell({ activeNavKey, contextLabel, children }: OrbitAppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-orbita-bg">
      <div className="hidden lg:block">
        <OrbitSidebar activeKey={activeNavKey} />
      </div>

      <AppDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Navegação" side="left">
        <OrbitSidebar activeKey={activeNavKey} onNavigate={() => setMobileNavOpen(false)} />
      </AppDrawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <OrbitTopbar contextLabel={contextLabel} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
