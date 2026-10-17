// Desenha um slide num canvas. Usado na prévia, nas miniaturas e no PDF.

import { fonteCss } from '../slides/medidor.ts';
import { ALTURA, LARGURA, type Elemento, type Slide } from '../slides/tipos.ts';

const imagens = new Map<string, Promise<HTMLImageElement>>();

function carregarImagem(src: string): Promise<HTMLImageElement> {
  let p = imagens.get(src);
  if (!p) {
    p = new Promise((resolver, rejeitar) => {
      const img = new Image();
      img.onload = () => resolver(img);
      img.onerror = () => rejeitar(new Error('Não consegui abrir a imagem da capa.'));
      img.src = src;
    });
    imagens.set(src, p);
  }
  return p;
}

/** Carrega as imagens usadas pelos slides (antes de desenhar). */
export async function prepararImagens(slides: Slide[]): Promise<Map<string, HTMLImageElement>> {
  const fontes = new Set<string>();
  for (const s of slides) for (const e of s.elementos) if (e.tipo === 'imagem') fontes.add(e.src);
  const mapa = new Map<string, HTMLImageElement>();
  await Promise.all(
    [...fontes].map(async (src) => {
      try {
        mapa.set(src, await carregarImagem(src));
      } catch {
        // Sem a imagem, o slide sai só com fundo preto.
      }
    }),
  );
  return mapa;
}

function desenharElemento(ctx: CanvasRenderingContext2D, e: Elemento, imgs: Map<string, HTMLImageElement>) {
  switch (e.tipo) {
    case 'retangulo':
      ctx.globalAlpha = e.opacidade ?? 1;
      ctx.fillStyle = e.cor;
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.globalAlpha = 1;
      return;
    case 'imagem': {
      const img = imgs.get(e.src);
      if (img) ctx.drawImage(img, e.x, e.y, e.w, e.h);
      return;
    }
    case 'texto': {
      ctx.fillStyle = e.cor;
      ctx.textBaseline = 'middle';
      ctx.textAlign = e.alinhamento === 'centro' ? 'center' : 'left';
      const alturaTotal = e.linhas.length * e.alturaLinha;
      const topo =
        e.vertical === 'meio' ? e.y + (e.h - alturaTotal) / 2 : e.vertical === 'base' ? e.y + e.h - alturaTotal : e.y;
      const x = e.alinhamento === 'centro' ? e.x + e.w / 2 : e.x;
      e.linhas.forEach((linha, i) => {
        ctx.font = fonteCss(e.tamanho, linha.negrito, linha.italico);
        ctx.fillText(linha.texto, x, topo + e.alturaLinha * (i + 0.5));
      });
      return;
    }
  }
}

/** Desenha o slide ocupando o canvas inteiro (qualquer tamanho 16:9). */
export function desenharSlide(canvas: HTMLCanvasElement, slide: Slide, imgs: Map<string, HTMLImageElement>): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.setTransform(canvas.width / LARGURA, 0, 0, canvas.height / ALTURA, 0, 0);
  ctx.fillStyle = slide.fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  for (const e of slide.elementos) desenharElemento(ctx, e, imgs);
  ctx.restore();
}
