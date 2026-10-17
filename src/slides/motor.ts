// Motor de slides: transforma uma missa em slides prontos para desenhar.
//
// Regras:
// - cada bloco (estrofe, refrão, aviso...) começa num slide novo;
// - todos os slides de texto usam o mesmo tamanho de fonte, o maior em que
//   todos os blocos cabem (com um mínimo legível);
// - bloco que não cabe nem no tamanho mínimo é dividido em mais slides;
// - refrão em negrito, repetido onde for cantado.

import { HEX_COR } from '../liturgia/calendario.ts';
import type { ItemBiblioteca, Missa, Momento } from '../modelo/tipos.ts';
import { dataPorExtenso } from '../util/datas.ts';
import type { Medidor } from './medidor.ts';
import { dividirTrecho, escolherTamanho, FATOR_ALTURA_LINHA, quebrarTexto, type Caixa, type Trecho } from './quebra.ts';
import { ALTURA, LARGURA, type Elemento, type ElementoTexto, type Linha, type Slide } from './tipos.ts';

export const FAIXA = 36;
const MARGEM_X = 120;
const MARGEM_TOPO = 80;
const MARGEM_BASE = 80 + FAIXA;
export const CAIXA_CORPO: Caixa = { w: LARGURA - 2 * MARGEM_X, h: ALTURA - MARGEM_TOPO - MARGEM_BASE };

const BRANCO = '#FFFFFF';
const CINZA = '#BDBDBD';

export interface ContextoMotor {
  medir: Medidor;
  item: (id: string) => ItemBiblioteca | undefined;
}

interface TextoTitulo {
  texto: string;
  tamanho: number;
  negrito: boolean;
  cor: string;
}

type Plano =
  | { tipo: 'titulo'; momentoId: string; linhas: TextoTitulo[]; comImagem: boolean }
  | { tipo: 'corpo'; momentoId: string; trecho: Trecho };

/** Divide "verso um / verso dois" em linhas. */
function linhasDaBarra(texto: string, negrito: boolean, italico = false): Linha[] {
  return texto
    .split(/\s+\/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ texto: t, negrito, italico }));
}

/** Blocos na ordem de canto do momento (ou do item, se o momento não mudou a ordem). */
export function blocosNaOrdem(item: ItemBiblioteca, momento?: Momento) {
  const porId = new Map(item.blocos.map((b) => [b.id, b]));
  const ordem = momento?.ordem ?? item.ordem;
  const lista = ordem.map((id) => porId.get(id)).filter((b) => b !== undefined);
  return lista.length > 0 ? lista : item.blocos;
}

function planoDoMomento(missa: Missa, momento: Momento, ctx: ContextoMotor): Plano[] {
  const id = momento.id;
  const comImagem = Boolean(missa.capa);
  const titulo = (...linhas: TextoTitulo[]): Plano => ({ tipo: 'titulo', momentoId: id, linhas, comImagem });
  const pequeno = (texto: string): TextoTitulo => ({ texto, tamanho: 44, negrito: false, cor: CINZA });
  const grande = (texto: string): TextoTitulo => ({ texto, tamanho: 80, negrito: true, cor: BRANCO });
  const medio = (texto: string): TextoTitulo => ({ texto, tamanho: 56, negrito: false, cor: BRANCO });

  switch (momento.tipo) {
    case 'capa':
      return [
        titulo(
          { texto: missa.celebracao, tamanho: 88, negrito: true, cor: BRANCO },
          { texto: dataPorExtenso(missa.data), tamanho: 48, negrito: false, cor: CINZA },
        ),
      ];

    case 'canto':
    case 'texto': {
      const item = momento.itemId ? ctx.item(momento.itemId) : undefined;
      if (!item) return [];
      const planos: Plano[] = [];
      const abertura = momento.tipo === 'canto' && !momento.semAbertura;
      if (abertura) planos.push(titulo(pequeno(momento.nome), grande(item.titulo)));
      for (const bloco of blocosNaOrdem(item, momento)) {
        const negrito = bloco.tipo === 'refrao';
        planos.push({ tipo: 'corpo', momentoId: id, trecho: { linhas: bloco.linhas.map((texto) => ({ texto, negrito })) } });
      }
      return planos;
    }

    case 'leitura': {
      const l = momento.leitura;
      if (!l) return [titulo(grande(momento.nome))];
      if (l.tipo === 'aclamacao') {
        const linhas: Linha[] = [];
        if (l.aclamacao.trim()) linhas.push(...linhasDaBarra(l.aclamacao, true));
        if (l.versiculo.trim()) linhas.push(...linhasDaBarra(l.versiculo, false));
        if (linhas.length === 0) return [titulo(grande(momento.nome))];
        return [{ tipo: 'corpo', momentoId: id, trecho: { linhas } }];
      }
      if (l.tipo === 'salmo') {
        const planos: Plano[] = [];
        const ref = l.referencia.trim() ? `Salmo ${l.referencia.trim()}` : '';
        planos.push(titulo(...[pequeno(l.rotulo || momento.nome), ...(ref ? [medio(ref)] : [])]));
        if (l.refrao.trim()) planos.push({ tipo: 'corpo', momentoId: id, trecho: { linhas: linhasDaBarra(l.refrao, true) } });
        return planos;
      }
      const linhas = [pequeno(l.rotulo || momento.nome)];
      if (l.titulo.trim()) linhas.push({ texto: l.titulo.trim(), tamanho: 64, negrito: true, cor: BRANCO });
      if (l.referencia.trim()) linhas.push(medio(l.referencia.trim()));
      return [titulo(...linhas)];
    }

    case 'avisos': {
      const paragrafos = (momento.avisos ?? '')
        .replace(/\r\n?/g, '\n')
        .split(/\n\s*\n/)
        .map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean))
        .filter((p) => p.length > 0);
      if (paragrafos.length === 0) return [];
      return [
        titulo(grande(momento.nome || 'Avisos')),
        ...paragrafos.map((p): Plano => ({
          tipo: 'corpo',
          momentoId: id,
          trecho: { linhas: p.map((texto) => ({ texto, negrito: false })) },
        })),
      ];
    }
  }
}

