import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AppDropdownMenu, AppDropdownItem } from '@/components/AppDropdownMenu';
import { useToast } from '@/components/AppToast';
import { useAuth } from '@/app/auth';
import { useOrganizationRepository } from '@/app/services';
import { DEV_USERS } from '@/services/DevAuthGateway';
import type { MembershipRole } from '@/domain/membership';
import { Icon } from '@/design-system/icons';

const ROLE_LABELS: Record<MembershipRole, string> = {
  ADMIN: 'Administrador',
  SCHEDULE_MANAGER: 'Gestor de escalas',
  VIEWER: 'Visualizador',
};

export function AuthenticatedUserMenu() {
  const { user, signOut, switchDevUser } = useAuth();
  const organizationRepository = useOrganizationRepository();
  const { show } = useToast();
  const [, navigate] = useLocation();
  const [roleLabel, setRoleLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void organizationRepository.listOrganizationsForUser(user.id).then(async (orgs) => {
      const org = orgs[0];
      if (!org) return;
      const membership = await organizationRepository.getMembership(user.id, org.id);
      if (!cancelled && membership) setRoleLabel(ROLE_LABELS[membership.role]);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationRepository, user]);

  if (!user) return null;

  return (
    <AppDropdownMenu
      trigger={(triggerProps) => (
        <button
          {...triggerProps}
          className="focus-ring flex items-center gap-2 rounded-[var(--radius-pill)] py-1 pr-1 hover:bg-orbita-elevated"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-gradient-to-br from-orbita-blue to-orbita-violet-dark text-[12px] font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-[13px] font-medium text-white">{user.name}</span>
            {roleLabel && <span className="block text-[11px] text-orbita-text-muted">{roleLabel}</span>}
          </span>
          <span aria-hidden="true" className="hidden text-orbita-text-faint sm:inline">
            {Icon.chevronDown}
          </span>
        </button>
      )}
    >
      <AppDropdownItem onClick={() => show('Funcionalidade disponível em um próximo checkpoint', 'info')}>
        Ver conta local
      </AppDropdownItem>
      <AppDropdownItem onClick={() => void signOut()}>Sair</AppDropdownItem>
      {import.meta.env.DEV && switchDevUser && (
        <>
          <div className="my-1 h-px bg-orbita-border/60" />
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-orbita-text-faint">
            Trocar usuário de desenvolvimento
          </p>
          {DEV_USERS.map(({ user: devUser }) => (
            <AppDropdownItem
              key={devUser.id}
              disabled={devUser.id === user.id}
              onClick={async () => {
                await switchDevUser(devUser);
                navigate('/organizacoes');
              }}
            >
              {devUser.name}
              {devUser.id === user.id ? ' (atual)' : ''}
            </AppDropdownItem>
          ))}
        </>
      )}
    </AppDropdownMenu>
  );
}
