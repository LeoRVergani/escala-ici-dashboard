import { AppIcon } from '@/components/AppIcon';

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
        {tone === 'success' && <AppIcon name="check" size={14} tone="success" className="mr-1 inline-block align-[-2px]" />}
        {value}
      </p>
    </div>
  );
}
