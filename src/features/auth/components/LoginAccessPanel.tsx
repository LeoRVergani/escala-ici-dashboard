import { useState } from 'react';
import { useLocation } from 'wouter';
import { AppButton } from '@/components/AppButton';
import { AppDisclosure } from '@/components/AppDisclosure';
import { useToast } from '@/components/AppToast';
import { useAuth } from '@/app/auth';
import { AppIcon } from '@/components/AppIcon';

const MICROSOFT_UNAVAILABLE_MESSAGE =
  'A integração Microsoft ainda não está configurada neste ambiente local.';

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
  const { signIn } = useAuth();
  const { show } = useToast();
  const [, navigate] = useLocation();
  const [signingIn, setSigningIn] = useState(false);

  const handleMicrosoftClick = () => {
    show(MICROSOFT_UNAVAILABLE_MESSAGE, 'info');
  };

  const handleDevSignIn = async () => {
    setSigningIn(true);
    try {
      await signIn();
      navigate('/organizacoes');
    } catch {
      show('Não foi possível entrar no ambiente de teste. Confira se o backend está rodando.', 'error');
    } finally {
      setSigningIn(false);
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
            <AppButton
              type="button"
              variant="secondary"
              className="w-full justify-between"
              onClick={handleDevSignIn}
              disabled={signingIn}
            >
              <span>{signingIn ? 'Entrando...' : 'Simulação'}</span>
              <AppIcon name="arrowRight" size={16} />
            </AppButton>
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
