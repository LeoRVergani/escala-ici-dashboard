import { useState } from 'react';
import { useLocation } from 'wouter';
import { AppButton } from '@/components/AppButton';
import { AppDisclosure } from '@/components/AppDisclosure';
import { useToast } from '@/components/AppToast';
import { useAuth } from '@/app/auth';
import { AppIcon } from '@/components/AppIcon';
import type { AuthUser } from '@/services/AuthGateway';

const MICROSOFT_UNAVAILABLE_MESSAGE =
  'A integração Microsoft ainda não está configurada neste ambiente local.';

const SIMULATION_USERS: Array<{ user: AuthUser; role: string }> = [
  {
    user: { id: 'dev-lvergani', name: 'Leonardo Vergani', login: 'lvergani' },
    role: 'Administrador e desenvolvedor',
  },
  {
    user: { id: 'dev-claudio', name: 'Claudio', login: 'claudio' },
    role: 'Gestor SOC e Plantão',
  },
];

function MicrosoftMark() {
  return (
    <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
      <span className="h-2 w-2 bg-[#F25022]" />
      <span className="h-2 w-2 bg-[#7FBA00]" />
      <span className="h-2 w-2 bg-[#00A4EF]" />
      <span className="h-2 w-2 bg-[#FFB900]" />
    </span>
  );
}

export function LoginAccessPanel() {
  const { signIn, switchDevUser } = useAuth();
  const { show } = useToast();
  const [, navigate] = useLocation();
  const [signingInAs, setSigningInAs] = useState<string | null>(null);

  const handleMicrosoftClick = () => {
    show(MICROSOFT_UNAVAILABLE_MESSAGE, 'info');
  };

  const handleDevSignIn = async (user: AuthUser) => {
    setSigningInAs(user.login);
    try {
      if (switchDevUser) {
        await switchDevUser(user);
      } else {
        await signIn();
      }
      navigate('/organizacoes');
    } catch {
      show('Não foi possível entrar no ambiente de teste. Confira se o backend está rodando.', 'error');
    } finally {
      setSigningInAs(null);
    }
  };

  return (
    <div className="mt-8 max-w-md rounded-[var(--radius-card)] border border-orbita-border/60 bg-orbita-card p-6">
      <AppButton
        type="button"
        variant="ghost"
        className="h-[var(--size-control-height-lg)] w-full justify-between rounded-[var(--radius-control)] bg-white px-4 text-[14px] font-semibold text-orbita-bg hover:bg-slate-100"
        onClick={handleMicrosoftClick}
      >
        <span className="flex items-center gap-3">
          <MicrosoftMark />
          Entrar com Microsoft
        </span>
        <AppIcon name="arrowRight" size={16} />
      </AppButton>

      <div className="mt-4">
        <AppDisclosure
          label={
            <>
              <span className="rounded-[var(--radius-pill)] bg-orbita-elevated p-1.5">
                <AppIcon name="flask" size={14} tone="muted" />
              </span>
              <span className="text-[13px] font-semibold text-white">Ambiente de teste</span>
            </>
          }
        >
          <div className="rounded-[var(--radius-control)] border border-orbita-border/60 bg-orbita-surface p-3">
            <div className="grid gap-2">
              {SIMULATION_USERS.map(({ user, role }) => (
                <AppButton
                  key={user.id}
                  type="button"
                  variant="secondary"
                  className="w-full justify-between px-3 text-left"
                  onClick={() => void handleDevSignIn(user)}
                  disabled={signingInAs !== null}
                >
                  <span className="min-w-0">
                    <span className="block truncate">
                      {signingInAs === user.login ? 'Entrando...' : `Simulação ${user.name}`}
                    </span>
                    <span className="block truncate text-[11px] font-normal text-orbita-text-muted">
                      {role}
                    </span>
                  </span>
                  <AppIcon name="arrowRight" size={16} />
                </AppButton>
              ))}
            </div>
          </div>
        </AppDisclosure>
      </div>

      <div className="mt-6 flex items-center gap-3 text-[11px] text-orbita-text-faint">
        <span className="h-px flex-1 bg-orbita-border" />
        Acesso seguro • SSO corporativo
        <span className="h-px flex-1 bg-orbita-border" />
      </div>
    </div>
  );
}
