// Compara a cor e a celebração calculadas pela romcal com o que a Paulus publica.
// Uso: pnpm romcal:validar [--todos]   (por padrão mostra só domingos e solenidades)

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ArquivoLeiturasMes, DiaPaulus } from '../../src/modelo/paulus.ts';
import { diaLiturgico } from '../../src/liturgia/calendario.ts';

const PASTA = join(process.cwd(), 'public', 'data', 'leituras');
const todos = process.argv.includes('--todos');

const dias: DiaPaulus[] = [];
for (const nome of readdirSync(PASTA).filter((n) => /^\d{4}-\d{2}\.json$/.test(n)).sort()) {
  const arquivo = JSON.parse(readFileSync(join(PASTA, nome), 'utf8')) as ArquivoLeiturasMes;
  dias.push(...Object.values(arquivo.dias));
}

let comparados = 0;
let coresDiferentes = 0;
const linhas: string[] = [];
for (const paulus of dias) {
  const romcal = await diaLiturgico(paulus.data);
  const domingo = new Date(paulus.data + 'T12:00:00Z').getUTCDay() === 0;
  const importante = domingo || romcal.grau === 'SOLEMNITY' || romcal.grau === 'FEAST';
  if (!paulus.cor) continue;
  comparados++;
  const corOk = paulus.cor === romcal.cor;
  if (!corOk) coresDiferentes++;
  if (todos || importante || !corOk) {
    const marca = corOk ? '  ' : '≠ ';
    linhas.push(
      `${marca}${paulus.data} ${domingo ? 'dom' : '   '} | Paulus: ${paulus.cor.padEnd(8)} ${paulus.celebracao || paulus.cabecalho}` +
        `\n${' '.repeat(18)}| romcal: ${romcal.cor.padEnd(8)} ${romcal.celebracao} (${romcal.grau}, ano ${romcal.ano}, ${romcal.tempo}, glória: ${romcal.temGloria ? 'sim' : 'não'})`,
    );
  }
}

console.log(linhas.join('\n'));
console.log(`\n${comparados} dias com cor na Paulus; ${coresDiferentes} com cor diferente da romcal.`);
