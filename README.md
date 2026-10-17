# Slides para Missa

App gratuito e de código aberto para ministérios de igrejas católicas montarem os slides da missa (cantos, leituras do dia e avisos) e baixarem em **.pptx** ou **PDF**.

> Status: em planejamento. Este README registra as decisões da v1 (piloto).

## Piloto

- 1 ministério da Paróquia Nossa Senhora das Graças.
- **Meta:** montar a missa de domingo em menos de 15 minutos, sem pedir ajuda.

## Fluxo da interface

1. **Tela inicial**
   - **Nova missa:** escolhe a data, e o app mostra a celebração, a cor e o ano litúrgico, com as leituras já preenchidas.
   - **Missas salvas:** cada uma tem **Abrir** e **Duplicar**. Duplicar pede a nova data.
2. **Tela de montagem** (feita para computador; no celular, só consulta), em 3 colunas:
   - **Roteiro:** cada momento mostra um sinal (✓ preenchido, ○ vazio, ⚠ atenção). Dá para reordenar arrastando e acrescentar momentos.
   - **Editor** do momento selecionado.
   - **Prévia** dos slides daquele momento.
3. **Editores por tipo de momento**
   - **Canto:**
     - Busca por título ou trecho da letra, já filtrada pelo momento e pelo tempo litúrgico da missa (o filtro pode ser removido).
     - **Cadastrar novo**, sem sair da missa:
       - Cola-se a letra; cada linha em branco separa um bloco.
       - O app sugere qual bloco é o refrão, e a pessoa confirma.
       - A ordem de canto é ajustada arrastando etiquetas (`R · E1 · R · E2 · R`).
     - A ordem também pode ser ajustada só para aquela missa, sem mudar o canto na biblioteca.
   - **Leituras:**
     - Vêm preenchidas com os dados da Paulus, e tudo é editável.
     - Se a extração falhar, os campos ficam vazios e o momento recebe ⚠.
   - **Texto** (Alma de Cristo, "ajoelhe-se na consagração", etc.): escolhido na biblioteca, como um canto.
   - **Avisos:** caixa de texto em que cada linha em branco começa um novo slide.
   - **Capa:** uma imagem opcional por missa. Ela aparece na capa e em todas as aberturas de momento.
4. **Duplicar com nova data**
   - **Mantém:** roteiro, cantos e textos.
   - **Atualiza:** a liturgia, para a nova data.
   - **Limpa:** avisos e capa.
   - **Marca com ⚠** o que não combina com a nova data. Por exemplo, um Glória no Advento ou na Quaresma, ou um canto de outro tempo litúrgico.
5. **Ver todos os slides:**
   - Grade de miniaturas; clicar numa miniatura leva ao item que a gerou.
   - Os slides não são editados um a um.
6. **Baixar .pptx ou PDF**, com nome no padrão `4 de JANEIRO de 2026 - Epifania do Senhor`.
7. **Salvamento automático** no navegador.

## Conteúdo e visual

- **Roteiro padrão** da missa dominical embutido no app, ajustável em cada missa.
- **Cantos:**
  - Estrofes e refrão marcados, com a ordem de canto definida.
  - O app monta os slides sozinho:
    - Refrão em negrito, repetido onde for cantado.
    - Quebra de slide automática.
    - Fonte do mesmo tamanho em todos os slides.
  - Cada canto tem etiquetas de **momento** (entrada, comunhão...) e de **tempo litúrgico**.
  - As partes fixas cantadas (Kyrie, Glória, Santo, Cordeiro) também são cantos da biblioteca.
- **Biblioteca:**
  - Um JSON de cantos e textos no repositório (`public/data/biblioteca.json`), curado pelo projeto.
  - Cada item informa a situação de direitos: domínio público, texto do projeto, autorizado ou sem autorização.
  - Pode incluir cantos sem autorização dos autores; o projeto assume esse risco e atende pedidos de remoção.
  - Mais os cantos que cada usuário acrescentar, salvos no navegador dele.
  - **Exportar/Importar cantos** na tela inicial: para passar cantos entre pessoas do ministério e para enviar à biblioteca do projeto (`pnpm biblioteca:incorporar arquivo.json`).
- **Leituras:** mostram título e referência, refrão do salmo e versículo do Aleluia. O texto completo não aparece.
- **Tema fixo:**
  - Fundo preto e texto branco em **Tahoma**, a única fonte da v1. Ela vem no Windows e no Mac, e no Linux pelo pacote `ttf-mscorefonts-installer`.
  - Faixa com a cor do tempo litúrgico.

## Técnica

- **Site estático:**
  - Vue 3, Vite, TypeScript e Pinia.
  - [pptxgenjs](https://github.com/gitbrent/PptxGenJS) gera o .pptx no navegador.
- **Calendário litúrgico:**
  - A Paulus é a fonte da verdade: nome da celebração, cor e Glória vêm da página do dia.
  - Tempo litúrgico e ano (A, B, C) são calculados por regras próprias (`src/liturgia/regras.ts`), com as particularidades do Brasil (Epifania no domingo).
  - Para datas que a Paulus ainda não publicou, as mesmas regras dão uma cor e um Glória de reserva, e o app pede para conferir o nome.
  - As regras são testadas contra a [romcal](https://github.com/romcal/romcal) (só nos testes, 2020–2035) e contra os dados da Paulus a cada coleta. Diferença proposital: a Quinta-feira Santa conta como Tríduo.
- **Leituras:**
  - Um robô semanal no GitHub Actions lê o sitemap da Paulus (`liturgiadiaria-sitemap.xml`).
  - A data de cada página vem de `article:published_time`.
  - O resultado é gravado em JSON no repositório.
  - Fonte única: [Paulus](https://www.paulus.com.br/portal/liturgia-diaria/).
- **Publicação:** GitHub Pages.
- **Dados do usuário:** ficam só no navegador (sem login e sem backup na v1).

## Fora da v1

- Importador de .pptx
- Login
- Preferências e tema da paróquia
- Agenda de missas
- Banco de cantos comunitário
- Compartilhar a missa montada
- Backup
- Apresentador próprio no navegador
- Sugestão de cantos conforme as leituras ou o tipo de missa
- Outras fontes
- Embutir fontes no .pptx

## Riscos conhecidos

- A Paulus pode mudar o layout do site, o que quebraria a extração automática.
- Direitos autorais:
  - A tradução das leituras é da CNBB. Os slides mostram só trechos curtos, e o pedido de autorização às Edições CNBB fica para depois do piloto.
  - A biblioteca pode ter letras de cantos sem autorização dos autores. Um autor pode pedir a remoção (há um modelo de issue "Pedido de remoção"), e o pedido será atendido.
- Os dados do usuário somem se o navegador for limpo.
- A Paulus é a fonte única: se ela mudar o layout, perdemos nome, cor e leituras de uma vez (o robô falha de forma visível no GitHub Actions).
- A Paulus às vezes publica a página de um dia com a data de outro; o robô corrige pelo cabeçalho da página.

## Licença

[AGPL-3.0](LICENSE)
