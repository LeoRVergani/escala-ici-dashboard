import { useId, type InputHTMLAttributes } from 'react';

export interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function AppInput({ label, error, id, className = '', ...props }: AppInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[12px] font-medium text-orbita-text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-errormessage={error ? `${inputId}-error` : undefined}
        className={`focus-ring w-full rounded-[var(--radius-control)] border bg-orbita-elevated px-3 py-2 text-[13px] text-white placeholder:text-orbita-text-faint disabled:opacity-40 ${
          error ? 'border-orbita-danger' : 'border-orbita-border'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-[12px] text-orbita-danger">
          {error}
        </p>
      )}
    </div>
  );
}
