import { type OpcoesParse, type ResultadoParse } from './tipos';
/**
 * Converte a planilha de escala em documentos canônicos. Mesmo quando `ok` for
 * `false`, `documentos` vem preenchido para preview; quem chama não deve
 * persistir quando houver erros.
 */
export declare function parsePlanilhaEscala(arquivo: ArrayBuffer, opts: OpcoesParse): ResultadoParse;
