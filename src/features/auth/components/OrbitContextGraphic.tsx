import { LoginContextBadge } from './LoginContextBadge';
import { LoginInfoCallout } from './LoginInfoCallout';

const PROGRESS_STEPS = ['Importar', 'Revisar', 'Publicar'];

/** Decorative context graphic — purely illustrative, never blocks interaction with the access panel. */
export function OrbitContextGraphic() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[440px] select-none">
      <div className="relative mx-auto hidden aspect-square w-full lg:block">
        <div className="absolute inset-0 rounded-full border border-orbita-border/40" />
        <div className="absolute inset-[12%] rounded-full border border-orbita-border/50" />
        <div className="absolute inset-[24%] rounded-full border border-orbita-border/60" />
        <div className="absolute inset-[32%] rounded-full bg-gradient-to-br from-orbita-blue/20 to-orbita-violet-dark/20 blur-[30px]" />

        <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-orbita-blue to-orbita-violet-dark shadow-[var(--shadow-overlay)]">
          <span className="text-[13px] font-bold text-white">ICI</span>
        </div>

        <LoginContextBadge eyebrow="Área" value="COSI" className="absolute left-[4%] top-[8%]" />
        <LoginContextBadge eyebrow="Equipe" value="SOC" className="absolute right-[4%] top-[8%]" />
        <LoginContextBadge
          eyebrow="Estado"
          value="Pronta para publicar"
          tone="success"
          className="absolute left-1/2 top-[64%] -translate-x-1/2"
        />

        {/* Anchored to the circle itself (not the progress line below it), so it never overlaps the IMPORTAR/REVISAR/PUBLICAR labels. */}
        <div className="absolute -bottom-10 -right-8 max-w-[240px]">
          <LoginInfoCallout />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 lg:hidden">
        <LoginContextBadge eyebrow="Área" value="COSI" />
        <LoginContextBadge eyebrow="Equipe" value="SOC" />
        <LoginContextBadge eyebrow="Estado" value="Pronta para publicar" tone="success" />
      </div>

      <div className="mt-8 lg:mt-16">
        <div className="h-1 rounded-[var(--radius-pill)] bg-gradient-to-r from-orbita-blue via-orbita-warning to-orbita-success" />
        <div className="mt-2 flex justify-between text-[10px] font-semibold tracking-widest text-orbita-text-faint uppercase">
          {PROGRESS_STEPS.map((step) => (
            <span key={step} className={step === 'Revisar' ? 'text-white' : undefined}>
              {step}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-[280px] lg:hidden">
        <LoginInfoCallout />
      </div>
    </div>
  );
}
