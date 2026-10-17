// Robô das leituras: lê o sitemap da Paulus e grava public/data/leituras/AAAA-MM.json.
//
// Uso: pnpm leituras [--desde AAAA-MM-DD] [--pausa 2000] [--max 50] [--forcar]
//
// É incremental: só baixa páginas novas ou cujo lastmod mudou.

import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ArquivoLeiturasMes, DiaPaulus } from '../../src/modelo/paulus.ts';
import { lerIndiceSitemap, lerPaginaDoDia, lerSitemap, type EntradaSitemap } from './paulus.ts';

const INDICE = 'https://www.paulus.com.br/portal/sitemap.xml';
const FONTE = 'https://www.paulus.com.br/portal/liturgia-diaria/';
const PASTA = join(process.cwd(), 'public', 'data', 'leituras');
const AGENTE = 'slides-para-missa/0.1 (+https://github.com/diegoleme/slides-para-missa)';

interface Opcoes {
  desde: string;
  pausa: number;
  max: number;
  forcar: boolean;
}

function lerOpcoes(argv: string[]): Opcoes {
  const valor = (nome: string) => {
    const i = argv.indexOf(nome);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const hoje = new Date();
  const padraoDesde = new Date(hoje.getTime() - 35 * 86400000).toISOString().slice(0, 10);
  return {
    desde: valor('--desde') ?? padraoDesde,
    pausa: Number(valor('--pausa') ?? 2000),
    max: Number(valor('--max') ?? Infinity),
    forcar: argv.includes('--forcar'),
  };
}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function baixar(url: string, tentativas = 3): Promise<string> {
  let ultimoErro: unknown;
  for (let t = 1; t <= tentativas; t++) {
    try {
      const resposta = await fetch(url, {
        headers: { 'User-Agent': AGENTE, Accept: 'text/html,application/xml' },
        signal: AbortSignal.timeout(60000),
      });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      return await resposta.text();
    } catch (erro) {
      ultimoErro = erro;
      if (t < tentativas) await esperar(5000 * t);
    }
  }
  throw new Error(`Falha ao baixar ${url}: ${String(ultimoErro)}`);
}

function lerArquivoMes(mes: string): ArquivoLeiturasMes {
  const caminho = join(PASTA, `${mes}.json`);
  if (!existsSync(caminho)) return { fonte: FONTE, atualizadoEm: '', dias: {} };
  return JSON.parse(readFileSync(caminho, 'utf8')) as ArquivoLeiturasMes;
}

function gravarArquivoMes(mes: string, arquivo: ArquivoLeiturasMes): void {
  const dias: Record<string, DiaPaulus> = {};
  for (const data of Object.keys(arquivo.dias).sort()) dias[data] = arquivo.dias[data];
  writeFileSync(join(PASTA, `${mes}.json`), JSON.stringify({ ...arquivo, dias }, null, 1) + '\n');
}

function gravarIndice(): void {
  const meses = readdirSync(PASTA)
    .filter((n) => /^\d{4}-\d{2}\.json$/.test(n))
    .map((n) => n.slice(0, 7))
    .sort();
  writeFileSync(join(PASTA, 'indice.json'), JSON.stringify({ fonte: FONTE, meses }, null, 1) + '\n');
}

function menosDias(data: string, dias: number): string {
  return new Date(new Date(data + 'T12:00:00Z').getTime() - dias * 86400000).toISOString().slice(0, 10);
}

async function principal(): Promise<void> {
  const opcoes = lerOpcoes(process.argv.slice(2));
  mkdirSync(PASTA, { recursive: true });
  console.log(`Coletando leituras desde ${opcoes.desde} (pausa ${opcoes.pausa} ms)`);

  // 1) Índice → páginas do sitemap da liturgia diária que podem ter algo recente.
  const indice = lerIndiceSitemap(await baixar(INDICE));
  if (indice.length === 0) throw new Error('Nenhum liturgiadiaria-sitemap no índice. O site mudou?');
  const corteSitemap = menosDias(opcoes.desde, 180);
  const sitemaps = indice.filter((s, i) => i === 0 || s.lastmod.slice(0, 10) >= corteSitemap);

  // 2) URLs com lastmod recente. lastmod pode vir até 1 dia antes da data do dia; usamos margem.
  const corteUrl = menosDias(opcoes.desde, 2);
  const entradas: EntradaSitemap[] = [];
  for (const s of sitemaps) {
    await esperar(opcoes.pausa);
    const urls = lerSitemap(await baixar(s.loc));
    console.log(`  ${s.loc}: ${urls.length} URLs`);
    entradas.push(...urls.filter((u) => u.lastmod.slice(0, 10) >= corteUrl));
  }

  // 3) O que já temos (por URL), para não baixar de novo.
  const meses = new Map<string, ArquivoLeiturasMes>();
  const conhecidas = new Map<string, string>();
  for (const nome of readdirSync(PASTA).filter((n) => /^\d{4}-\d{2}\.json$/.test(n))) {
    const mes = nome.slice(0, 7);
    const arquivo = lerArquivoMes(mes);
    // --forcar refaz o período do zero (descarta entradas antigas que possam estar com data errada).
    if (opcoes.forcar) {
      for (const data of Object.keys(arquivo.dias)) if (data >= opcoes.desde) delete arquivo.dias[data];
    }
    meses.set(mes, arquivo);
    for (const dia of Object.values(arquivo.dias)) conhecidas.set(dia.url, dia.modificadoEm);
  }

  const pendentes = entradas
    .filter((e) => opcoes.forcar || conhecidas.get(e.loc) !== e.lastmod)
    .sort((a, b) => a.lastmod.localeCompare(b.lastmod))
    .slice(0, opcoes.max);
  console.log(`${entradas.length} URLs no período; ${pendentes.length} para baixar.`);

  // 4) Baixa e extrai.
  const falhas: string[] = [];
  let gravadas = 0;
  for (const [i, entrada] of pendentes.entries()) {
    await esperar(opcoes.pausa);
    let dia: DiaPaulus | null = null;
    try {
      dia = lerPaginaDoDia(await baixar(entrada.loc), entrada);
    } catch (erro) {
      console.warn(`  ! ${String(erro)}`);
    }
    if (!dia) {
      falhas.push(entrada.loc);
      console.warn(`  ! não consegui extrair ${entrada.loc}`);
      continue;
    }
    if (dia.data < opcoes.desde) {
      console.log(`  [${i + 1}/${pendentes.length}] ${dia.data} fora do período, ignorado`);
      continue;
    }
    const mes = dia.data.slice(0, 7);
    const arquivo = meses.get(mes) ?? { fonte: FONTE, atualizadoEm: '', dias: {} };
    const existente = arquivo.dias[dia.data];
    if (existente && existente.url !== dia.url) {
      console.warn(`  ! ${dia.data}: duas páginas (${existente.url} e ${dia.url}); mantida a modificada por último.`);
      if (existente.modificadoEm > dia.modificadoEm) continue;
    }
    arquivo.dias[dia.data] = dia;
    arquivo.atualizadoEm = new Date().toISOString();
    meses.set(mes, arquivo);
    gravadas++;
    console.log(`  [${i + 1}/${pendentes.length}] ${dia.data} ${dia.celebracao || dia.cabecalho}`);
    // Grava a cada página para não perder o trabalho se a conexão cair.
    gravarArquivoMes(mes, arquivo);
  }

  gravarIndice();
  console.log(`Pronto: ${gravadas} dias gravados, ${falhas.length} falhas.`);
  // Muitas falhas = provavelmente o layout mudou. Falhar deixa o problema visível no GitHub Actions.
  if (pendentes.length >= 5 && falhas.length > pendentes.length / 2) {
    console.error('Mais da metade das páginas falhou. O layout da Paulus pode ter mudado.');
    process.exit(1);
  }
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
