// Junta cantos exportados pelo app à biblioteca do projeto (public/data/biblioteca.json).
//
// Uso: pnpm biblioteca:incorporar <arquivo.json> [--direitos sem-autorizacao|autorizado|dominio-publico] [--fonte "texto"]
//
// Cantos já existentes (mesmo título e primeira linha) são pulados.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { idDoTitulo, lerArquivoCantos, separarNovos } from '../../src/biblioteca/arquivo.ts';
import type { ItemBiblioteca, SituacaoDireitos } from '../../src/modelo/tipos.ts';

// BIBLIOTECA permite apontar para outra cópia (útil para testar).
const CAMINHO = process.env.BIBLIOTECA ?? join(process.cwd(), 'public', 'data', 'biblioteca.json');
const SITUACOES: SituacaoDireitos[] = ['sem-autorizacao', 'autorizado', 'dominio-publico', 'projeto'];

const argv = process.argv.slice(2);
const valor = (nome: string) => {
  const i = argv.indexOf(nome);
  return i >= 0 ? argv[i + 1] : undefined;
};
const arquivo = argv.find((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
const direitos = (valor('--direitos') ?? 'sem-autorizacao') as SituacaoDireitos;
const fonte = valor('--fonte');

if (!arquivo) {
  console.error('Informe o arquivo exportado: pnpm biblioteca:incorporar "cantos 2026-10-17.json"');
  process.exit(1);
}
if (!SITUACOES.includes(direitos)) {
  console.error(`--direitos deve ser um de: ${SITUACOES.join(', ')}`);
  process.exit(1);
}
if (direitos === 'autorizado' && !fonte) {
  console.error('Para --direitos autorizado, registre quem autorizou e quando em --fonte.');
  process.exit(1);
}

type ItemProjeto = Omit<ItemBiblioteca, 'origem'>;
const biblioteca = JSON.parse(readFileSync(CAMINHO, 'utf8')) as { itens: ItemProjeto[] } & Record<string, unknown>;
const { novos, repetidos } = separarNovos(lerArquivoCantos(readFileSync(arquivo, 'utf8')), biblioteca.itens);

const usados = new Set(biblioteca.itens.map((i) => i.id));
for (const dados of novos) {
  const { blocos, ordem, momentos, tempos, ...resto } = dados;
  biblioteca.itens.push({
    id: idDoTitulo(dados.titulo, usados),
    ...resto,
    ...(fonte ? { fonte } : {}),
    direitos,
    blocos,
    ordem,
    momentos,
    tempos,
  });
  const avisos = [!dados.autor && 'sem autor', dados.momentos.length === 0 && 'sem momento'].filter(Boolean);
  console.log(`+ ${dados.titulo}${dados.autor ? ` (${dados.autor})` : ''}${avisos.length ? `  ⚠ ${avisos.join(', ')}` : ''}`);
}

writeFileSync(CAMINHO, JSON.stringify(biblioteca, null, 2) + '\n');
console.log(`\n${novos.length} incorporados como "${direitos}", ${repetidos} já existiam.`);
if (novos.some((n) => !n.autor)) {
  console.log('Dica: preencha o autor dos cantos marcados; isso facilita atender pedidos de remoção.');
}
