export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

function partes(data: string): { ano: number; mes: number; dia: number } {
  const [ano, mes, dia] = data.split('-').map(Number);
  return { ano, mes, dia };
}

/** "2026-01-04" → "4 de janeiro de 2026" */
export function dataPorExtenso(data: string): string {
  const { ano, mes, dia } = partes(data);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

/** "2026-01-04" → "domingo" */
export function diaDaSemana(data: string): string {
  return DIAS_SEMANA[new Date(data + 'T12:00:00Z').getUTCDay()];
}

/** Padrão do README: "4 de JANEIRO de 2026 - Epifania do Senhor" (sem caracteres proibidos em nomes de arquivo). */
export function nomeDoArquivo(data: string, celebracao: string): string {
  const { ano, mes, dia } = partes(data);
  const nome = `${dia} de ${MESES[mes - 1].toUpperCase()} de ${ano} - ${celebracao.trim()}`;
  return nome.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();
}

export function hojeIso(): string {
  const agora = new Date();
  const m = String(agora.getMonth() + 1).padStart(2, '0');
  const d = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${m}-${d}`;
}

/** Próximo domingo (ou hoje, se hoje for domingo). */
export function proximoDomingo(base = hojeIso()): string {
  const d = new Date(base + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7));
  return d.toISOString().slice(0, 10);
}
