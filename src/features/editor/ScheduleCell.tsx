import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { Assignment } from '@/domain/schedule';
import { ShiftBadge } from './ShiftBadge';
import { SelectionOverlay } from './SelectionOverlay';

interface ScheduleCellProps {
  memberId: string;
  date: string;
  assignment: Assignment | null;
  selected: boolean;
  dragTarget: boolean;
  weekend: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLTableCellElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLTableCellElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLTableCellElement>) => void;
  onClick: (event: ReactMouseEvent<HTMLTableCellElement>) => void;
}

/** A single day/collaborator grid cell — the schedule's smallest interactive unit. */
export function ScheduleCell({
  memberId,
  date,
  assignment,
  selected,
  dragTarget,
  weekend,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
}: ScheduleCellProps) {
  return (
    <td
      data-member-id={memberId}
      data-date={date}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
      className={`relative border-b border-orbita-border/30 px-1 py-1.5 text-center ${weekend ? 'bg-orbita-elevated/20' : ''}`}
    >
      <SelectionOverlay active={selected} variant="selected" />
      <SelectionOverlay active={dragTarget} variant="dragTarget" />
      <ShiftBadge shiftCode={assignment?.shiftCode} customText={assignment?.note} />
    </td>
  );
}
