// Extração das páginas de Liturgia Diária da Paulus.
// Funções puras (sem rede), para poderem ser testadas com páginas salvas.

import type { DiaPaulus, LeituraPaulus, TipoLeitura } from '../../src/modelo/paulus.ts';

export interface EntradaSitemap {
  loc: string;
  lastmod: string;
}

const ENTIDADES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ordm: 'º', ordf: 'ª', deg: '°',
  aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã', eacute: 'é', ecirc: 'ê',
  iacute: 'í', oacute: 'ó', ocirc: 'ô', otilde: 'õ', uacute: 'ú', uuml: 'ü', ccedil: 'ç',
  Aacute: 'Á', Agrave: 'À', Acirc: 'Â', Atilde: 'Ã', Eacute: 'É', Ecirc: 'Ê',
  Iacute: 'Í', Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Uacute: 'Ú', Uuml: 'Ü', Ccedil: 'Ç',
};

export function decodificarEntidades(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (inteiro, nome: string) => {
    if (nome[0] === '#') {
      const codigo = nome[1] === 'x' || nome[1] === 'X' ? parseInt(nome.slice(2), 16) : parseInt(nome.slice(1), 10);
      return Number.isFinite(codigo) ? String.fromCodePoint(codigo) : inteiro;
    }
    return ENTIDADES[nome] ?? inteiro;
  });
}

/** Converte um trecho de HTML em texto simples (quebras de <br> viram \n; números de versículo somem). */
export function htmlParaTexto(html: string): string {
  const semVersiculos = html.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '');
  const comQuebras = semVersiculos.replace(/<br\s*\/?>/gi, '\n');
  const semTags = comQuebras.replace(/<[^>]+>/g, '');
  return decodificarEntidades(semTags)
    .split('\n')
    .map((linha) => linha.replace(/\s+/g, ' ').trim())
    .filter((linha) => linha.length > 0)
    .join('\n');
}

function blocos(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g');
  return [...xml.matchAll(re)].map((m) => m[1]);
}

function valorXml(bloco: string, tag: string): string {
  const m = bloco.match(new RegExp(`<${tag}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${tag}>`));
  return m ? m[1].trim() : '';
}

/** Lê o índice de sitemaps e devolve só as páginas da liturgia diária. */
export function lerIndiceSitemap(xml: string): EntradaSitemap[] {
  return blocos(xml, 'sitemap')
    .map((b) => ({ loc: valorXml(b, 'loc'), lastmod: valorXml(b, 'lastmod') }))
    .filter((e) => /\/liturgiadiaria-sitemap\d*\.xml$/.test(e.loc));
}

export function lerSitemap(xml: string): EntradaSitemap[] {
  return blocos(xml, 'url')
    .map((b) => ({ loc: valorXml(b, 'loc'), lastmod: valorXml(b, 'lastmod') }))
    .filter((e) => e.loc.includes('/liturgia-diaria/'));
}

/** Converte um instante (ISO) na data civil de Brasília (AAAA-MM-DD). */
export function dataEmBrasilia(iso: string): string {
  const instante = new Date(iso);
  if (Number.isNaN(instante.getTime())) return '';
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante);
}

