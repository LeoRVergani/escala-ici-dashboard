import type { ReactNode } from 'react';

type AppAlertTone = 'error' | 'warning' | 'success' | 'info';

interface AppAlertProps {
  tone: AppAlertTone;
  children: ReactNode;
}

const TONE_CLASSES: Record<AppAlertTone, string> = {
  error: 'border-orbita-danger/40 bg-orbita-danger/10 text-orbita-danger',
  warning: 'border-orbita-warning/40 bg-orbita-warning/10 text-orbita-warning',
  success: 'border-orbita-success/40 bg-orbita-success/10 text-orbita-success',
  info: 'border-orbita-border bg-orbita-elevated text-orbita-text-muted',
};

const TONE_ICON: Record<AppAlertTone, string> = {
  error: '✕',
  warning: '⚠',
  success: '✓',
  info: 'ℹ',
};

const TONE_ROLE: Record<AppAlertTone, 'alert' | 'status'> = {
  error: 'alert',
  warning: 'alert',
  success: 'status',
  info: 'status',
};

/** Inline banner for validation errors/warnings/success/info — used in the review screen and the import dropzone. */
export function AppAlert({ tone, children }: AppAlertProps) {
  return (
    <div role={TONE_ROLE[tone]} className={`rounded-[var(--radius-control)] border px-3 py-2 text-[13px] ${TONE_CLASSES[tone]}`}>
      <span aria-hidden="true">{TONE_ICON[tone]}</span> {children}
    </div>
  );
}
