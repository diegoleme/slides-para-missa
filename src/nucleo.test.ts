import { describe, expect, it } from 'vitest';
import { itemDaLetra, montarBlocos, separarBlocos, sugerirRefrao } from './biblioteca/letra.ts';
import type { DiaLiturgico } from './liturgia/calendario.ts';
import { criarMissa, duplicarMissa } from './modelo/missa.ts';
import type { DiaPaulus } from './modelo/paulus.ts';
import { situacaoDoMomento } from './modelo/situacao.ts';
import type { ItemBiblioteca, Missa } from './modelo/tipos.ts';
import { medidorAproximado } from './slides/medidor.ts';
import { CAIXA_CORPO, gerarSlides } from './slides/motor.ts';
import { dividirTrecho, escolherTamanho, quebrarTexto, TAMANHOS_PADRAO } from './slides/quebra.ts';
import type { ElementoTexto } from './slides/tipos.ts';
import { nomeDoArquivo } from './util/datas.ts';

const medir = medidorAproximado;

const comum: DiaLiturgico = {
  data: '2026-10-18', celebracao: '29º Domingo do Tempo Comum', cor: 'verde', tempo: 'comum',
  ano: 'A', temGloria: true, fonte: 'paulus',
};
const advento: DiaLiturgico = {
  data: '2026-11-29', celebracao: '1º Domingo do Advento', cor: 'roxo', tempo: 'advento',
  ano: 'B', temGloria: false, fonte: 'paulus',
};

const paulus: DiaPaulus = {
  data: '2026-10-18', url: 'u', modificadoEm: 'm', cabecalho: '18 – DOMINGO', celebracao: '29º DOMINGO',
  leituras: [
    { tipo: 'primeira', rotulo: 'Primeira Leitura', referencia: 'Isaías 45,1.4-6', titulo: 'Leitura do livro do profeta Isaías' },
    { tipo: 'salmo', rotulo: 'Salmo Responsorial', referencia: '95(96)', refrao: 'Ó família das nações, dai ao Senhor / poder e glória!' },
    { tipo: 'segunda', rotulo: 'Segunda Leitura', referencia: '1 Tessalonicenses 1,1-5b', titulo: 'Leitura da primeira carta' },
    { tipo: 'evangelho', rotulo: 'Evangelho', referencia: 'Mateus 22,15-21', aclamacao: 'Aleluia, aleluia, aleluia.', versiculo: 'Brilhai como astros / no mundo.', titulo: 'Proclamação' },
  ],
};

const LETRA = `Refrão: Vem, Senhor, vem nos salvar
com teu povo vem caminhar

1. Primeira estrofe linha um
primeira estrofe linha dois

2. Segunda estrofe linha um
segunda estrofe linha dois`;

describe('cadastro de canto pela letra', () => {
  it('separa blocos por linha em branco', () => {
    expect(separarBlocos('a\nb\n\n\nc\n  \nd')).toEqual([['a', 'b'], ['c'], ['d']]);
  });

  it('reconhece refrão marcado e monta R · E1 · R · E2 · R', () => {
    const item = itemDaLetra(LETRA);
    expect(item.blocos.map((b) => b.id)).toEqual(['R', 'E1', 'E2']);
    expect(item.blocos[0].linhas[0]).toBe('Vem, Senhor, vem nos salvar');
    expect(item.blocos[1].linhas[0]).toBe('Primeira estrofe linha um');
    expect(item.ordem).toEqual(['R', 'E1', 'R', 'E2', 'R']);
  });

  it('reconhece refrão repetido e mantém a ordem colada', () => {
    const blocos = separarBlocos('A a\n\nB b\n\nA a\n\nC c\n\nA a');
    expect(sugerirRefrao(blocos)).toEqual([true, false, true, false, true]);
    expect(montarBlocos(blocos, sugerirRefrao(blocos)).ordem).toEqual(['R', 'E1', 'R', 'E2', 'R']);
  });

  it('reconhece o refrão como o único bloco sem número', () => {
    expect(sugerirRefrao(separarBlocos('Aleluia\n\n1. um\n\n2. dois'))).toEqual([true, false, false]);
  });

  it('não confunde palavra que começa com R com rótulo', () => {
    expect(sugerirRefrao(separarBlocos('Ressuscitou\n\nOutra'))).toEqual([false, false]);
  });
});

describe('quebra e fonte única', () => {
  it('quebra por palavras sem passar da largura', () => {
    const linhas = quebrarTexto('uma linha bem comprida que precisa quebrar', 400, 40, false, medir);
    expect(linhas.length).toBeGreaterThan(1);
    for (const l of linhas) expect(medir(l, 40, false)).toBeLessThanOrEqual(400);
  });

  it('usa o maior tamanho quando tudo cabe', () => {
    const t = escolherTamanho([{ linhas: [{ texto: 'curto', negrito: false }] }], CAIXA_CORPO, medir);
    expect(t).toBe(TAMANHOS_PADRAO.maximo);
  });

  it('um bloco longo reduz a fonte de todos, até o mínimo, e depois é dividido', () => {
    const longo = { linhas: Array.from({ length: 30 }, (_, i) => ({ texto: `linha número ${i} do bloco`, negrito: false })) };
    const t = escolherTamanho([longo, { linhas: [{ texto: 'curto', negrito: false }] }], CAIXA_CORPO, medir);
    expect(t).toBe(TAMANHOS_PADRAO.minimo);
    const paginas = dividirTrecho(longo, CAIXA_CORPO, t, medir);
    expect(paginas.length).toBeGreaterThan(1);
    expect(paginas.flat().length).toBe(30);
    // Páginas equilibradas: diferença de no máximo uma linha original entre elas.
    const tamanhos = paginas.map((p) => p.length);
    expect(Math.max(...tamanhos) - Math.min(...tamanhos)).toBeLessThanOrEqual(1);
  });
});

