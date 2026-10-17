// Cadastro de canto a partir da letra colada: blocos, refrão e ordem de canto.

import type { Bloco, ItemBiblioteca } from '../modelo/tipos.ts';

// "Refrão:", "Refrão", "Ref.", "R:", "R.", "R/" — mas não o "R" de "Ressuscitou".
const ROTULO_REFRAO = /^\s*(?:refr[ãa]o\b\s*[:.\-–]?|ref\.|r\s*[:./])\s*/i;
const NUMERACAO = /^\s*\d+\s*[.)\-–]\s+/;

/** Cada linha em branco separa um bloco. */
export function separarBlocos(letra: string): string[][] {
  return letra
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((b) => b.length > 0);
}

function chave(linhas: string[]): string {
  return linhas
    .join(' ')
    .replace(ROTULO_REFRAO, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Sugere quais blocos são refrão. Regras, em ordem:
 * 1) blocos marcados com "Refrão:", "R:" etc.;
 * 2) blocos que aparecem repetidos;
 * 3) se os demais blocos são numerados (1., 2.) e um não é, esse é o refrão.
 */
export function sugerirRefrao(blocos: string[][]): boolean[] {
  const comRotulo = blocos.map((b) => ROTULO_REFRAO.test(b[0]));
  if (comRotulo.some(Boolean)) return comRotulo;

  const contagem = new Map<string, number>();
  for (const b of blocos) contagem.set(chave(b), (contagem.get(chave(b)) ?? 0) + 1);
  const repetidos = blocos.map((b) => (contagem.get(chave(b)) ?? 0) > 1);
  if (repetidos.some(Boolean)) return repetidos;

  const numerados = blocos.map((b) => NUMERACAO.test(b[0]));
  const qtdNumerados = numerados.filter(Boolean).length;
  if (qtdNumerados >= 1 && qtdNumerados === blocos.length - 1) return numerados.map((n) => !n);

  return blocos.map(() => false);
}

function limparLinhas(linhas: string[], refrao: boolean): string[] {
  const copia = [...linhas];
  if (refrao) {
    copia[0] = copia[0].replace(ROTULO_REFRAO, '');
  } else {
    copia[0] = copia[0].replace(NUMERACAO, '');
  }
  return copia.filter((l) => l.trim().length > 0);
}

export interface BlocosEOrdem {
  blocos: Bloco[];
  ordem: string[];
}

/**
 * Monta blocos e ordem a partir dos blocos colados e da marcação de refrão.
 * Refrãos iguais viram o mesmo bloco. Se o refrão aparece uma só vez,
 * ele é repetido depois de cada estrofe (R · E1 · R · E2 · R).
 */
export function montarBlocos(colados: string[][], ehRefrao: boolean[]): BlocosEOrdem {
  const blocos: Bloco[] = [];
  const sequencia: string[] = [];
  const idPorChave = new Map<string, string>();
  let refraos = 0;
  let estrofes = 0;

  colados.forEach((linhas, i) => {
    const refrao = ehRefrao[i] ?? false;
    const k = (refrao ? 'r|' : 'e|') + chave(linhas);
    let id = idPorChave.get(k);
    if (!id) {
      if (refrao) {
        refraos++;
        id = refraos === 1 ? 'R' : `R${refraos}`;
      } else {
        estrofes++;
        id = `E${estrofes}`;
      }
      idPorChave.set(k, id);
      blocos.push({ id, tipo: refrao ? 'refrao' : 'estrofe', linhas: limparLinhas(linhas, refrao) });
    }
    sequencia.push(id);
  });

  const umRefraoSo = refraos === 1 && sequencia.filter((id) => id === 'R').length === 1 && estrofes > 0;
  return { blocos, ordem: umRefraoSo ? ordemPadrao(blocos) : sequencia };
}

/** R · E1 · R · E2 · R (ou só E1 · E2 se não houver refrão). */
export function ordemPadrao(blocos: Bloco[]): string[] {
  const refrao = blocos.find((b) => b.tipo === 'refrao');
  const estrofes = blocos.filter((b) => b.tipo === 'estrofe').map((b) => b.id);
  if (!refrao) return estrofes;
  const ordem = [refrao.id];
  for (const e of estrofes) ordem.push(e, refrao.id);
  return ordem;
}

/** Texto colado → item de biblioteca (sem id, título nem etiquetas). */
export function itemDaLetra(letra: string, ehRefrao?: boolean[]): Pick<ItemBiblioteca, 'blocos' | 'ordem'> {
  const colados = separarBlocos(letra);
  return montarBlocos(colados, ehRefrao ?? sugerirRefrao(colados));
}

/** Volta o item para texto (para editar a letra). */
export function letraDoItem(item: Pick<ItemBiblioteca, 'blocos'>): string {
  return item.blocos
    .map((b) => (b.tipo === 'refrao' ? [`Refrão: ${b.linhas[0] ?? ''}`, ...b.linhas.slice(1)] : b.linhas).join('\n'))
    .join('\n\n');
}
