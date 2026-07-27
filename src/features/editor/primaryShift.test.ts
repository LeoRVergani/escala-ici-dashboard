import { describe, expect, it } from 'vitest';
import type { Assignment, ShiftCode } from '../../domain/schedule';
import { computePrimaryShiftByMember, primaryShiftFor } from './primaryShift';

function assignmentsFor(memberId: string, shiftCode: ShiftCode, count: number): Assignment[] {
  return Array.from({ length: count }, (_, index) => ({
    scheduleId: 'schedule-1',
    memberId,
    date: `2026-07-${String(index + 1).padStart(2, '0')}`,
    shiftCode,
  }));
}

describe('computePrimaryShiftByMember', () => {
  it('retorna manha quando ha predominancia clara sobre tarde', () => {
    const result = computePrimaryShiftByMember(['member-1'], [
      ...assignmentsFor('member-1', 'manha', 10),
      ...assignmentsFor('member-1', 'tarde', 2),
    ]);

    expect(result.get('member-1')).toBe('manha');
  });

  it('desempata dois turnos pela menor ordem canonica', () => {
    const result = computePrimaryShiftByMember(['member-1'], [
      ...assignmentsFor('member-1', 'manha', 5),
      ...assignmentsFor('member-1', 'tarde', 5),
    ]);

    expect(result.get('member-1')).toBe('manha');
  });

  it('desempata tres turnos com madrugada vencendo por vir primeiro', () => {
    const result = computePrimaryShiftByMember(['member-1'], [
      ...assignmentsFor('member-1', 'madrugada', 3),
      ...assignmentsFor('member-1', 'noite', 3),
      ...assignmentsFor('member-1', 'manha', 3),
    ]);

    expect(result.get('member-1')).toBe('madrugada');
  });

  it('retorna sem-turno-definido quando o membro tem apenas ferias e folga', () => {
    const result = computePrimaryShiftByMember(['member-1'], [
      ...assignmentsFor('member-1', 'ferias', 4),
      ...assignmentsFor('member-1', 'folga', 4),
    ]);

    expect(result.get('member-1')).toBe('sem-turno-definido');
  });

  it('retorna sem-turno-definido para membro sem nenhuma atribuicao', () => {
    const result = computePrimaryShiftByMember(['member-1'], []);

    expect(result.has('member-1')).toBe(true);
    expect(result.get('member-1')).toBe('sem-turno-definido');
  });

  it('ignora plantao, comercial, extra e custom ao escolher entre grupos canonicos', () => {
    const result = computePrimaryShiftByMember(['member-1'], [
      ...assignmentsFor('member-1', 'plantao', 8),
      ...assignmentsFor('member-1', 'comercial', 8),
      ...assignmentsFor('member-1', 'extra', 8),
      ...assignmentsFor('member-1', 'custom', 8),
      ...assignmentsFor('member-1', 'manha', 2),
    ]);

    expect(result.get('member-1')).toBe('manha');
  });

  it('retorna uma entrada para todos os memberIds quando assignments esta vazio', () => {
    const result = computePrimaryShiftByMember(['member-1', 'member-2', 'member-3'], []);

    expect([...result.entries()]).toEqual([
      ['member-1', 'sem-turno-definido'],
      ['member-2', 'sem-turno-definido'],
      ['member-3', 'sem-turno-definido'],
    ]);
  });
});

describe('primaryShiftFor', () => {
  it('delega para computePrimaryShiftByMember e retorna o mesmo resultado da chave no Map', () => {
    const memberIds = ['member-1', 'member-2'];
    const assignments = [
      ...assignmentsFor('member-1', 'noite', 4),
      ...assignmentsFor('member-1', 'tarde', 1),
      ...assignmentsFor('member-2', 'manha', 3),
    ];

    const byMember = computePrimaryShiftByMember(memberIds, assignments);

    expect(primaryShiftFor('member-1', memberIds, assignments)).toBe(byMember.get('member-1'));
    expect(primaryShiftFor('member-2', memberIds, assignments)).toBe(byMember.get('member-2'));
  });
});
