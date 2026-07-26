import { AppIcon } from './AppIcon';

interface AppLoadingStateProps {
  label?: string;
}

/** "Carregando" pattern from the prototype's design-system section. */
export function AppLoadingState({ label = 'Carregando...' }: AppLoadingStateProps) {
  return (
    <p role="status" className="flex items-center gap-2 text-[13px] text-orbita-text-faint">
      <AppIcon name="loading" size={16} className="animate-spin" />
      {label}
    </p>
  );
}