function fundoComImagem(missa: Missa): Elemento[] {
  if (!missa.capa) return [];
  return [
    {
      tipo: 'imagem',
      x: 0,
      y: 0,
      w: LARGURA,
      h: ALTURA,
      src: missa.capa.src,
      larguraOriginal: missa.capa.largura,
      alturaOriginal: missa.capa.altura,
    },
    { tipo: 'retangulo', x: 0, y: 0, w: LARGURA, h: ALTURA, cor: '#000000', opacidade: 0.55 },
  ];
}

function faixa(missa: Missa): Elemento {
  return { tipo: 'retangulo', x: 0, y: ALTURA - FAIXA, w: LARGURA, h: FAIXA, cor: HEX_COR[missa.liturgia.cor] };
}

/** Empilha títulos centralizados; diminui as fontes se não couberem. */
function elementosTitulo(linhas: TextoTitulo[], medir: Medidor): ElementoTexto[] {
  const caixa = CAIXA_CORPO;
  for (let passo = 20; passo >= 10; passo--) {
    const escala = passo / 20;
    const partes = linhas.map((l) => {
      const tamanho = Math.round(l.tamanho * escala);
      const quebradas = quebrarTexto(l.texto, caixa.w, tamanho, l.negrito, medir);
      return { l, tamanho, quebradas, altura: quebradas.length * tamanho * FATOR_ALTURA_LINHA };
    });
    const espaco = 24 * escala;
    const total = partes.reduce((s, p) => s + p.altura, 0) + espaco * (partes.length - 1);
    const muitasLinhas = partes.some((p) => p.quebradas.length > 3);
    if (passo > 10 && (total > caixa.h || muitasLinhas)) continue;
    let y = MARGEM_TOPO + (caixa.h - total) / 2;
    return partes.map((p) => {
      const el: ElementoTexto = {
        tipo: 'texto',
        x: MARGEM_X,
        y,
        w: caixa.w,
        h: p.altura,
        linhas: p.quebradas.map((texto) => ({ texto, negrito: p.l.negrito })),
        tamanho: p.tamanho,
        alturaLinha: p.tamanho * FATOR_ALTURA_LINHA,
        cor: p.l.cor,
        alinhamento: 'centro',
        vertical: 'meio',
      };
      y += p.altura + espaco;
      return el;
    });
  }
  return [];
}

export interface ResultadoMotor {
  slides: Slide[];
  /** Tamanho de fonte usado nos slides de texto (px na tela 1920×1080). */
  tamanhoCorpo: number;
}

export function gerarSlides(missa: Missa, ctx: ContextoMotor): ResultadoMotor {
  const planos = missa.momentos.flatMap((m) => planoDoMomento(missa, m, ctx));
  const trechos = planos.filter((p) => p.tipo === 'corpo').map((p) => p.trecho);
  const tamanho = escolherTamanho(trechos, CAIXA_CORPO, ctx.medir);

  const slides: Slide[] = [];
  const contador = new Map<string, number>();
  const novo = (momentoId: string, elementos: Elemento[]) => {
    const indice = contador.get(momentoId) ?? 0;
    contador.set(momentoId, indice + 1);
    slides.push({ momentoId, indice, fundo: '#000000', elementos: [...elementos, faixa(missa)] });
  };

  for (const plano of planos) {
    if (plano.tipo === 'titulo') {
      const fundo = plano.comImagem ? fundoComImagem(missa) : [];
      novo(plano.momentoId, [...fundo, ...elementosTitulo(plano.linhas, ctx.medir)]);
      continue;
    }
    for (const pagina of dividirTrecho(plano.trecho, CAIXA_CORPO, tamanho, ctx.medir)) {
      novo(plano.momentoId, [
        {
          tipo: 'texto',
          x: MARGEM_X,
          y: MARGEM_TOPO,
          w: CAIXA_CORPO.w,
          h: CAIXA_CORPO.h,
          linhas: pagina,
          tamanho,
          alturaLinha: tamanho * FATOR_ALTURA_LINHA,
          cor: BRANCO,
          alinhamento: 'centro',
          vertical: 'meio',
        },
      ]);
    }
  }
  return { slides, tamanhoCorpo: tamanho };
}
