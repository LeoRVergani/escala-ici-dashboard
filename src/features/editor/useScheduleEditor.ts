import { useCallback, useRef, useState } from 'react';
import type { Assignment, Schedule, ShiftCode } from '@/domain/schedule';

type DayClipboard = { kind: 'day'; date: string; values: Record<string, { shiftCode: ShiftCode; note?: string } | undefined> };
type WeekClipboard = {
  kind: 'week';
  startDate: string;
  dates: string[];
  values: Record<string, ({ shiftCode: ShiftCode; note?: string } | undefined)[]>;
};
type Clipboard = DayClipboard | WeekClipboard | null;

function cloneAssignments(assignments: Assignment[]): Assignment[] {
  return assignments.map((a) => ({ ...a }));
}

export function useScheduleEditor(initial: Schedule) {
  const [schedule, setSchedule] = useState<Schedule>(initial);
  const [, forceRender] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [clipboard, setClipboard] = useState<Clipboard>(null);

  // All mutation logic reads/writes these refs synchronously so multiple
  // operations issued within the same event handler (e.g. undo immediately
  // followed by redo, or a drag-and-drop move) always compose correctly —
  // no stale closures from React's batched/functional setState.
  const assignmentsRef = useRef<Assignment[]>(initial.assignments);
  const undoStackRef = useRef<Assignment[][]>([]);
  const redoStackRef = useRef<Assignment[][]>([]);

  const applyAssignments = useCallback((next: Assignment[]) => {
    undoStackRef.current = [...undoStackRef.current, cloneAssignments(assignmentsRef.current)];
    redoStackRef.current = [];
    assignmentsRef.current = next;
    setSchedule((s) => ({ ...s, assignments: next, updatedAt: new Date().toISOString() }));
    setDirty(true);
    forceRender((n) => n + 1);
  }, []);

  const setCells = useCallback(
    (memberIds: string[], dates: string[], shiftCode: ShiftCode, note?: string) => {
      const memberSet = new Set(memberIds);
      const dateSet = new Set(dates);
      const next = assignmentsRef.current.filter(
        (a) => !(memberSet.has(a.memberId) && dateSet.has(a.date)),
      );
      for (const memberId of memberIds) {
        for (const date of dates) {
          next.push({ scheduleId: schedule.id, memberId, date, shiftCode, note });
        }
      }
      applyAssignments(next);
    },
    [applyAssignments, schedule.id],
  );

  const clearCells = useCallback(
    (memberIds: string[], dates: string[]) => {
      const memberSet = new Set(memberIds);
      const dateSet = new Set(dates);
      const next = assignmentsRef.current.filter(
        (a) => !(memberSet.has(a.memberId) && dateSet.has(a.date)),
      );
      applyAssignments(next);
    },
    [applyAssignments],
  );

  /** Atomically relocates a single assignment from one cell to another (used by drag-and-drop). */
  const moveCell = useCallback(
    (
      source: { memberId: string; date: string },
      target: { memberId: string; date: string },
      shiftCode: ShiftCode,
      note: string | undefined,
      keepSource: boolean,
    ) => {
      const current = assignmentsRef.current;
      const next = current.filter(
        (a) =>
          !(a.memberId === target.memberId && a.date === target.date) &&
          !(!keepSource && a.memberId === source.memberId && a.date === source.date),
      );
      next.push({ scheduleId: schedule.id, memberId: target.memberId, date: target.date, shiftCode, note });
      applyAssignments(next);
    },
    [applyAssignments, schedule.id],
  );

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const previous = undoStackRef.current[undoStackRef.current.length - 1];
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, cloneAssignments(assignmentsRef.current)];
    assignmentsRef.current = previous;
    setSchedule((s) => ({ ...s, assignments: previous }));
    setDirty(true);
    forceRender((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current[redoStackRef.current.length - 1];
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    undoStackRef.current = [...undoStackRef.current, cloneAssignments(assignmentsRef.current)];
    assignmentsRef.current = next;
    setSchedule((s) => ({ ...s, assignments: next }));
    setDirty(true);
    forceRender((n) => n + 1);
  }, []);

  const cellValue = useCallback(
    (memberId: string, date: string) =>
      schedule.assignments.find((a) => a.memberId === memberId && a.date === date) ?? null,
    [schedule.assignments],
  );

  const copyDay = useCallback((date: string, memberIds: string[]) => {
    const values: DayClipboard['values'] = {};
    for (const memberId of memberIds) {
      const a = assignmentsRef.current.find((x) => x.memberId === memberId && x.date === date);
      values[memberId] = a ? { shiftCode: a.shiftCode, note: a.note } : undefined;
    }
    setClipboard({ kind: 'day', date, values });
  }, []);

  const pasteDay = useCallback(
    (targetDate: string, memberIds: string[]) => {
      if (!clipboard || clipboard.kind !== 'day') return;
      const memberSet = new Set(memberIds);
      const next = assignmentsRef.current.filter(
        (a) => !(memberSet.has(a.memberId) && a.date === targetDate),
      );
      for (const memberId of memberIds) {
        const value = clipboard.values[memberId];
        if (value) {
          next.push({ scheduleId: schedule.id, memberId, date: targetDate, ...value });
        }
      }
      applyAssignments(next);
    },
    [applyAssignments, clipboard, schedule.id],
  );

  const copyWeek = useCallback((startDate: string, memberIds: string[]) => {
    const dates = weekDates(startDate);
    const values: WeekClipboard['values'] = {};
    for (const memberId of memberIds) {
      values[memberId] = dates.map((date) => {
        const a = assignmentsRef.current.find((x) => x.memberId === memberId && x.date === date);
        return a ? { shiftCode: a.shiftCode, note: a.note } : undefined;
      });
    }
    setClipboard({ kind: 'week', startDate, dates, values });
  }, []);

  const pasteWeek = useCallback(
    (targetStartDate: string, memberIds: string[]) => {
      if (!clipboard || clipboard.kind !== 'week') return;
      const targetDates = weekDates(targetStartDate);
      const memberSet = new Set(memberIds);
      const targetDateSet = new Set(targetDates);
      const next = assignmentsRef.current.filter(
        (a) => !(memberSet.has(a.memberId) && targetDateSet.has(a.date)),
      );
      for (const memberId of memberIds) {
        const values = clipboard.values[memberId] ?? [];
        targetDates.forEach((date, index) => {
          const value = values[index];
          if (value) next.push({ scheduleId: schedule.id, memberId, date, ...value });
        });
      }
      applyAssignments(next);
    },
    [applyAssignments, clipboard, schedule.id],
  );

  return {
    schedule,
    setSchedule,
    dirty,
    setDirty,
    cellValue,
    setCells,
    clearCells,
    moveCell,
    undo,
    redo,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    copyDay,
    pasteDay,
    copyWeek,
    pasteWeek,
    hasClipboard: clipboard !== null,
  };
}

function weekDates(startDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  for (let i = 0; i < 7; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + i);
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }
  return dates;
}
