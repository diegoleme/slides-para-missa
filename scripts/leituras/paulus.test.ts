import { describe, expect, it } from 'vitest';
import { dataEmBrasilia, htmlParaTexto, lerIndiceSitemap, lerPaginaDoDia, lerSitemap } from './paulus.ts';

// Página reduzida, com a mesma estrutura da Paulus (textos encurtados).
const PAGINA_DOMINGO = `
<html><head>
<meta property="article:published_time" content="2026-11-01T03:32:02+00:00" />
</head><body>
<div class="titulo-liturgia">
  1º &#8211; DOMINGO  <div class="botoes-zoom">x</div>
</div>
<div id="texto">
<p>TODOS OS SANTOS E SANTAS</p>
<p>(branco, glória, creio, prefácio próprio – ofício da solenidade)</p>
<p style="text-align: justify;"><em>Alegremo-nos no Senhor.</em></p>
<div class="subtitulo-liturgia">Primeira Leitura: <strong>Apocalipse 7,2-4.9-14</strong></div><br />
<p>Leitura do livro do Apocalipse de São João – Eu, João, <sup>2</sup>vi um outro anjo. – Palavra do Senhor.</p>
<div class="subtitulo-liturgia">Salmo Responsorial: <strong>23(24)</strong></div><br />
<p><strong>É assim a geração dos que procuram o Senhor!</strong></p>
<p>1. Ao Senhor pertence a terra <span style="color: #ff0000;">– R.</span></p>
<div class="subtitulo-liturgia">Segunda Leitura: <strong>1 João 3,1-3</strong></div><br />
<p>Leitura da primeira carta de São João – Caríssimos. – Palavra do Senhor.</p>
<div class="subtitulo-liturgia">Evangelho: <strong>Mateus 5,1-12</strong></div><br />
<p><span style="color: #ff0000;">[A forma breve está entre colchetes.]</span></p>
<p><strong><em>Aleluia</em></strong><strong><em>, aleluia, aleluia.</em></strong></p>
<p><em>Vinde a mim, todos vós que estais cansados, / e descanso eu vos darei (Mt 11,28). – R.</em></p>
<p>Proclamação do Evangelho de Jesus Cristo segundo Mateus – Naquele tempo. – Palavra da salvação.</p>
<div class="subtitulo-liturgia">Reflexão:</div><br />
<p>Texto da reflexão.</p>
</div>
</body></html>`;

describe('extração da Paulus', () => {
  it('converte HTML em texto, sem números de versículo', () => {
    expect(htmlParaTexto('Eu, <sup>2</sup>vi &#8211; ok<br />linha&nbsp;2')).toBe('Eu, vi – ok\nlinha 2');
  });

  it('usa o fuso de Brasília para a data', () => {
    expect(dataEmBrasilia('2026-11-01T03:32:02+00:00')).toBe('2026-11-01');
    expect(dataEmBrasilia('2026-11-01T02:00:00+00:00')).toBe('2026-10-31');
  });

  it('lê o índice e as páginas do sitemap (com CDATA)', () => {
    const indice = `<sitemapindex>
      <sitemap><loc><![CDATA[https://x/portal/post-sitemap.xml]]></loc><lastmod><![CDATA[2026-01-01]]></lastmod></sitemap>
      <sitemap><loc><![CDATA[https://x/portal/liturgiadiaria-sitemap.xml]]></loc><lastmod><![CDATA[2026-09-22T19:15:59+00:00]]></lastmod></sitemap>
      <sitemap><loc><![CDATA[https://x/portal/liturgiadiaria-sitemap2.xml]]></loc><lastmod><![CDATA[2024-06-07]]></lastmod></sitemap>
    </sitemapindex>`;
    expect(lerIndiceSitemap(indice).map((s) => s.loc)).toEqual([
      'https://x/portal/liturgiadiaria-sitemap.xml',
      'https://x/portal/liturgiadiaria-sitemap2.xml',
    ]);
    const sitemap = `<urlset><url><loc><![CDATA[https://x/portal/liturgia-diaria/dia-28/]]></loc>
      <lastmod><![CDATA[2027-02-28T03:08:41+00:00]]></lastmod></url></urlset>`;
    expect(lerSitemap(sitemap)).toEqual([
      { loc: 'https://x/portal/liturgia-diaria/dia-28/', lastmod: '2027-02-28T03:08:41+00:00' },
    ]);
  });

  it('extrai celebração, cor e leituras de um domingo', () => {
    const dia = lerPaginaDoDia(PAGINA_DOMINGO, { loc: 'u', lastmod: 'l' });
    expect(dia).not.toBeNull();
    expect(dia!.data).toBe('2026-11-01');
    expect(dia!.cabecalho).toBe('1º – DOMINGO');
    expect(dia!.celebracao).toBe('TODOS OS SANTOS E SANTAS');
    expect(dia!.cor).toBe('branco');
    expect(dia!.leituras.map((l) => l.tipo)).toEqual(['primeira', 'salmo', 'segunda', 'evangelho']);
    expect(dia!.leituras[0]).toMatchObject({
      referencia: 'Apocalipse 7,2-4.9-14',
      titulo: 'Leitura do livro do Apocalipse de São João',
    });
    expect(dia!.leituras[1]).toMatchObject({ referencia: '23(24)', refrao: 'É assim a geração dos que procuram o Senhor!' });
    expect(dia!.leituras[3]).toMatchObject({
      aclamacao: 'Aleluia, aleluia, aleluia.',
      versiculo: 'Vinde a mim, todos vós que estais cansados, / e descanso eu vos darei (Mt 11,28).',
      titulo: 'Proclamação do Evangelho de Jesus Cristo segundo Mateus',
    });
  });

  it('aceita celebração e observação no mesmo parágrafo', () => {
    const html = PAGINA_DOMINGO.replace(
      '<p>TODOS OS SANTOS E SANTAS</p>\n<p>(branco,',
      '<p>NATAL DE NOSSO SENHOR JESUS CRISTO<br />\n(branco,',
    );
    const dia = lerPaginaDoDia(html, { loc: 'u', lastmod: 'l' });
    expect(dia!.celebracao).toBe('NATAL DE NOSSO SENHOR JESUS CRISTO');
    expect(dia!.cor).toBe('branco');
  });

  it('devolve null quando o layout não é reconhecido', () => {
    expect(lerPaginaDoDia('<html><meta property="article:published_time" content="2026-01-01T12:00:00Z"></html>', { loc: 'u', lastmod: 'l' })).toBeNull();
  });
});
