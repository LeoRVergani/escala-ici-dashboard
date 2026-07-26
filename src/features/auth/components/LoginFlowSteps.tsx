const STEPS = [
  { n: '01', label: 'Escolher equipe' },
  { n: '02', label: 'Revisar escala' },
  { n: '03', label: 'Publicar' },
];

export function LoginFlowSteps() {
  return (
    <ol className="mt-8 flex max-w-md flex-wrap items-baseline gap-x-8 gap-y-3 border-t border-orbita-border/60 pt-6">
      {STEPS.map((step) => (
        <li key={step.n} className="flex items-baseline gap-2 text-[13px]">
          <span className="font-semibold text-orbita-blue">{step.n}</span>
          <span className="text-orbita-text-muted">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
