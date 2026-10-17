import type { DiaLiturgico, Tempo } from '../liturgia/calendario.ts';
import type { TipoLeitura } from './paulus.ts';

/** Momentos da missa usados como etiqueta de canto (para filtrar a busca). */
export type EtiquetaMomento =
  | 'entrada'
  | 'ato-penitencial'
  | 'gloria'
  | 'salmo'
  | 'aclamacao'
  | 'creio'
  | 'ofertorio'
  | 'santo'
  | 'consagracao'
  | 'pai-nosso'
  | 'paz'
  | 'cordeiro'
  | 'comunhao'
  | 'pos-comunhao'
  | 'final'
  | 'mariano'
  | 'outro';

export const NOMES_ETIQUETA: Record<EtiquetaMomento, string> = {
  entrada: 'Entrada',
  'ato-penitencial': 'Ato penitencial',
  gloria: 'Glória',
  salmo: 'Salmo',
  aclamacao: 'Aclamação',
  creio: 'Profissão de fé',
  ofertorio: 'Ofertório',
  santo: 'Santo',
  consagracao: 'Consagração',
  'pai-nosso': 'Pai-Nosso',
  paz: 'Paz',
  cordeiro: 'Cordeiro',
  comunhao: 'Comunhão',
  'pos-comunhao': 'Pós-comunhão',
  final: 'Final',
  mariano: 'Mariano',
  outro: 'Outro',
};

export type TipoBloco = 'refrao' | 'estrofe';

export interface Bloco {
  /** "R", "R2", "E1", "E2"... (também é o rótulo da etiqueta). */
  id: string;
  tipo: TipoBloco;
  linhas: string[];
}

/**
 * - dominio-publico: obra e tradução em domínio público;
 * - projeto: texto escrito pelo projeto;
 * - autorizado: o autor ou a editora autorizou (registrar em "fonte");
 * - sem-autorizacao: incluído sem autorização; sai se o autor pedir.
 */
export type SituacaoDireitos = 'dominio-publico' | 'projeto' | 'autorizado' | 'sem-autorizacao';

/** Um item da biblioteca: canto ou texto (oração, orientação). */
export interface ItemBiblioteca {
  id: string;
  categoria: 'canto' | 'texto';
  titulo: string;
  autor?: string;
  /** Observação sobre fonte e direitos. */
  fonte?: string;
  /** Situação de direitos (só na biblioteca do projeto). */
  direitos?: SituacaoDireitos;
  blocos: Bloco[];
  /** Ordem de canto: ids de blocos, com repetição (ex.: R, E1, R, E2, R). */
  ordem: string[];
  momentos: EtiquetaMomento[];
  /** Tempos litúrgicos em que cabe. Vazio = qualquer tempo. */
  tempos: Tempo[];
  /** 'biblioteca' = JSON do projeto; 'usuario' = cadastrado no navegador. */
  origem: 'biblioteca' | 'usuario';
}

export type TipoMomento = 'capa' | 'canto' | 'texto' | 'leitura' | 'avisos';

export type TipoLeituraMomento = Exclude<TipoLeitura, 'outra'> | 'aclamacao';

export interface DadosLeitura {
  tipo: TipoLeituraMomento;
  /** Ex.: "Primeira Leitura". */
  rotulo: string;
  /** Ex.: "Leitura do livro do profeta Isaías". */
  titulo: string;
  referencia: string;
  /** Salmo: refrão. */
  refrao: string;
  /** Aclamação: "Aleluia, aleluia, aleluia." */
  aclamacao: string;
  /** Aclamação: versículo. */
  versiculo: string;
}

export interface Momento {
  id: string;
  tipo: TipoMomento;
  /** Nome no roteiro, ex.: "Canto de entrada". */
  nome: string;
  /** Para cantos e textos: etiqueta usada no filtro da busca. */
  etiqueta?: EtiquetaMomento;
  /** Canto ou texto escolhido. */
  itemId?: string;
  /** Ordem só para esta missa (não altera a biblioteca). */
  ordem?: string[];
  leitura?: DadosLeitura;
  /** true quando a extração falhou ou não havia dados para a data. */
  leituraSemDados?: boolean;
  /** Texto dos avisos: cada linha em branco começa um novo slide. */
  avisos?: string;
  /** Momento sem slides de abertura (ex.: orientações curtas). */
  semAbertura?: boolean;
}

export interface ImagemCapa {
  src: string;
  largura: number;
  altura: number;
}

export interface Missa {
  id: string;
  /** AAAA-MM-DD */
  data: string;
  /** Nome da celebração, usado na capa e no nome do arquivo. Editável. */
  celebracao: string;
  liturgia: DiaLiturgico;
  /** Imagem da capa (data URL JPEG reduzida). */
  capa?: ImagemCapa;
  momentos: Momento[];
  criadaEm: string;
  atualizadaEm: string;
}

export type Sinal = 'ok' | 'vazio' | 'atencao';

export interface Situacao {
  sinal: Sinal;
  /** Motivo do ⚠, para mostrar ao usuário. */
  motivo?: string;
}
