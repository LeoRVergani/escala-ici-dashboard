export type AppBadgeTone = 'success' | 'warning' | 'attention' | 'info' | 'neutral';

interface AppBadgeProps {
  tone?: AppBadgeTone;
  dot?: boolean;
  children: React.ReactNode;
}

const TONE_CLASSES: Record<AppBadgeTone, string> = {
  success: 'bg-orbita-success/10 text-orbita-success border-orbita-success/30',
  warning: 'bg-orbita-warning/10 text-orbita-warning border-orbita-warning/30',
  attention: 'bg-orbita-warning/10 text-orbita-warning border-orbita-warning/30',
  info: 'bg-orbita-blue/10 text-orbita-blue border-orbita-blue/40',
  neutral: 'bg-orbita-elevated text-orbita-text-muted border-orbita-border',
};

const DOT_CLASSES: Record<AppBadgeTone, string> = {
  success: 'bg-orbita-success',
  warning: 'bg-orbita-warning',
  attention: 'bg-orbita-warning',
  info: 'bg-orbita-blue',
  neutral: 'bg-orbita-text-muted',
};

export function AppBadge({ tone = 'neutral', dot = true, children }: AppBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-1 text-[11px] font-medium ${TONE_CLASSES[tone]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-[var(--radius-pill)] ${DOT_CLASSES[tone]}`} />}
      {children}
    </span>
  );
}
