import { useRef, useState } from 'react';
import type { Member } from '@/domain/member';
import type { Assignment, ShiftCode } from '@/domain/schedule';
import type { ScheduleType } from '@/domain/team';
import { ShiftBadge } from './ShiftBadge';
import { ScheduleCell } from './ScheduleCell';
import { CellActionMenu } from './CellActionMenu';
import { DragPreview } from './DragPreview';
import { ConflictIndicator } from './ConflictIndicator';
import { SHIFT_OPTIONS_BY_SCHEDULE_TYPE } from './shiftOptions';

interface ScheduleGridProps {
  members: Member[];
  dates: string[];
  scheduleType: ScheduleType;
  cellValue: (memberId: string, date: string) => Assignment | null;
  onApply: (memberIds: string[], dates: string[], shiftCode: ShiftCode, note?: string) => void;
  onClear: (memberIds: string[], dates: string[]) => void;
  onMove: (
    source: { memberId: string; date: string },
    target: { memberId: string; date: string },
    shiftCode: ShiftCode,
    note: string | undefined,
    keepSource: boolean,
  ) => void;
  warningsByMember?: Map<string, string>;
}

interface MenuState {
  x: number;
  y: number;
  memberIds: string[];
  dates: string[];
}

interface DragState {
  sourceMemberId: string;
  sourceDate: string;
  shiftCode: ShiftCode;
  note?: string;
  startX: number;
  startY: number;
  dragging: boolean;
}

const DRAG_THRESHOLD_PX = 4;