function meta(html: string, propriedade: string): string {
  const re = new RegExp(`<meta[^>]+property="${propriedade}"[^>]+content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? decodificarEntidades(m[1]) : '';
}

function paragrafos(html: string): string[] {
  return [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => htmlParaTexto(m[1])).filter((t) => t.length > 0);
}

function tipoDoRotulo(rotulo: string): TipoLeitura | 'fim' {
  const r = rotulo.toLowerCase();
  if (r.startsWith('reflex')) return 'fim';
  if (r.includes('primeira leitura')) return 'primeira';
  if (r.includes('segunda leitura')) return 'segunda';
  if (r.includes('salmo')) return 'salmo';
  if (r.includes('evangelho')) return 'evangelho';
  return 'outra';
}

/** "Leitura do livro do profeta Isaías – Naquele tempo..." → "Leitura do livro do profeta Isaías". */
function tituloAntesDoTravessao(texto: string): string | undefined {
  const i = texto.search(/\s[–—-]\s/);
  if (i <= 0 || i > 160) return undefined;
  return texto.slice(0, i).trim();
}

function semMarcaDeRefrao(texto: string): string {
  return texto.replace(/\s*[–—-]\s*R\.\s*$/, '').trim();
}

function ehNotaEntreColchetes(texto: string): boolean {
  return texto.startsWith('[');
}

function extrairLeitura(rotulo: string, referencia: string, tipo: TipoLeitura, corpo: string): LeituraPaulus {
  const ps = paragrafos(corpo).filter((p) => !ehNotaEntreColchetes(p));
  const leitura: LeituraPaulus = { tipo, rotulo, referencia };

  if (tipo === 'salmo') {
    const refrao = ps.find((p) => !/^\d+\./.test(p));
    if (refrao) leitura.refrao = semMarcaDeRefrao(refrao.replace(/\n/g, ' '));
    return leitura;
  }

  if (tipo === 'evangelho') {
    const iProclamacao = ps.findIndex((p) => /^Proclama[çc][ãa]o/i.test(p));
    const antes = iProclamacao >= 0 ? ps.slice(0, iProclamacao) : ps.slice(0, 2);
    if (antes.length > 0) leitura.aclamacao = antes[0].replace(/\n/g, ' ');
    if (antes.length > 1) leitura.versiculo = semMarcaDeRefrao(antes.slice(1).join(' ').replace(/\n/g, ' '));
    if (iProclamacao >= 0) leitura.titulo = tituloAntesDoTravessao(ps[iProclamacao]);
    return leitura;
  }

  if (ps.length > 0) leitura.titulo = tituloAntesDoTravessao(ps[0]);
  return leitura;
}

const CORES = ['branco', 'verde', 'roxo', 'vermelho', 'rosa', 'preto'];

/**
 * Extrai os dados de uma página da liturgia diária.
 * Devolve null se a página não tiver a estrutura esperada (layout mudou).
 */
export function lerPaginaDoDia(html: string, entrada: EntradaSitemap): DiaPaulus | null {
  const publicado = meta(html, 'article:published_time');
  const data = dataEmBrasilia(publicado);
  if (!data) return null;

  const mCabecalho = html.match(/<div class="titulo-liturgia">([\s\S]*?)<div class="botoes-zoom">/);
  const cabecalho = mCabecalho ? htmlParaTexto(mCabecalho[1]) : '';

  const inicioTexto = html.indexOf('<div id="texto">');
  if (inicioTexto < 0) return null;
  const texto = html.slice(inicioTexto);

  const marcador = '<div class="subtitulo-liturgia">';
  const pedacos = texto.split(marcador);
  const linhasCabecalho = paragrafos(pedacos[0]).flatMap((p) => p.split('\n'));
  const celebracao = linhasCabecalho[0] ?? '';
  const observacao = linhasCabecalho.find((l) => /^\(.+\)$/.test(l));
  const corEncontrada = observacao?.match(/^\(\s*([a-zç]+)/i)?.[1]?.toLowerCase();
  const cor = corEncontrada && CORES.includes(corEncontrada) ? corEncontrada : undefined;

  const leituras: LeituraPaulus[] = [];
  for (const pedaco of pedacos.slice(1)) {
    const fimTitulo = pedaco.indexOf('</div>');
    if (fimTitulo < 0) continue;
    const tituloSecao = htmlParaTexto(pedaco.slice(0, fimTitulo));
    const corpo = pedaco.slice(fimTitulo + 6);
    const [rotuloBruto, ...resto] = tituloSecao.split(':');
    const rotulo = rotuloBruto.trim();
    const tipo = tipoDoRotulo(rotulo);
    if (tipo === 'fim') break;
    leituras.push(extrairLeitura(rotulo, resto.join(':').trim(), tipo, corpo));
  }

  if (leituras.length === 0) return null;

  const dia: DiaPaulus = {
    data,
    url: entrada.loc,
    modificadoEm: entrada.lastmod,
    cabecalho,
    celebracao,
    leituras,
  };
  if (observacao) dia.observacao = observacao;
  if (cor) dia.cor = cor;
  return dia;
}
