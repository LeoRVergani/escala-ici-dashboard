import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useScheduleEditor } from './useScheduleEditor';
import { createId } from '@/domain/ids';
import type { Schedule } from '@/domain/schedule';

function buildSchedule(): Schedule {
  const now = new Date().toISOString();
  return {
    id: createId(),
    sectorId: 'sector-1',
    teamId: 'team-1',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-05',
    status: 'DRAFT',
    members: ['m1', 'm2'],
    assignments: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('useScheduleEditor', () => {
  it('applies a shift to a cell (scenario: escolha de turno altera célula)', () => {
    const { result } = renderHook(() => useScheduleEditor(buildSchedule()));
    act(() => result.current.setCells(['m1'], ['2026-07-01'], 'manha'));
    expect(result.current.cellValue('m1', '2026-07-01')?.shiftCode).toBe('manha');
  });

  it('undo restores the previous assignments (scenario: undo restaura)', () => {
    const { result } = renderHook(() => useScheduleEditor(buildSchedule()));
    act(() => result.current.setCells(['m1'], ['2026-07-01'], 'manha'));
    expect(result.current.cellValue('m1', '2026-07-01')).not.toBeNull();

    act(() => result.current.undo());
    expect(result.current.cellValue('m1', '2026-07-01')).toBeNull();
    expect(result.current.canUndo).toBe(false);
  });

  it('redo re-applies an undone change', () => {
    const { result } = renderHook(() => useScheduleEditor(buildSchedule()));
    act(() => result.current.setCells(['m1'], ['2026-07-01'], 'manha'));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.cellValue('m1', '2026-07-01')?.shiftCode).toBe('manha');
  });

  it('moveCell relocates a single assignment without duplicating or erasing data (scenario: drag-and-drop move atribuição)', () => {
    const { result } = renderHook(() => useScheduleEditor(buildSchedule()));
    act(() => result.current.setCells(['m1'], ['2026-07-01'], 'tarde'));

    act(() =>
      result.current.moveCell(
        { memberId: 'm1', date: '2026-07-01' },
        { memberId: 'm1', date: '2026-07-03' },
        'tarde',
        undefined,
        false,
      ),
    );

    expect(result.current.cellValue('m1', '2026-07-01')).toBeNull();
    expect(result.current.cellValue('m1', '2026-07-03')?.shiftCode).toBe('tarde');
  });

  it('moveCell in copy mode keeps the source cell intact', () => {
    const { result } = renderHook(() => useScheduleEditor(buildSchedule()));
    act(() => result.current.setCells(['m1'], ['2026-07-01'], 'noite'));

    act(() =>
      result.current.moveCell(
        { memberId: 'm1', date: '2026-07-01' },
        { memberId: 'm2', date: '2026-07-01' },
        'noite',
        undefined,
        true,
      ),
    );

    expect(result.current.cellValue('m1', '2026-07-01')?.shiftCode).toBe('noite');
    expect(result.current.cellValue('m2', '2026-07-01')?.shiftCode).toBe('noite');
  });

  it('clearCells removes only the targeted cells (scenario: drop inválido não altera dados, complementary unit check)', () => {
    const { result } = renderHook(() => useScheduleEditor(buildSchedule()));
    act(() => result.current.setCells(['m1'], ['2026-07-01', '2026-07-02'], 'manha'));
    act(() => result.current.clearCells(['m1'], ['2026-07-01']));

    expect(result.current.cellValue('m1', '2026-07-01')).toBeNull();
    expect(result.current.cellValue('m1', '2026-07-02')?.shiftCode).toBe('manha');
  });

  it('copyDay/pasteDay duplicates a day across members', () => {
    const { result } = renderHook(() => useScheduleEditor(buildSchedule()));
    act(() => result.current.setCells(['m1'], ['2026-07-01'], 'plantao'));
    act(() => result.current.copyDay('2026-07-01', ['m1']));
    act(() => result.current.pasteDay('2026-07-02', ['m1']));

    expect(result.current.cellValue('m1', '2026-07-02')?.shiftCode).toBe('plantao');
  });
});
