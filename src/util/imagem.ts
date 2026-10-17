import type { ImagemCapa } from '../modelo/tipos.ts';

const LARGURA = 1600;
const ALTURA = 900;

/**
 * Lê a imagem escolhida, recorta no centro em 16:9 e reduz para 1600×900 (JPEG).
 * Assim ela ocupa pouco espaço no navegador e cobre o slide inteiro sem distorcer.
 */
export async function prepararCapa(arquivo: File): Promise<ImagemCapa> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((resolver, rejeitar) => {
      const i = new Image();
      i.onload = () => resolver(i);
      i.onerror = () => rejeitar(new Error('Este arquivo não parece ser uma imagem.'));
      i.src = url;
    });
    const proporcao = LARGURA / ALTURA;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    let sx = 0;
    let sy = 0;
    if (sw / sh > proporcao) {
      sw = sh * proporcao;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = sw / proporcao;
      sy = (img.naturalHeight - sh) / 2;
    }
    const canvas = document.createElement('canvas');
    canvas.width = LARGURA;
    canvas.height = ALTURA;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('O navegador não conseguiu processar a imagem.');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, LARGURA, ALTURA);
    return { src: canvas.toDataURL('image/jpeg', 0.82), largura: LARGURA, altura: ALTURA };
  } finally {
    URL.revokeObjectURL(url);
  }
}
