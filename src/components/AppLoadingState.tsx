interface AppLoadingStateProps {
  label?: string;
}

/** "Carregando" pattern from the prototype's design-system section. */
export function AppLoadingState({ label = 'Carregando...' }: AppLoadingStateProps) {
  return (
    <p role="status" className="flex items-center gap-2 text-[13px] text-orbita-text-faint">
      <span className="animate-spin" aria-hidden="true">
        ◷
      </span>
      {label}
    </p>
  );
}
