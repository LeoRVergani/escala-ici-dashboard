import { useLocation } from 'wouter';
import { Brand } from '@/components/Brand';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { useAuth } from '@/app/auth';

export function LoginPage() {
  const { signIn } = useAuth();
  const [, navigate] = useLocation();

  const handleDevSignIn = async () => {
    await signIn();
    navigate('/setores');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-orbita-bg px-4">
      <div className="pointer-events-none absolute h-[320px] w-[320px] rounded-[var(--radius-pill)] bg-gradient-to-br from-orbita-blue/20 to-orbita-violet-dark/20 blur-[40px] md:h-[480px] md:w-[480px]" />
      <AppCard className="relative w-full max-w-[420px] p-8 text-center">
        <div className="flex justify-center">
          <Brand />
        </div>
        <h1 className="mt-6 text-[24px] font-bold text-white">Gestão de escalas</h1>
        <p className="mt-2 text-[14px] text-orbita-text-muted">
          Entre para criar, revisar e publicar as escalas das suas equipes.
        </p>

        <AppButton
          variant="primary"
          className="mt-6 w-full"
          disabled
          title="Disponível em um checkpoint futuro, após aprovação deste frontend"
        >
          <span className="grid h-5 w-5 place-items-center rounded bg-white text-[11px] font-bold text-orbita-blue">
            M
          </span>
          Entrar com Microsoft
        </AppButton>

        <AppButton variant="secondary" className="mt-3 w-full" onClick={handleDevSignIn}>
          Entrar no ambiente local
        </AppButton>

        <div className="mt-6 flex items-center gap-3 text-[11px] text-orbita-text-faint">
          <span className="h-px flex-1 bg-orbita-border" />
          Acesso seguro • SSO corporativo
          <span className="h-px flex-1 bg-orbita-border" />
        </div>
      </AppCard>
    </div>
  );
}
