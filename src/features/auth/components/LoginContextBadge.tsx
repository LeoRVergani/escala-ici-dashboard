import { Icon } from '@/design-system/icons';

interface LoginContextBadgeProps {
  eyebrow: string;
  value: string;
  tone?: 'default' | 'success';
  className?: string;
}

export function LoginContextBadge({ eyebrow, value, tone = 'default', className = '' }: LoginContextBadgeProps) {
  return (
    <div
      className={`pointer-events-none w-max rounded-[var(--radius-card-sm)] border border-orbita-border/70 bg-orbita-card/90 px-3 py-2 text-center shadow-[var(--shadow-overlay)] backdrop-blur ${className}`}
    >
      <p className="text-[10px] font-semibold tracking-widest text-orbita-text-faint uppercase">{eyebrow}</p>
      <p className={`text-[13px] font-semibold whitespace-nowrap ${tone === 'success' ? 'text-orbita-success' : 'text-white'}`}>
        {tone === 'success' && <span aria-hidden="true">{Icon.check} </span>}
        {value}
      </p>
    </div>
  );
}
