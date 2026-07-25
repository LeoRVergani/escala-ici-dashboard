import type { OnCallRecord } from './types';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Regra operacional COSI:
 * - domingo a quinta: 19:00 até 07:00 do dia seguinte;
 * - sexta e sábado: 19:00 até 19:00 do dia seguinte.
 *
 * Portanto, em dias úteis o intervalo 07:00–19:00 não é contabilizado como
 * plantão, pois há equipe presencial no local.
 */
export function defaultOnCallRange(dateIso: string): { start: string; end: string; durationMinutes: number } {
  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (!dateIso.match(/^\d{4}-\d{2}-\d{2}$/) || Number.isNaN(date.getTime())) throw new Error(`Data de plantão inválida: ${dateIso}`);
  const weekday = date.getUTCDay();
  const isContinuousWeekendEntry = weekday === 5 || weekday === 6;
  date.setUTCDate(date.getUTCDate() + 1);
  const nextDate = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  return {
    start: `${dateIso}T19:00`,
    end: `${nextDate}T${isContinuousWeekendEntry ? '19:00' : '07:00'}`,
    durationMinutes: isContinuousWeekendEntry ? 24 * 60 : 12 * 60,
  };
}

/** Ajusta um registro importado à regra operacional, preservando pessoa e data de início. */
export function normalizeOnCallRecordToRule(record: OnCallRecord): OnCallRecord {
  const expected = defaultOnCallRange(record.start.slice(0, 10));
  return { ...record, ...expected };
}
