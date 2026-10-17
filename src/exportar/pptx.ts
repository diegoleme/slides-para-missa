// .pptx com pptxgenjs. As quebras de linha já vêm do motor; aqui só posicionamos.
// Tela virtual 1920×1080 px = 13,333 × 7,5 pol (LAYOUT_WIDE). 1 px = 0,5 pt.

import type PptxGenJS from 'pptxgenjs';
import { ALTURA, FONTE, LARGURA, type Elemento, type Slide } from '../slides/tipos.ts';

const PX_POR_POL = LARGURA / 13.333;
const pol = (px: number) => px / PX_POR_POL;
const pt = (px: number) => px / 2;
const hex = (cor: string) => cor.replace('#', '').toUpperCase();

/** Folga lateral nas caixas de texto, para o PowerPoint não quebrar linhas que já quebramos. */
const FOLGA = 0.04;

function adicionarElemento(pptx: PptxGenJS, s: PptxGenJS.Slide, e: Elemento) {
  switch (e.tipo) {
    case 'retangulo':
      s.addShape(pptx.ShapeType.rect, {
        x: pol(e.x),
        y: pol(e.y),
        w: pol(e.w),
        h: pol(e.h),
        fill: { color: hex(e.cor), transparency: Math.round((1 - (e.opacidade ?? 1)) * 100) },
        line: { type: 'none' },
      });
      return;
    case 'imagem':
      s.addImage({ data: e.src.replace(/^data:/, ''), x: pol(e.x), y: pol(e.y), w: pol(e.w), h: pol(e.h) });
      return;
    case 'texto': {
      if (e.linhas.length === 0) return;
      const folga = Math.min(e.w * FOLGA, e.x, LARGURA - e.x - e.w);
      s.addText(
        e.linhas.map((l, i) => ({
          text: l.texto,
          options: { bold: l.negrito, italic: l.italico ?? false, breakLine: i < e.linhas.length - 1 },
        })),
        {
          x: pol(e.x - folga),
          y: pol(e.y),
          w: pol(e.w + 2 * folga),
          h: pol(Math.min(e.h, ALTURA - e.y)),
          fontFace: FONTE,
          fontSize: pt(e.tamanho),
          color: hex(e.cor),
          align: e.alinhamento === 'centro' ? 'center' : 'left',
          valign: e.vertical === 'meio' ? 'middle' : e.vertical === 'base' ? 'bottom' : 'top',
          lineSpacing: pt(e.alturaLinha),
          margin: 0,
          fit: 'none',
          wrap: true,
        },
      );
      return;
    }
  }
}

export async function gerarPptx(slides: Slide[], nomeArquivo: string, titulo: string): Promise<void> {
  const { default: Pptx } = await import('pptxgenjs');
  const pptx = new Pptx();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = titulo;
  pptx.company = 'Slides para Missa';
  pptx.theme = { headFontFace: FONTE, bodyFontFace: FONTE };

  for (const slide of slides) {
    const s = pptx.addSlide();
    s.background = { color: hex(slide.fundo) };
    for (const e of slide.elementos) adicionarElemento(pptx, s, e);
  }
  await pptx.writeFile({ fileName: `${nomeArquivo}.pptx` });
}
