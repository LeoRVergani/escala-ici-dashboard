import { LoginAccessPanel } from './LoginAccessPanel';
import { LoginFlowSteps } from './LoginFlowSteps';
import { OrbitContextGraphic } from './OrbitContextGraphic';

export function LoginHero() {
  return (
    <main className="relative mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10 lg:pt-16">
      <div>
        <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-orbita-border bg-orbita-elevated px-3 py-1 text-[11px] font-semibold tracking-widest text-orbita-text-muted uppercase">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-orbita-blue" />
          Dashboard de gestão
        </span>

        <h1 className="mt-5 text-4xl leading-[1.05] font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Gestão de escalas,{' '}
          <span className="block text-orbita-blue">sem desvios.</span>
        </h1>

        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-orbita-text-muted sm:text-base">
          Entre para criar, revisar e publicar as escalas das suas equipes com contexto claro em cada decisão.
        </p>

        <LoginAccessPanel />
        <LoginFlowSteps />
      </div>

      <OrbitContextGraphic />
    </main>
  );
}
