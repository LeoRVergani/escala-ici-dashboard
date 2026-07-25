import { createPortal } from 'react-dom';
import type { ShiftCode } from '@/domain/schedule';
import { SHIFT_STYLES } from './ShiftBadge';

interface DragPreviewProps {
  shiftCode: ShiftCode;
  customText?: string;
  position: { x: number; y: number } | null;
}

/** Small badge that follows the pointer while a cell drag is in progress. */
export function DragPreview({ shiftCode, customText, position }: DragPreviewProps) {
  if (!position) return null;
  const style = SHIFT_STYLES[shiftCode];
  const label = shiftCode === 'custom' && customText ? customText : style.label;
  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: position.x + 12,
        top: position.y + 12,
        background: style.background,
        color: style.color,
        zIndex: 2000,
      }}
      className="pointer-events-none grid h-6 min-w-[32px] place-items-center rounded-[var(--radius-pill)] px-1.5 text-[11px] font-bold opacity-90 shadow-[var(--shadow-overlay)]"
    >
      {label}
    </div>,
    document.body,
  );
}