function dayLabel(date: string): string {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

function isWeekend(date: string): boolean {
  const d = new Date(`${date}T00:00:00`);
  return d.getDay() === 0 || d.getDay() === 6;
}

function cellKey(memberId: string, date: string): string {
  return `${memberId}__${date}`;
}

/** The schedule editing grid — collaborators × days, with click-to-open cell menu and pointer-based drag-and-drop. */
export function ScheduleGrid({
  members,
  dates,
  scheduleType,
  cellValue,
  onApply,
  onClear,
  onMove,
  warningsByMember,
}: ScheduleGridProps) {
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<{ memberId: string; date: string } | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [dragTargetKey, setDragTargetKey] = useState<string | null>(null);
  const [dragPointerPos, setDragPointerPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const options = SHIFT_OPTIONS_BY_SCHEDULE_TYPE[scheduleType];

  function rangeDates(a: string, b: string): string[] {
    const ia = dates.indexOf(a);
    const ib = dates.indexOf(b);
    if (ia === -1 || ib === -1) return [a];
    const [lo, hi] = ia < ib ? [ia, ib] : [ib, ia];
    return dates.slice(lo, hi + 1);
  }

  function handleCellClick(event: React.MouseEvent, memberId: string, date: string) {
    let nextSelection: Set<string>;
    if (event.shiftKey && anchor && anchor.memberId === memberId) {
      nextSelection = new Set(rangeDates(anchor.date, date).map((d) => cellKey(memberId, d)));
    } else if (event.ctrlKey || event.metaKey) {
      nextSelection = new Set(selection);
      const k = cellKey(memberId, date);
      if (nextSelection.has(k)) nextSelection.delete(k);
      else nextSelection.add(k);
      setAnchor({ memberId, date });
    } else {
      nextSelection = new Set([cellKey(memberId, date)]);
      setAnchor({ memberId, date });
    }
    setSelection(nextSelection);

    const memberIds = [...new Set([...nextSelection].map((k) => k.split('__')[0]))];
    const selectedDates = [...new Set([...nextSelection].map((k) => k.split('__')[1]))];
    setMenu({ x: event.clientX, y: event.clientY, memberIds, dates: selectedDates });
  }

  function findCellUnderPointer(clientX: number, clientY: number): { memberId: string; date: string } | null {
    const el = document.elementFromPoint(clientX, clientY);
    const cellEl = el?.closest<HTMLElement>('[data-member-id][data-date]');
    if (!cellEl) return null;
    return { memberId: cellEl.dataset.memberId!, date: cellEl.dataset.date! };
  }

  function handlePointerDown(event: React.PointerEvent, memberId: string, date: string) {
    const assignment = cellValue(memberId, date);
    if (!assignment) return;
    dragRef.current = {
      sourceMemberId: memberId,
      sourceDate: date,
      shiftCode: assignment.shiftCode,
      note: assignment.note,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
  }

  function handlePointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      drag.dragging = true;
    }
    if (drag.dragging) {
      const target = findCellUnderPointer(event.clientX, event.clientY);
      setDragTargetKey(target ? cellKey(target.memberId, target.date) : null);
      setDragPointerPos({ x: event.clientX, y: event.clientY });
    }
  }

  function handlePointerUp(event: React.PointerEvent, memberId: string, date: string) {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragTargetKey(null);
    setDragPointerPos(null);
    if (!drag) return;

    if (!drag.dragging) {
      handleCellClick(event as unknown as React.MouseEvent, memberId, date);
      return;
    }

    const target = findCellUnderPointer(event.clientX, event.clientY);
    if (!target) return; // invalid drop target: no changes

    const sameRow = target.memberId === drag.sourceMemberId;
    const copyMode = event.ctrlKey || event.altKey || event.metaKey;

    if (sameRow && event.shiftKey) {
      const fillDates = rangeDates(drag.sourceDate, target.date);
      onApply([drag.sourceMemberId], fillDates, drag.shiftCode, drag.note);
    } else if (sameRow && target.date === drag.sourceDate) {
      // dropped back on the source cell: no-op
    } else if (sameRow) {
      onMove(
        { memberId: drag.sourceMemberId, date: drag.sourceDate },
        { memberId: target.memberId, date: target.date },
        drag.shiftCode,
        drag.note,
        copyMode,
      );
    } else {
      onMove(
        { memberId: drag.sourceMemberId, date: drag.sourceDate },
        { memberId: target.memberId, date: target.date },
        drag.shiftCode,
        drag.note,
        true,
      );
    }
  }

  const usedShiftCodes = new Set<ShiftCode>();
  for (const member of members) {
    for (const date of dates) {
      const a = cellValue(member.id, date);
      if (a) usedShiftCodes.add(a.shiftCode);
    }
  }

  const activeDrag = dragRef.current;

  return (
    <div className="overflow-auto rounded-[var(--radius-card)] border border-orbita-border/60 bg-orbita-card">
      <table role="grid" className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-20 min-w-[220px] border-b border-r border-orbita-border/60 bg-orbita-card px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-orbita-text-faint">
              Colaborador
            </th>
            {dates.map((date) => (
              <th
                key={date}
                className={`sticky top-0 z-10 min-w-[64px] border-b border-orbita-border/60 px-2 py-3 text-center text-[12px] font-medium text-orbita-text-muted ${isWeekend(date) ? 'bg-orbita-elevated/40' : 'bg-orbita-card'}`}
              >
                {dayLabel(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td className="sticky left-0 z-10 border-b border-r border-orbita-border/60 bg-orbita-card px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-orbita-elevated text-[11px] font-bold text-white">
                    {member.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[13px] font-medium text-white">{member.name}</p>
                      {warningsByMember?.has(member.id) && (
                        <ConflictIndicator message={warningsByMember.get(member.id)!} />
                      )}
                    </div>
                    <p className="truncate text-[11px] text-orbita-text-faint">{member.corporateLogin}</p>
                  </div>
                </div>
              </td>
              {dates.map((date) => {
                const assignment = cellValue(member.id, date);
                const k = cellKey(member.id, date);
                return (
                  <ScheduleCell
                    key={date}
                    memberId={member.id}
                    date={date}
                    assignment={assignment}
                    selected={selection.has(k)}
                    dragTarget={dragTargetKey === k}
                    weekend={isWeekend(date)}
                    onPointerDown={(e) => handlePointerDown(e, member.id, date)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(e) => handlePointerUp(e, member.id, date)}
                    onClick={(e) => {
                      if (dragRef.current) return; // handled by pointerup
                      handleCellClick(e, member.id, date);
                    }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {usedShiftCodes.size > 0 && (
        <div className="flex flex-wrap gap-3 border-t border-orbita-border/60 px-4 py-3">
          {[...usedShiftCodes].map((code) => (
            <div key={code} className="flex items-center gap-1.5 text-[11px] text-orbita-text-muted">
              <ShiftBadge shiftCode={code} />
            </div>
          ))}
        </div>
      )}
      {menu && (
        <CellActionMenu
          anchor={{ x: menu.x, y: menu.y }}
          options={options}
          selectionCount={selection.size}
          onSelect={(shift, customText) => {
            onApply(menu.memberIds, menu.dates, shift, customText);
            setMenu(null);
          }}
          onClear={() => {
            onClear(menu.memberIds, menu.dates);
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}
      {activeDrag && (
        <DragPreview shiftCode={activeDrag.shiftCode} customText={activeDrag.note} position={dragPointerPos} />
      )}
    </div>
  );
}
