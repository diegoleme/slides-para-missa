// Arquivo de cantos para exportar/importar (entre pessoas do ministério
// ou para incorporar à biblioteca do projeto).

import { NOMES_TEMPO, type Tempo } from '../liturgia/calendario.ts';
import { NOMES_ETIQUETA, type Bloco, type EtiquetaMomento, type ItemBiblioteca } from '../modelo/tipos.ts';
import { normalizar } from './busca.ts';

export const FORMATO = 'slides-para-missa/cantos';

export type DadosItem = Omit<ItemBiblioteca, 'id' | 'origem'>;

export interface ArquivoCantos {
  formato: typeof FORMATO;
  versao: 1;
  exportadoEm: string;
  itens: DadosItem[];
}

export function exportarItens(itens: ItemBiblioteca[]): ArquivoCantos {
  return {
    formato: FORMATO,
    versao: 1,
    exportadoEm: new Date().toISOString(),
    itens: itens.map(({ id: _id, origem: _origem, ...dados }) => dados),
  };
}

const texto = (v: unknown): v is string => typeof v === 'string';

function lerBloco(v: unknown): Bloco | null {
  if (!v || typeof v !== 'object') return null;
  const b = v as Record<string, unknown>;
  if (!texto(b.id) || (b.tipo !== 'refrao' && b.tipo !== 'estrofe') || !Array.isArray(b.linhas)) return null;
  const linhas = b.linhas.filter(texto).map((l) => l.trim()).filter(Boolean);
  return linhas.length > 0 ? { id: b.id, tipo: b.tipo, linhas } : null;
}

function lerItem(v: unknown): DadosItem | null {
  if (!v || typeof v !== 'object') return null;
  const i = v as Record<string, unknown>;
  if (!texto(i.titulo) || !i.titulo.trim() || !Array.isArray(i.blocos)) return null;
  const blocos = i.blocos.map(lerBloco).filter((b) => b !== null);
  if (blocos.length === 0) return null;
  const ids = new Set(blocos.map((b) => b.id));
  const ordem = Array.isArray(i.ordem) ? i.ordem.filter((id): id is string => texto(id) && ids.has(id)) : [];
  const momentos = Array.isArray(i.momentos)
    ? i.momentos.filter((m): m is EtiquetaMomento => texto(m) && m in NOMES_ETIQUETA)
    : [];
  const tempos = Array.isArray(i.tempos) ? i.tempos.filter((t): t is Tempo => texto(t) && t in NOMES_TEMPO) : [];
  const item: DadosItem = {
    categoria: i.categoria === 'texto' ? 'texto' : 'canto',
    titulo: i.titulo.trim(),
    blocos,
    ordem: ordem.length > 0 ? ordem : blocos.map((b) => b.id),
    momentos,
    tempos,
  };
  if (texto(i.autor) && i.autor.trim()) item.autor = i.autor.trim();
  if (texto(i.fonte) && i.fonte.trim()) item.fonte = i.fonte.trim();
  return item;
}

/** Lê um arquivo exportado. Lança erro com mensagem amigável se não for válido. */
export function lerArquivoCantos(conteudo: string): DadosItem[] {
  let dados: unknown;
  try {
    dados = JSON.parse(conteudo);
  } catch {
    throw new Error('Este arquivo não é um arquivo de cantos do Slides para Missa.');
  }
  const d = dados as Partial<ArquivoCantos> | null;
  if (!d || d.formato !== FORMATO || !Array.isArray(d.itens)) {
    throw new Error('Este arquivo não é um arquivo de cantos do Slides para Missa.');
  }
  return d.itens.map(lerItem).filter((i) => i !== null);
}

/** Chave para reconhecer o mesmo canto: título + primeira linha. */
export function chaveDoItem(item: Pick<ItemBiblioteca, 'titulo' | 'blocos'>): string {
  return normalizar(item.titulo) + '|' + normalizar(item.blocos[0]?.linhas[0] ?? '');
}

/** Separa os itens novos dos que já existem. */
export function separarNovos(itens: DadosItem[], existentes: Pick<ItemBiblioteca, 'titulo' | 'blocos'>[]) {
  const conhecidas = new Set(existentes.map(chaveDoItem));
  const novos: DadosItem[] = [];
  let repetidos = 0;
  for (const item of itens) {
    const k = chaveDoItem(item);
    if (conhecidas.has(k)) {
      repetidos++;
      continue;
    }
    conhecidas.add(k);
    novos.push(item);
  }
  return { novos, repetidos };
}

/** "Hino da Alegria (2)" → "hino-da-alegria-2" */
export function idDoTitulo(titulo: string, usados: Set<string>): string {
  const base = normalizar(titulo).replace(/\s+/g, '-') || 'canto';
  let id = base;
  for (let n = 2; usados.has(id); n++) id = `${base}-${n}`;
  usados.add(id);
  return id;
}
