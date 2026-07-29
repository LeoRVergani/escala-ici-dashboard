/**
 * @vitest-environment node
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as XLSX from 'xlsx';
import { beforeAll, describe, expect, it } from 'vitest';
import { formatarMinutos, parsePlanilhaEscala } from '../src';
import { CATALOGO_SOC, LOGINS_SOC } from './catalogo';
const testDir = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(testDir, 'fixtures', 'Escala-SOC-Controle-Agosto.xls');
const baseOpts = {
    equipeId: 'soc',
    competencia: '2026-08',
    catalogo: CATALOGO_SOC,
    loginParaUid: LOGINS_SOC,
};
async function fixtureArrayBuffer() {
    const buffer = await readFile(fixturePath);
    const arrayBuffer = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(arrayBuffer).set(buffer);
    return arrayBuffer;
}
async function parseFixture(opts = baseOpts) {
    return parsePlanilhaEscala(await fixtureArrayBuffer(), opts);
}
function doc(result, login) {
    const found = result.documentos.find((documento) => documento.login === login);
    if (!found)
        throw new Error(`Documento ${login} nao encontrado.`);
    return found;
}
function toArrayBuffer(value) {
    if (value instanceof ArrayBuffer)
        return value;
    if (ArrayBuffer.isView(value)) {
        const source = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        const arrayBuffer = new ArrayBuffer(source.byteLength);
        new Uint8Array(arrayBuffer).set(source);
        return arrayBuffer;
    }
    throw new Error('SheetJS nao retornou ArrayBuffer.');
}
function cellText(ws, row, col) {
    const address = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = ws[address];
    if (typeof cell !== 'object' || cell === null)
        return '';
    const value = cell.v;
    return value === undefined ? '' : String(value).trim();
}
function locateCell(ws, wanted) {
    const ref = ws['!ref'];
    if (!ref)
        throw new Error('Worksheet sem !ref.');
    const range = XLSX.utils.decode_range(ref);
    for (let row = range.s.r; row <= range.e.r; row += 1) {
        for (let col = range.s.c; col <= range.e.c; col += 1) {
            if (cellText(ws, row, col) === wanted)
                return { row, col };
        }
    }
    throw new Error(`Celula ${wanted} nao encontrada.`);
}
function locateTextInColumn(ws, wanted, col, startRow) {
    const ref = ws['!ref'];
    if (!ref)
        throw new Error('Worksheet sem !ref.');
    const range = XLSX.utils.decode_range(ref);
    for (let row = startRow; row <= range.e.r; row += 1) {
        if (cellText(ws, row, col) === wanted)
            return row;
    }
    throw new Error(`Texto ${wanted} nao encontrado na coluna ${col}.`);
}
async function workbookMutado(mutate) {
    const wb = XLSX.read(await fixtureArrayBuffer(), { type: 'array', cellDates: false });
    mutate(wb);
    return toArrayBuffer(XLSX.write(wb, { type: 'array', bookType: 'xls' }));
}
describe('parsePlanilhaEscala', () => {
    it('parseia a fixture SOC completa conforme contrato', async () => {
        const result = await parseFixture();
        expect(result.ok).toBe(true);
        expect(result.erros).toEqual([]);
        expect(result.equipeNome).toBe('SOC - Escala 6');
        expect(result.periodoInicio).toBe('2026-07-26');
        expect(result.periodoFim).toBe('2026-08-25');
        expect(result.totalDias).toBe(31);
        expect(result.documentos).toHaveLength(9);
        expect(result.documentos.filter((d) => d.turnoPadrao === 'MD').map((d) => d.login)).toEqual([
            'aleilima',
            'ivcarvalho',
        ]);
        expect(result.documentos.filter((d) => d.turnoPadrao === 'M').map((d) => d.login)).toEqual([
            'alamancio',
            'altaborda',
            'lvergani',
        ]);
        expect(result.documentos.filter((d) => d.turnoPadrao === 'T').map((d) => d.login)).toEqual([
            'cestradioto',
            'thaisvribeiro',
        ]);
        expect(result.documentos.filter((d) => d.turnoPadrao === 'N').map((d) => d.login)).toEqual([
            'dschlottag',
            'luizneto',
        ]);
        const aleilima = doc(result, 'aleilima');
        expect(aleilima.dias['2026-07-26']?.c).toBe('DF');
        expect(aleilima.dias['2026-07-27']).toEqual({
            c: 'MD',
            i: '01:00',
            f: '07:00',
            m: 360,
            vd: false,
            seq: 1,
        });
        expect(aleilima.dias['2026-08-20']?.c).toBe('DU');
        expect(aleilima.totais.diasTrabalhados).toBe(25);
        expect(aleilima.totais.min).toBe(9000);
        expect(formatarMinutos(aleilima.totais.min)).toBe('150:00');
        expect(aleilima.totais.df).toBe(5);
        expect(aleilima.totais.du).toBe(1);
        expect(aleilima.totais.diasTrabalhados + aleilima.totais.df + aleilima.totais.du).toBe(31);
        const ivcarvalho = doc(result, 'ivcarvalho');
        expect(ivcarvalho.dias['2026-07-30']?.c).toBe('DU');
        expect(ivcarvalho.totais.diasTrabalhados).toBe(26);
        expect(ivcarvalho.totais.min).toBe(9360);
        expect(formatarMinutos(ivcarvalho.totais.min)).toBe('156:00');
        expect(ivcarvalho.totais.df).toBe(4);
        expect(ivcarvalho.totais.du).toBe(1);
        expect(ivcarvalho.totais.diasTrabalhados + ivcarvalho.totais.df + ivcarvalho.totais.du).toBe(31);
        const alamancio = doc(result, 'alamancio');
        expect(alamancio.dias['2026-07-26']?.c).toBe('DF');
        const alamancioSemPrimeiroDia = Object.entries(alamancio.dias)
            .filter(([data]) => data !== '2026-07-26')
            .map(([, dia]) => dia.c);
        expect(alamancioSemPrimeiroDia).toHaveLength(30);
        expect(alamancioSemPrimeiroDia.every((codigo) => codigo === 'X')).toBe(true);
        expect(alamancio.totais.x).toBe(30);
        expect(alamancio.totais.df).toBe(1);
        expect(alamancio.totais.min).toBe(0);
        for (const documento of result.documentos) {
            expect(Object.keys(documento.dias)).toHaveLength(31);
        }
        for (const login of ['dschlottag', 'luizneto']) {
            const noite = doc(result, login);
            expect(Object.values(noite.dias).filter((dia) => dia.seq !== undefined).every((dia) => dia.vd === true)).toBe(true);
        }
        for (const login of ['aleilima', 'ivcarvalho', 'alamancio', 'altaborda', 'lvergani', 'cestradioto', 'thaisvribeiro']) {
            const documento = doc(result, login);
            expect(Object.values(documento.dias).filter((dia) => dia.seq !== undefined).every((dia) => dia.vd === false)).toBe(true);
        }
        expect(result.documentos.map((d) => d.login)).not.toEqual(expect.arrayContaining(['Domingo', 'Sábado', 'Semana', 'Legenda']));
        expect(result.documentos.map((d) => d.login)).not.toContain('Escala');
    });
    it('reporta valor desconhecido adulterado em memoria', async () => {
        const arquivo = await workbookMutado((wb) => {
            const ws = wb.Sheets.Escalistas;
            if (!ws)
                throw new Error('Escalistas ausente.');
            const colaborador = locateCell(ws, 'COLABORADOR');
            const loginRow = locateTextInColumn(ws, 'aleilima', colaborador.col, colaborador.row + 1);
            const data = locateCell(ws, '27/07');
            ws[XLSX.utils.encode_cell({ r: loginRow, c: data.col })] = { t: 's', v: 'ZZ' };
        });
        const result = parsePlanilhaEscala(arquivo, baseOpts);
        expect(result.ok).toBe(false);
        expect(result.erros).toHaveLength(1);
        expect(result.erros[0]).toMatchObject({
            linha: 6,
            coluna: 'E',
            login: 'aleilima',
            valorEncontrado: 'ZZ',
        });
    });
    it('reporta login ausente do mapa loginParaUid', async () => {
        const { ivcarvalho: _removed, ...loginParaUid } = LOGINS_SOC;
        const result = await parseFixture({ ...baseOpts, loginParaUid });
        expect(result.ok).toBe(false);
        expect(result.erros.some((erro) => erro.login === 'ivcarvalho' && erro.motivo.includes('loginParaUid'))).toBe(true);
        expect(doc(result, 'ivcarvalho').usuarioUid).toBe('');
    });
});
describe('assercoes obrigatorias da fixture SOC', () => {
    let result;
    beforeAll(async () => {
        result = await parseFixture();
    });
    it('extrai nome de equipe, periodo e total de dias', () => {
        expect(result.equipeNome).toBe('SOC - Escala 6');
        expect(result.periodoInicio).toBe('2026-07-26');
        expect(result.periodoFim).toBe('2026-08-25');
        expect(result.totalDias).toBe(31);
    });
    it('gera nove documentos validos', () => {
        expect(result.ok).toBe(true);
        expect(result.documentos).toHaveLength(9);
    });
    it('preenche os turnos padrao por colaborador', () => {
        expect(Object.fromEntries(result.documentos.map((documento) => [documento.login, documento.turnoPadrao]))).toMatchObject({
            aleilima: 'MD',
            ivcarvalho: 'MD',
            alamancio: 'M',
            altaborda: 'M',
            lvergani: 'M',
            cestradioto: 'T',
            thaisvribeiro: 'T',
            dschlottag: 'N',
            luizneto: 'N',
        });
    });
    it('parseia os dias chave de aleilima', () => {
        const aleilima = doc(result, 'aleilima');
        expect(aleilima.dias['2026-07-26']?.c).toBe('DF');
        expect(aleilima.dias['2026-07-27']).toEqual({
            c: 'MD',
            i: '01:00',
            f: '07:00',
            m: 360,
            vd: false,
            seq: 1,
        });
        expect(aleilima.dias['2026-08-20']?.c).toBe('DU');
    });
    it('parseia DU de ivcarvalho em 2026-07-30', () => {
        expect(doc(result, 'ivcarvalho').dias['2026-07-30']?.c).toBe('DU');
    });
    it('calcula ferias de alamancio no periodo', () => {
        const alamancio = doc(result, 'alamancio');
        expect(alamancio.dias['2026-07-26']?.c).toBe('DF');
        expect(Object.values(alamancio.dias).filter((dia) => dia.c === 'X')).toHaveLength(30);
        expect(alamancio.totais).toMatchObject({ x: 30, df: 1, min: 0 });
    });
    it('calcula totais de aleilima', () => {
        const totais = doc(result, 'aleilima').totais;
        expect(totais.diasTrabalhados).toBe(25);
        expect(totais.min).toBe(9000);
        expect(formatarMinutos(totais.min)).toBe('150:00');
        expect(totais.df).toBe(5);
        expect(totais.du).toBe(1);
    });
    it('calcula totais de ivcarvalho', () => {
        const totais = doc(result, 'ivcarvalho').totais;
        expect(totais.diasTrabalhados).toBe(26);
        expect(totais.min).toBe(9360);
        expect(formatarMinutos(totais.min)).toBe('156:00');
        expect(totais.df).toBe(4);
        expect(totais.du).toBe(1);
    });
    it('todo documento tem 31 chaves de dias', () => {
        expect(result.documentos.every((documento) => Object.keys(documento.dias).length === 31)).toBe(true);
    });
    it('marca viraDia apenas nos trabalhos do turno Noite', () => {
        expect(['dschlottag', 'luizneto'].every((login) => (Object.values(doc(result, login).dias).filter((dia) => dia.seq !== undefined).every((dia) => dia.vd === true)))).toBe(true);
        expect(['aleilima', 'ivcarvalho', 'alamancio', 'altaborda', 'lvergani', 'cestradioto', 'thaisvribeiro'].every((login) => (Object.values(doc(result, login).dias).filter((dia) => dia.seq !== undefined).every((dia) => dia.vd === false)))).toBe(true);
    });
    it('ignora resumo de folgas e legenda como documentos', () => {
        expect(result.documentos.map((documento) => documento.login)).not.toEqual(expect.arrayContaining(['Domingo', 'Sábado', 'Semana', 'Legenda']));
    });
    it('nao importa a aba derivada Escala', () => {
        expect(result.documentos.map((documento) => documento.login)).not.toContain('Escala');
    });
});
