import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';

export interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function AppSelect({ label, id, className = '', children, ...props }: AppSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-[12px] font-medium text-orbita-text-muted">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`focus-ring w-full rounded-[var(--radius-control)] border border-orbita-border bg-orbita-elevated px-3 py-2 text-[13px] text-white disabled:opacity-40 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
