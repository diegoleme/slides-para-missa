// Um slide é uma lista de elementos já posicionados numa tela virtual de 1920×1080.
// O .pptx, o PDF e a prévia desenham exatamente esses elementos (as quebras de linha
// já vêm calculadas), para que os três fiquem iguais.

export const LARGURA = 1920;
export const ALTURA = 1080;
export const FONTE = 'Tahoma';

export interface Linha {
  texto: string;
  negrito: boolean;
  italico?: boolean;
}

export interface ElementoTexto {
  tipo: 'texto';
  x: number;
  y: number;
  w: number;
  h: number;
  /** Linhas já quebradas. */
  linhas: Linha[];
  /** Tamanho da fonte em px da tela virtual (pt no .pptx = px / 2). */
  tamanho: number;
  alturaLinha: number;
  cor: string;
  alinhamento: 'esquerda' | 'centro';
  vertical: 'topo' | 'meio' | 'base';
}

export interface ElementoRetangulo {
  tipo: 'retangulo';
  x: number;
  y: number;
  w: number;
  h: number;
  cor: string;
  /** 0 a 1 */
  opacidade?: number;
}

export interface ElementoImagem {
  tipo: 'imagem';
  x: number;
  y: number;
  w: number;
  h: number;
  /** data URL */
  src: string;
  /** Tamanho original, para recortar no modo "cobrir". */
  larguraOriginal: number;
  alturaOriginal: number;
}

export type Elemento = ElementoTexto | ElementoRetangulo | ElementoImagem;

export interface Slide {
  /** Momento que gerou o slide (para "clicar na miniatura leva ao item"). */
  momentoId: string;
  /** Posição dentro do momento (0, 1, 2...). */
  indice: number;
  fundo: string;
  elementos: Elemento[];
}
