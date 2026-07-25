import { AppTooltip } from '@/components/AppTooltip';

interface ConflictIndicatorProps {
  message: string;
}

/** Small warning marker next to a collaborator's name when validateSchedule flags them. */
export function ConflictIndicator({ message }: ConflictIndicatorProps) {
  return (
    <AppTooltip label={message}>
      <span
        role="img"
        aria-label={`Alerta: ${message}`}
        tabIndex={0}
        className="focus-ring grid h-4 w-4 shrink-0 place-items-center rounded-[var(--radius-pill)] text-[11px] text-orbita-warning"
      >
        ⚠
      </span>
    </AppTooltip>
  );
}
