import type { Dia, TipoTurno, Totais } from './tipos';

function criarTotaisVazios(): Totais {
  return {
    min: 0,
    diasTrabalhados: 0,
    df: 0,
    du: 0,
    x: 0,
    he: 0,
    bh: 0,
    an: 0,
    folga: 0,
    afa: 0,
  };
}

export function calcularTotais(
  dias: Record<string, Dia>,
  catalogo: Record<string, TipoTurno>,
): Totais {
  const totais = criarTotaisVazios();

  for (const dia of Object.values(dias)) {
    const minutos = dia.m ?? catalogo[dia.c]?.duracaoMinutos ?? 0;
    totais.min += minutos;
    if (minutos > 0 || dia.seq !== undefined || catalogo[dia.c]?.categoria === 'TRABALHO') {
      totais.diasTrabalhados += 1;
    }

    switch (dia.c) {
      case 'DF':
        totais.df += 1;
        break;
      case 'DU':
        totais.du += 1;
        break;
      case 'X':
        totais.x += 1;
        break;
      case 'HE':
        totais.he += 1;
        break;
      case 'BH':
        totais.bh += 1;
        break;
      case 'AN':
        totais.an += 1;
        break;
      case 'FOLGA':
        totais.folga += 1;
        break;
      case 'AFA':
        totais.afa += 1;
        break;
      default:
        break;
    }
  }

  return totais;
}
