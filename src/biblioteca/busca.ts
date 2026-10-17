import type { Tempo } from '../liturgia/calendario.ts';
import type { EtiquetaMomento, ItemBiblioteca } from '../modelo/tipos.ts';

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface FiltroBusca {
  etiqueta?: EtiquetaMomento;
  tempo?: Tempo;
}

/** Busca por título ou trecho da letra, com filtro opcional de momento e de tempo litúrgico. */
export function buscar(itens: ItemBiblioteca[], termo: string, filtro: FiltroBusca = {}): ItemBiblioteca[] {
  const t = normalizar(termo);
  const resultado: { item: ItemBiblioteca; peso: number }[] = [];
  for (const item of itens) {
    if (filtro.etiqueta && filtro.etiqueta !== 'outro' && !item.momentos.includes(filtro.etiqueta)) continue;
    if (filtro.tempo && item.tempos.length > 0 && !item.tempos.includes(filtro.tempo)) continue;
    if (!t) {
      resultado.push({ item, peso: 0 });
      continue;
    }
    const titulo = normalizar(item.titulo);
    if (titulo.startsWith(t)) resultado.push({ item, peso: 3 });
    else if (titulo.includes(t)) resultado.push({ item, peso: 2 });
    else if (normalizar(item.blocos.map((b) => b.linhas.join(' ')).join(' ')).includes(t)) resultado.push({ item, peso: 1 });
  }
  return resultado
    .sort((a, b) => b.peso - a.peso || a.item.titulo.localeCompare(b.item.titulo, 'pt-BR'))
    .map((r) => r.item);
}
