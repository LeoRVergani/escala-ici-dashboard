import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Member } from '@/domain/member';
import type { Assignment, ShiftCode } from '@/domain/schedule';
import { ScheduleGrid } from './ScheduleGrid';
import type { PrimaryShiftGroup } from './primaryShift';

const DATES = ['2026-01-01', '2026-01-02'];

const MEMBERS: Member[] = [
  { id: 'ana', teamId: 'team-1', name: 'Ana Silva', corporateLogin: 'ana.silva', active: true },
  { id: 'bia', teamId: 'team-1', name: 'Bia Costa', corporateLogin: 'bia.costa', active: true },
  { id: 'caio', teamId: 'team-1', name: 'Caio Lima', corporateLogin: 'caio.lima', active: true },
  { id: 'duda', teamId: 'team-1', name: 'Duda Reis', corporateLogin: 'duda.reis', active: true },
];

function renderGrid({
  members = MEMBERS,
  assignments = [],
  primaryShiftByMember,
  onApply = vi.fn(),
}: {
  members?: Member[];
  assignments?: Assignment[];
  primaryShiftByMember?: Map<string, PrimaryShiftGroup>;
  onApply?: (memberIds: string[], dates: string[], shiftCode: ShiftCode, note?: string) => void;
} = {}) {
  const cellValue = (memberId: string, date: string) =>
    assignments.find((assignment) => assignment.memberId === memberId && assignment.date === date) ?? null;

  const result = render(
    <ScheduleGrid
      members={members}
      dates={DATES}
      scheduleType="SOC_NOC_6X1"
      cellValue={cellValue}
      onApply={onApply}
      onClear={vi.fn()}
      onMove={vi.fn()}
      primaryShiftByMember={primaryShiftByMember}
    />,
  );

  return { ...result, onApply };
}

function tbodyRows(container: HTMLElement): HTMLTableRowElement[] {
  return Array.from(container.querySelectorAll('tbody tr'));
}

describe('ScheduleGrid', () => {
  it('renders the flat member list without group headers when primaryShiftByMember is absent', () => {
    const { container } = renderGrid();

    expect(screen.queryByText(/Madrugada \(/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Manhã \(/)).not.toBeInTheDocument();
    expect(tbodyRows(container)).toHaveLength(MEMBERS.length);
  });

  it('renders non-empty group headers in the fixed primary shift order', () => {
    const { container } = renderGrid({
      primaryShiftByMember: new Map([
        ['caio', 'sem-turno-definido'],
        ['bia', 'noite'],
        ['ana', 'madrugada'],
      ]),
      members: [MEMBERS[2], MEMBERS[1], MEMBERS[0]],
    });

    const groupRows = tbodyRows(container)
      .map((row) => row.textContent ?? '')
      .filter((text) => /Madrugada|Noite|Sem turno definido/.test(text));

    expect(groupRows).toHaveLength(3);
    expect(groupRows[0]).toContain('Madrugada (1)');
    expect(groupRows[1]).toContain('Noite (1)');
    expect(groupRows[2]).toContain('Sem turno definido (1)');
    expect(screen.queryByText(/Manhã \(/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tarde \(/)).not.toBeInTheDocument();
  });

  it('preserves the original member order inside a group', () => {
    const orderedMembers = [MEMBERS[1], MEMBERS[3], MEMBERS[0]];
    const { container } = renderGrid({
      members: orderedMembers,
      primaryShiftByMember: new Map([
        ['bia', 'manha'],
        ['duda', 'manha'],
        ['ana', 'noite'],
      ]),
    });

    const rows = tbodyRows(container).map((row) => row.textContent ?? '');
    expect(rows.findIndex((text) => text.includes('Bia Costa'))).toBeLessThan(
      rows.findIndex((text) => text.includes('Duda Reis')),
    );
  });

  it('shows the correct member count in group headers', () => {
    renderGrid({
      primaryShiftByMember: new Map([
        ['ana', 'tarde'],
        ['bia', 'tarde'],
        ['caio', 'sem-turno-definido'],
        ['duda', 'sem-turno-definido'],
      ]),
    });

    expect(screen.getByText(/Tarde \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Sem turno definido \(2\)/)).toBeInTheDocument();
  });

  it('keeps cell click assignment working when grouping is active', () => {
    const onApply = vi.fn();
    const { container } = renderGrid({
      onApply,
      primaryShiftByMember: new Map([['ana', 'madrugada']]),
      members: [MEMBERS[0]],
    });
    const cell = container.querySelector('[data-member-id="ana"][data-date="2026-01-01"]');

    expect(cell).not.toBeNull();
    fireEvent.click(cell!);
    fireEvent.click(screen.getByTitle('M'));

    expect(onApply).toHaveBeenCalledWith(['ana'], ['2026-01-01'], 'manha', undefined);
  });
});