function biblioteca(itens: ItemBiblioteca[]) {
  const mapa = new Map(itens.map((i) => [i.id, i]));
  return (id: string) => mapa.get(id);
}

const cantoTeste: ItemBiblioteca = {
  id: 'c1', categoria: 'canto', titulo: 'Canto de teste', origem: 'usuario', momentos: ['entrada'], tempos: [],
  ...itemDaLetra(LETRA),
};
const cantoAdvento: ItemBiblioteca = { ...cantoTeste, id: 'c2', titulo: 'Vem, Senhor', tempos: ['advento'] };
const gloria: ItemBiblioteca = { ...cantoTeste, id: 'g', titulo: 'Glória', momentos: ['gloria'] };

function missaCom(liturgia: DiaLiturgico): Missa {
  const m = criarMissa(liturgia.data, liturgia, paulus);
  const entrada = m.momentos.find((x) => x.etiqueta === 'entrada')!;
  entrada.itemId = 'c1';
  m.momentos.find((x) => x.etiqueta === 'gloria')!.itemId = 'g';
  return m;
}

describe('motor de slides', () => {
  it('gera abertura e blocos na ordem, com refrão em negrito e fonte igual em todos', () => {
    const missa = missaCom(comum);
    const { slides } = gerarSlides(missa, { medir, item: biblioteca([cantoTeste, gloria]) });
    const entrada = missa.momentos.find((x) => x.etiqueta === 'entrada')!;
    const doCanto = slides.filter((s) => s.momentoId === entrada.id);
    // abertura + R E1 R E2 R
    expect(doCanto.length).toBe(6);
    const textos = doCanto.slice(1).map((s) => s.elementos.find((e) => e.tipo === 'texto') as ElementoTexto);
    expect(textos.map((t) => t.linhas[0].negrito)).toEqual([true, false, true, false, true]);
    const tamanhos = new Set(
      slides.flatMap((s) => s.elementos).filter((e): e is ElementoTexto => e.tipo === 'texto' && e.h === CAIXA_CORPO.h).map((e) => e.tamanho),
    );
    expect(tamanhos.size).toBe(1);
  });

  it('não gera slides para momentos vazios', () => {
    const missa = missaCom(comum);
    const ofertorio = missa.momentos.find((x) => x.etiqueta === 'ofertorio')!;
    const { slides } = gerarSlides(missa, { medir, item: biblioteca([cantoTeste, gloria]) });
    expect(slides.some((s) => s.momentoId === ofertorio.id)).toBe(false);
  });

  it('mostra referência e refrão do salmo, sem o texto completo', () => {
    const missa = missaCom(comum);
    const salmo = missa.momentos.find((x) => x.leitura?.tipo === 'salmo')!;
    const { slides } = gerarSlides(missa, { medir, item: biblioteca([]) });
    const texto = slides
      .filter((s) => s.momentoId === salmo.id)
      .flatMap((s) => s.elementos)
      .filter((e): e is ElementoTexto => e.tipo === 'texto')
      .flatMap((e) => e.linhas.map((l) => l.texto))
      .join(' | ');
    expect(texto).toContain('Salmo 95(96)');
    expect(texto).toContain('Ó família das nações, dai ao Senhor');
  });
});

describe('sinais e duplicar', () => {
  it('marca Glória e canto de outro tempo com ⚠ ao duplicar para o Advento', () => {
    const origem = missaCom(comum);
    origem.momentos.find((x) => x.etiqueta === 'entrada')!.itemId = 'c2';
    const avisos = origem.momentos.find((x) => x.tipo === 'avisos')!;
    avisos.avisos = 'Festa na paróquia';
    origem.capa = { src: 'data:x', largura: 10, altura: 10 };

    const item = biblioteca([cantoTeste, cantoAdvento, gloria]);
    const naOrigem = (etiqueta: string) => situacaoDoMomento(origem, origem.momentos.find((x) => x.etiqueta === etiqueta)!, item);
    expect(naOrigem('entrada').sinal).toBe('atencao'); // canto do Advento no Tempo Comum
    expect(naOrigem('gloria').sinal).toBe('ok');

    const nova = duplicarMissa(origem, '2026-11-29', advento, null);
    const naNova = (etiqueta: string) => situacaoDoMomento(nova, nova.momentos.find((x) => x.etiqueta === etiqueta)!, item);
    expect(naNova('entrada').sinal).toBe('ok');
    expect(naNova('gloria').sinal).toBe('atencao');
    expect(nova.capa).toBeUndefined();
    expect(nova.momentos.find((x) => x.tipo === 'avisos')!.avisos).toBe('');
    // Sem leituras para a nova data: campos vazios e ⚠.
    const primeira = nova.momentos.find((x) => x.leitura?.tipo === 'primeira')!;
    expect(primeira.leitura!.referencia).toBe('');
    expect(situacaoDoMomento(nova, primeira, item).sinal).toBe('atencao');
  });

  it('preenche as leituras da Paulus', () => {
    const m = criarMissa('2026-10-18', comum, paulus);
    const acl = m.momentos.find((x) => x.leitura?.tipo === 'aclamacao')!;
    expect(acl.leitura!.versiculo).toBe('Brilhai como astros / no mundo.');
    expect(m.momentos.find((x) => x.leitura?.tipo === 'segunda')!.leitura!.referencia).toBe('1 Tessalonicenses 1,1-5b');
  });

  it('monta o nome do arquivo no padrão', () => {
    expect(nomeDoArquivo('2026-01-04', 'Epifania do Senhor')).toBe('4 de JANEIRO de 2026 - Epifania do Senhor');
  });
});
