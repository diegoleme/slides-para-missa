// Formato dos dados de leituras gravados pelo robô em public/data/leituras/AAAA-MM.json.
// Usado tanto pelo robô (scripts/leituras) quanto pelo app.

export type TipoLeitura = 'primeira' | 'salmo' | 'segunda' | 'evangelho' | 'outra';

export interface LeituraPaulus {
  tipo: TipoLeitura;
  /** Rótulo como aparece na Paulus, ex.: "Primeira Leitura". */
  rotulo: string;
  /** Ex.: "Efésios 1,11-14" ou "32(33)" no salmo. */
  referencia: string;
  /** Início do texto, ex.: "Leitura da carta de São Paulo aos Efésios". */
  titulo?: string;
  /** Refrão do salmo responsorial. */
  refrao?: string;
  /** Aclamação antes do Evangelho, ex.: "Aleluia, aleluia, aleluia." */
  aclamacao?: string;
  /** Versículo da aclamação. */
  versiculo?: string;
}

export interface DiaPaulus {
  /** Data civil (AAAA-MM-DD), no fuso de Brasília. */
  data: string;
  url: string;
  /** lastmod do sitemap; usado para saber se a página mudou. */
  modificadoEm: string;
  /** Cabeçalho da página, ex.: "1º – DOMINGO". */
  cabecalho: string;
  /** Nome da celebração, ex.: "TODOS OS SANTOS E SANTAS". */
  celebracao: string;
  /** Observação entre parênteses, ex.: "(branco, glória, creio, prefácio próprio)". */
  observacao?: string;
  /** Cor citada na observação, quando houver (ex.: "branco"). */
  cor?: string;
  leituras: LeituraPaulus[];
}

export interface ArquivoLeiturasMes {
  fonte: string;
  atualizadoEm: string;
  dias: Record<string, DiaPaulus>;
}
