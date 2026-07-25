import type { ShiftCode } from '@/domain/schedule';

interface ShiftStyle {
  background: string;
  color: string;
  label: string;
}

// Md/M/T/N/Folga colors and pill shape copied verbatim from the approved prototype's
// inline styles. ferias/plantao/comercial/extra/afastamento/custom are not present in
// the prototype (it only demonstrates a SOC 6x1 schedule) and were assigned the closest
// unused tokens from the same palette so the full ShiftCode domain has a rendering —
// see docs/design/DESIGN-TOKENS.md.
export const SHIFT_STYLES: Record<ShiftCode, ShiftStyle> = {
  madrugada: { background: '#6D5CE7', color: '#FFFFFF', label: 'Md' },
  manha: { background: '#FFD21C', color: '#060B18', label: 'M' },
  tarde: { background: '#FF7A1A', color: '#FFFFFF', label: 'T' },
  noite: { background: '#2563EB', color: '#FFFFFF', label: 'N' },
  folga: { background: '#22C55E', color: '#060B18', label: 'Folga' },
  ferias: { background: '#8B5CF6', color: '#FFFFFF', label: 'Férias' },
  plantao: { background: '#1D4ED8', color: '#FFFFFF', label: 'Plantão' },
  comercial: { background: '#718096', color: '#FFFFFF', label: 'Comercial' },
  extra: { background: '#F5B82E', color: '#060B18', label: 'Extra' },
  afastamento: { background: '#EF4444', color: '#FFFFFF', label: 'Afast.' },
  custom: { background: '#122844', color: '#F8FAFC', label: 'Custom' },
};

interface ShiftBadgeProps {
  shiftCode: ShiftCode | null | undefined;
  customText?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/** Colored shift chip (Md/M/T/N/Folga…) — the grid cell's visual content. */
export function ShiftBadge({ shiftCode, customText, onClick }: ShiftBadgeProps) {
  if (!shiftCode) {
    return (
      <button
        onClick={onClick}
        className="focus-ring h-6 min-w-[32px] rounded-[var(--radius-pill)] border border-white/5 text-orbita-text-faint hover:bg-orbita-elevated"
        aria-label="Célula vazia"
      >
        —
      </button>
    );
  }
  const style = SHIFT_STYLES[shiftCode];
  const label = shiftCode === 'custom' && customText ? customText : style.label;
  return (
    <button
      onClick={onClick}
      style={{ background: style.background, color: style.color }}
      className="focus-ring grid h-6 min-w-[32px] place-items-center rounded-[var(--radius-pill)] border border-white/5 px-1.5 text-[11px] font-bold"
    >
      {label}
    </button>
  );
}
