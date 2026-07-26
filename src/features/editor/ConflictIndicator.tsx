import { AppTooltip } from '@/components/AppTooltip';
import { AppIcon } from '@/components/AppIcon';

interface ConflictIndicatorProps {
  message: string;
}

/** Small warning marker next to a collaborator's name when validateSchedule flags them. */
export function ConflictIndicator({ message }: ConflictIndicatorProps) {
  return (
    <AppTooltip label={message}>
      <span tabIndex={0} className="focus-ring grid h-4 w-4 shrink-0 place-items-center rounded-[var(--radius-pill)]">
        <AppIcon name="warning" size={14} tone="warning" decorative={false} label={`Alerta: ${message}`} />
      </span>
    </AppTooltip>
  );
}
