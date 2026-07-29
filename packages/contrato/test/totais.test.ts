/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { idDocumento } from '../src/documentos';
import { calcularTotais } from '../src/totais';
import { formatarMinutos, montarChaveDia, normalizarCelula } from '../src/normalizar';
import { CATALOGO_SOC } from './catalogo';
import type { Dia } from '../src/tipos';

describe('normalizar e totais', () => {
  it('formata minutos sem rollover em 24h', () => {
    expect(formatarMinutos(28080)).toBe('468:00');
    expect(formatarMinutos(9360)).toBe('156:00');
  });

  it('monta chave ISO do dia em UTC', () => {
    expect(montarChaveDia(new Date(Date.UTC(2026, 7, 25)))).toBe('2026-08-25');
  });

  it('normaliza valores de celula para comparacao de aliases', () => {
    expect(normalizarCelula(' férias ')).toBe('FERIAS');
    expect(normalizarCelula('D S R')).toBe('DSR');
  });

  it('monta id deterministico de documento Firestore', () => {
    expect(idDocumento('EQ_SOC', 'u5', '2026-08')).toBe('EQ_SOC_u5_2026-08');
    expect(() => idDocumento('EQ/SOC', 'u5', '2026-08')).toThrow('equipeId');
  });

  it('calcula totais sempre do zero e de forma idempotente', () => {
    const dias: Record<string, Dia> = {
      '2026-07-26': { c: 'DF' },
      '2026-07-27': { c: 'MD', i: '01:00', f: '07:00', m: 360, vd: false, seq: 1 },
      '2026-07-28': { c: 'X' },
      '2026-07-29': { c: 'HE' },
      '2026-07-30': { c: 'BH' },
      '2026-07-31': { c: 'AN' },
      '2026-08-01': { c: 'FOLGA' },
      '2026-08-02': { c: 'AFA' },
      '2026-08-03': { c: 'DU' },
    };

    const primeira = calcularTotais(dias, CATALOGO_SOC);
    const segunda = calcularTotais(dias, CATALOGO_SOC);

    expect(primeira).toEqual(segunda);
    expect(primeira).toMatchObject({
      min: 360,
      diasTrabalhados: 1,
      df: 1,
      du: 1,
      x: 1,
      he: 1,
      bh: 1,
      an: 1,
      folga: 1,
      afa: 1,
    });
  });
});
