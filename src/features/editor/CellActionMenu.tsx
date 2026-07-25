import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ShiftCode } from '@/domain/schedule';
import { SHIFT_STYLES } from './ShiftBadge';

interface CellActionMenuProps {
  anchor: { x: number; y: number };
  options: ShiftCode[];
  selectionCount: number;
  onSelect: (shift: ShiftCode, customText?: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const MARGIN = 8;

/**
 * Cell context menu — portaled to document.body with fixed positioning so it
 * is never clipped by the grid's scroll container, and viewport-clamped so it
 * never renders off-screen. Closes on Escape or an outside click.
 */
export function CellActionMenu({ anchor, options, selectionCount, onSelect, onClear, onClose }: CellActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(anchor);
  const [customText, setCustomText] = useState('');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - MARGIN;
    const maxY = window.innerHeight - rect.height - MARGIN;
    setPosition({
      x: Math.min(Math.max(anchor.x, MARGIN), Math.max(maxX, MARGIN)),
      y: Math.min(Math.max(anchor.y, MARGIN), Math.max(maxY, MARGIN)),
    });
    // Only recompute clamping when the anchor point itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor.x, anchor.y]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Ações da célula"
      data-testid="cell-menu"
      style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 1000 }}
      className="w-64 rounded-[var(--radius-card-sm)] border border-orbita-border bg-orbita-card p-3 shadow-[var(--shadow-overlay)]"
    >
      {selectionCount > 1 && (
        <p className="mb-2 text-[11px] text-orbita-text-faint">{selectionCount} células selecionadas</p>
      )}
      <div className="grid grid-cols-4 gap-2">
        {options
          .filter((o) => o !== 'custom')
          .map((option) => {
            const style = SHIFT_STYLES[option];
            return (
              <button
                key={option}
                role="menuitem"
                onClick={() => onSelect(option)}
                style={{ background: style.background, color: style.color }}
                className="focus-ring grid h-9 place-items-center rounded-[var(--radius-control)] text-[12px] font-bold"
                title={style.label}
              >
                {style.label}
              </button>
            );
          })}
      </div>
      {options.includes('custom') && (
        <div className="mt-3 flex gap-2">
          <input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Valor personalizado"
            className="focus-ring w-full rounded-[var(--radius-control)] border border-orbita-border bg-orbita-elevated px-2 py-1.5 text-[12px] text-white placeholder:text-orbita-text-faint"
          />
          <button
            role="menuitem"
            disabled={!customText.trim()}
            onClick={() => onSelect('custom', customText.trim())}
            className="focus-ring shrink-0 rounded-[var(--radius-control)] bg-orbita-elevated px-3 py-1.5 text-[12px] text-white disabled:opacity-40"
          >
            Aplicar
          </button>
        </div>
      )}
      <button
        role="menuitem"
        onClick={onClear}
        className="focus-ring mt-3 w-full rounded-[var(--radius-control)] border border-orbita-border px-3 py-1.5 text-[12px] text-orbita-text-muted hover:text-white"
      >
        Limpar célula
      </button>
    </div>,
    document.body,
  );
}
