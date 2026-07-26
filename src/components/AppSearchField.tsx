import type { InputHTMLAttributes } from 'react';
import { AppIcon } from './AppIcon';

export interface AppSearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function AppSearchField({ onClear, value, className = '', ...props }: AppSearchFieldProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
        <AppIcon name="search" size={16} tone="muted" />
      </span>
      <input
        type="search"
        value={value}
        role="searchbox"
        className="focus-ring w-full rounded-[var(--radius-control)] border border-orbita-border bg-orbita-elevated py-2 pl-9 pr-8 text-[13px] text-white placeholder:text-orbita-text-faint disabled:opacity-40"
        {...props}
      />
      {onClear && typeof value === 'string' && value.length > 0 && (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={onClear}
          className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 text-orbita-text-faint hover:text-white"
        >
          <AppIcon name="close" size={14} decorative />
        </button>
      )}
    </div>
  );
}
