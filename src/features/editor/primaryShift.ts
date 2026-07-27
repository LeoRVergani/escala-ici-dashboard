import type { Assignment, ShiftCode } from '../../domain/schedule';

// O agrupamento visual deve ficar estavel durante a sessao de edicao:
// este calculo e pensado para rodar quando schedule/membros mudam de identidade.
// Nao ha precedente no KMP; turno predominante por pessoa e um design novo.
export type PrimaryShiftGroup = 'madrugada' | 'manha' | 'tarde' | 'noite' | 'sem-turno-definido';

const CANONICAL_SHIFT_ORDER = ['madrugada', 'manha', 'tarde', 'noite'] as const;

type CanonicalShiftCode = (typeof CANONICAL_SHIFT_ORDER)[number];

function isCanonicalShift(shiftCode: ShiftCode): shiftCode is CanonicalShiftCode {
  return CANONICAL_SHIFT_ORDER.includes(shiftCode as CanonicalShiftCode);
}

function emptyShiftCounts(): Record<CanonicalShiftCode, number> {
  return {
    madrugada: 0,
    manha: 0,
    tarde: 0,
    noite: 0,
  };
}

export function computePrimaryShiftByMember(
  memberIds: string[],
  assignments: Assignment[],
): Map<string, PrimaryShiftGroup> {
  const countsByMember = new Map<string, Record<CanonicalShiftCode, number>>();

  for (const memberId of memberIds) {
    countsByMember.set(memberId, emptyShiftCounts());
  }

  for (const assignment of assignments) {
    if (!isCanonicalShift(assignment.shiftCode)) continue;

    const counts = countsByMember.get(assignment.memberId);
    if (!counts) continue;

    counts[assignment.shiftCode] += 1;
  }

  const primaryShiftByMember = new Map<string, PrimaryShiftGroup>();

  for (const memberId of memberIds) {
    const counts = countsByMember.get(memberId) ?? emptyShiftCounts();
    let primaryShift: CanonicalShiftCode | null = null;
    let primaryShiftCount = 0;

    for (const shiftCode of CANONICAL_SHIFT_ORDER) {
      if (counts[shiftCode] > primaryShiftCount) {
        primaryShift = shiftCode;
        primaryShiftCount = counts[shiftCode];
      }
    }

    primaryShiftByMember.set(memberId, primaryShift ?? 'sem-turno-definido');
  }

  return primaryShiftByMember;
}

export function primaryShiftFor(
  memberId: string,
  memberIds: string[],
  assignments: Assignment[],
): PrimaryShiftGroup {
  return computePrimaryShiftByMember(memberIds, assignments).get(memberId) ?? 'sem-turno-definido';
}
