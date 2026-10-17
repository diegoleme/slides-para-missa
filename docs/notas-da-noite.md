# Notas da noite (17/10/2026)

## O que foi feito

1. **Robô das leituras** (`scripts/leituras/`)
   - Lê o índice de sitemaps, filtra pelo `lastmod`, baixa só páginas novas ou alteradas (pausa de 2,5 s, 3 tentativas, timeout de 60 s).
   - Grava `public/data/leituras/AAAA-MM.json` + `indice.json`. Coletados **181 dias (01/09/2026 a 28/02/2027), sem falhas**.
   - Extrai: celebração, observação e cor da Paulus, título e referência das leituras, refrão do salmo, aclamação e versículo. O texto das leituras **não** é gravado.
   - GitHub Action semanal (`.github/workflows/leituras.yml`, segunda 06h) e publicação no Pages (`publicar.yml`). Só rodam depois de ir para `main`.
2. **Validação da romcal** (`pnpm romcal:validar`): cor e Glória comparados nos 180 dias que têm observação na Paulus.
3. **Motor de slides**: blocos com refrão em negrito, ordem de canto, quebra automática, **um só tamanho de fonte** para todos os slides de texto (o maior em que todos os blocos cabem, entre 44 e 28 pt; bloco que não cabe nem em 28 pt é dividido em slides equilibrados).
4. **Exportação**: .pptx (pptxgenjs, Tahoma, quebras já calculadas) e PDF (canvas → jsPDF, 1600×900).
5. **Telas**: início (nova missa / missas salvas com Abrir, Duplicar, Apagar), montagem em 3 colunas (roteiro com ✓ ○ ⚠ e arrastar, editor, prévia), cadastro de canto com sugestão de refrão, "Ver todos os slides" e download. Salvamento automático no navegador.
6. **Biblioteca inicial** (`public/data/biblioteca.json`): 22 itens.
7. Testes: 21 passando (hoje cedo, com o arquivo de cantos, 26) (`pnpm test`), `vue-tsc` e `vite build` ok.

## Achados importantes

- **A Paulus às vezes publica a página com a data errada** (ex.: a página "24 – QUARTA-FEIRA" de fev/2027 saiu com data de 23; a de 26/12 com 25/12). O robô agora confere a data com o cabeçalho ("24 – QUARTA-FEIRA") e corrige.
- **A página traz a cor, sim**: "(branco, glória, creio, …)". Uso para validar a romcal e para decidir se há Glória.
- **Romcal errava a Epifania no Brasil** (06/01 em vez do domingo). Corrigido forçando `epiphanyOnSunday: true`.
- Romcal dava Glória nos Fiéis Defuntos. Corrigido, e quando a Paulus tem a observação, o Glória vem dela (0 divergências restantes).

## Decisões para você revisar

1. **Glória**: quando a Paulus traz a observação, ela manda; senão, regra própria (solenidade/festa/domingo fora do Advento e da Quaresma/oitavas).
2. **Cor do 3º Domingo do Advento** (e Laetare): romcal dá **rosa**, Paulus **roxo**. Mantive a romcal (rosa).
3. **Divergências que deixei como estão**: 05/10 (romcal: memória de São Benedito, branco; Paulus: dia de semana, verde) e o nome de Guadalupe em inglês na romcal. Só afetam dias de semana.
4. **Cantos e textos são o mesmo tipo de item** na biblioteca (texto = sem refrão). Momentos "canto" ganham slide de abertura com o título (pode desligar); "texto" não.
5. **Roteiro padrão** (19 momentos): Capa, Entrada, Ato penitencial, Glória, 1ª leitura, Salmo, 2ª leitura, Aclamação, Evangelho, Profissão de fé, Ofertório, Santo, Consagração (orientação "ajoelhe-se"), Pai-Nosso (orientação "não se diz amém"), Cordeiro, Comunhão, Ação de graças (Alma de Cristo), Avisos, Canto final. Momentos vazios não geram slides.
6. **Slides de leitura**: um slide com rótulo + título + referência; salmo = slide com a referência + slide com o refrão; aclamação = um slide (refrão em negrito + versículo). " / " vira quebra de linha.
7. **Imagem de capa**: recortada em 16:9 e reduzida para 1600×900 JPEG no envio; fica escurecida (55%) atrás das aberturas.
8. **Faixa da cor litúrgica**: barra de 36 px no pé de todos os slides.
9. **Biblioteca — deixei de fora por dúvida de direitos**: todos os cantos em português (inclusive tradicionais como "Queremos Deus" e "Noite Feliz", por causa das traduções), o **Creio** e as partes fixas em português (tradução da CNBB). Entraram: ordinário em latim/grego (Kyrie, Gloria, Sanctus, Agnus Dei), hinos latinos (Adoro te, Tantum ergo, O salutaris, Veni Creator, Ubi caritas, Rorate, Attende, Adeste, Regina caeli, Salve Regina, Ave Maria), Alma de Cristo, **Pai-Nosso** (incluí por ser oração tradicional; revise) e orientações escritas por mim.
10. **Coleta inicial a partir de 01/09/2026**; a semanal pega os últimos 35 dias de `lastmod`. Rotas com `#` (GitHub Pages). `base` do Vite = `/slides-para-missa/`.

## Pendente

- **Não testei no navegador**: a extensão do Chrome não estava conectada. Tipos, build e testes passam, e gerei um .pptx real no Node (46 slides, fonte 42 pt), mas ainda não conferi visualmente. Primeiro passo de hoje: `pnpm dev` e montar uma missa.
- PDF só testável no navegador (usa canvas).
- A romcal pesa ~420 KB (gzip); carrega só ao escolher a data. Dá para pré-calcular num JSON depois.
- Pedir à Paulus/CNBB conforme o README; cantos em português precisam vir do ministério (cadastro no app).
