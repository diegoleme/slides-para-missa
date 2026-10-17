// PDF: cada slide é desenhado num canvas e vira uma página (imagem JPEG).

import type { Slide } from '../slides/tipos.ts';
import { desenharSlide, prepararImagens } from './canvas.ts';

const LARGURA_PDF = 1600;
const ALTURA_PDF = 900;

export async function gerarPdf(slides: Slide[], nomeArquivo: string, aoProgredir?: (feitos: number) => void): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [LARGURA_PDF, ALTURA_PDF], hotfixes: ['px_scaling'], compress: true });
  const imgs = await prepararImagens(slides);
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = LARGURA_PDF;
  canvas.height = ALTURA_PDF;

  for (const [i, slide] of slides.entries()) {
    desenharSlide(canvas, slide, imgs);
    if (i > 0) pdf.addPage([LARGURA_PDF, ALTURA_PDF], 'landscape');
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, LARGURA_PDF, ALTURA_PDF, undefined, 'FAST');
    aoProgredir?.(i + 1);
    // Deixa a tela respirar em missas longas.
    if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0));
  }
  pdf.save(`${nomeArquivo}.pdf`);
}
