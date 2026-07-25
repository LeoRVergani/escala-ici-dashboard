import type { HTMLAttributes } from 'react';

export function AppCard({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-orbita-border/60 bg-orbita-card ${className}`}
      {...props}
    />
  );
}
