// Quebra de linha, escolha de um tamanho de fonte único e divisão de blocos em slides.

import type { Medidor } from './medidor.ts';
import type { Linha } from './tipos.ts';

export const FATOR_ALTURA_LINHA = 1.25;

export interface Caixa {
  w: number;
  h: number;
}

/** Um bloco de texto que deveria caber num slide (ex.: uma estrofe, o refrão, um aviso). */
export interface Trecho {
  linhas: Linha[];
}

/** Quebra uma linha em várias para caber na largura. Palavras longas demais são cortadas. */
export function quebrarTexto(texto: string, largura: number, tamanho: number, negrito: boolean, medir: Medidor): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return [''];
  const saida: string[] = [];
  let atual = '';
  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (medir(tentativa, tamanho, negrito) <= largura) {
      atual = tentativa;
      continue;
    }
    if (atual) saida.push(atual);
    if (medir(palavra, tamanho, negrito) <= largura) {
      atual = palavra;
    } else {
      // Palavra maior que a linha inteira: corta por letras.
      let pedaco = '';
      for (const letra of palavra) {
        if (medir(pedaco + letra, tamanho, negrito) > largura && pedaco) {
          saida.push(pedaco);
          pedaco = letra;
        } else {
          pedaco += letra;
        }
      }
      atual = pedaco;
    }
  }
  if (atual) saida.push(atual);
  return saida;
}

/** Linhas visuais (já quebradas) de cada linha original. */
export function quebrarLinhas(linhas: Linha[], largura: number, tamanho: number, medir: Medidor): Linha[][] {
  return linhas.map((l) =>
    quebrarTexto(l.texto, largura, tamanho, l.negrito, medir).map((texto) => ({ ...l, texto })),
  );
}

export function capacidade(caixa: Caixa, tamanho: number): number {
  return Math.max(1, Math.floor(caixa.h / (tamanho * FATOR_ALTURA_LINHA)));
}

export function cabe(trecho: Trecho, caixa: Caixa, tamanho: number, medir: Medidor): boolean {
  const total = quebrarLinhas(trecho.linhas, caixa.w, tamanho, medir).reduce((s, v) => s + v.length, 0);
  return total <= capacidade(caixa, tamanho);
}

export interface OpcoesTamanho {
  maximo: number;
  minimo: number;
  passo: number;
}

export const TAMANHOS_PADRAO: OpcoesTamanho = { maximo: 88, minimo: 56, passo: 4 };

/**
 * Escolhe o maior tamanho em que todos os trechos cabem, cada um no seu slide.
 * Se nem no mínimo couberem, devolve o mínimo (e os trechos grandes serão divididos).
 */
export function escolherTamanho(
  trechos: Trecho[],
  caixa: Caixa,
  medir: Medidor,
  opcoes: OpcoesTamanho = TAMANHOS_PADRAO,
): number {
  for (let t = opcoes.maximo; t >= opcoes.minimo; t -= opcoes.passo) {
    if (trechos.every((tr) => cabe(tr, caixa, t, medir))) return t;
  }
  return opcoes.minimo;
}

/**
 * Divide um trecho em páginas que caibam na caixa, preferindo quebrar entre linhas
 * originais e equilibrando o tamanho das páginas.
 */
export function dividirTrecho(trecho: Trecho, caixa: Caixa, tamanho: number, medir: Medidor): Linha[][] {
  const grupos = quebrarLinhas(trecho.linhas, caixa.w, tamanho, medir);
  const total = grupos.reduce((s, g) => s + g.length, 0);
  const cap = capacidade(caixa, tamanho);
  if (total <= cap) return [grupos.flat()];

  const paginas = Math.ceil(total / cap);
  const alvo = Math.ceil(total / paginas);
  const resultado: Linha[][] = [];
  let atual: Linha[] = [];
  for (const grupo of grupos) {
    const passaDoAlvo = atual.length + grupo.length > alvo;
    const passaDaCapacidade = atual.length + grupo.length > cap;
    if (atual.length > 0 && (passaDoAlvo || passaDaCapacidade)) {
      resultado.push(atual);
      atual = [];
    }
    // Uma linha original que sozinha não cabe: corta pelas linhas visuais.
    if (grupo.length > cap) {
      for (let i = 0; i < grupo.length; i += cap) {
        const fatia = grupo.slice(i, i + cap);
        if (fatia.length === cap) resultado.push(fatia);
        else atual = fatia;
      }
      continue;
    }
    atual.push(...grupo);
  }
  if (atual.length > 0) resultado.push(atual);
  return resultado;
}
