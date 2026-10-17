import { FONTE } from './tipos.ts';

/** Mede a largura (px) de um texto num dado tamanho de fonte. */
export type Medidor = (texto: string, tamanho: number, negrito: boolean) => number;

/**
 * Medidor do navegador, com canvas e a fonte Tahoma.
 * Se a Tahoma não estiver instalada, o navegador usa Verdana ou outra sem serifa,
 * em geral mais larga: o texto quebra um pouco antes, o que é seguro.
 */
export function criarMedidorCanvas(): Medidor {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return medidorAproximado;
  const cache = new Map<string, number>();
  return (texto, tamanho, negrito) => {
    const chave = `${negrito ? 'b' : 'n'}|${texto}`;
    let larguraEm100 = cache.get(chave);
    if (larguraEm100 === undefined) {
      // Mede sempre em 100px e escala: a largura é proporcional ao tamanho.
      ctx.font = fonteCss(100, negrito);
      larguraEm100 = ctx.measureText(texto).width;
      cache.set(chave, larguraEm100);
    }
    return (larguraEm100 * tamanho) / 100;
  };
}

export function fonteCss(tamanho: number, negrito: boolean, italico = false): string {
  return `${italico ? 'italic ' : ''}${negrito ? 'bold ' : ''}${tamanho}px ${FONTE}, Verdana, sans-serif`;
}

/**
 * Aproximação sem canvas (testes e Node). Larguras médias da Tahoma,
 * arredondadas para cima para errar para o lado seguro.
 */
export const medidorAproximado: Medidor = (texto, tamanho, negrito) => {
  let soma = 0;
  for (const c of texto) {
    if (c === ' ') soma += 0.32;
    else if ('iljI.,;:!|\'’'.includes(c)) soma += 0.28;
    else if ('mwMW'.includes(c)) soma += 0.85;
    else if (c >= 'A' && c <= 'Z') soma += 0.68;
    else soma += 0.55;
  }
  return soma * tamanho * (negrito ? 1.08 : 1);
};
