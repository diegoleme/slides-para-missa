// Regras do calendário litúrgico (rito romano, com as particularidades do Brasil).
// Só o necessário: tempo litúrgico, ano A/B/C e uma cor/Glória de reserva para
// datas que a Paulus ainda não publicou. Nome da celebração, cor e Glória vêm da Paulus.

export type Tempo = 'advento' | 'natal' | 'quaresma' | 'triduo' | 'pascoa' | 'comum';
export type Cor = 'verde' | 'roxo' | 'branco' | 'vermelho' | 'rosa' | 'preto';

const DIA = 86400000;

/** "AAAA-MM-DD" → Date ao meio-dia UTC (evita problemas de fuso). */
function dt(iso: string): Date {
  return new Date(iso + 'T12:00:00Z');
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function somar(data: string, dias: number): string {
  return iso(new Date(dt(data).getTime() + dias * DIA));
}

function diaSemana(data: string): number {
  return dt(data).getUTCDay();
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** Domingo de Páscoa (calendário gregoriano; algoritmo de Meeus/Jones/Butcher). */
export function pascoa(ano: number): string {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}`;
}

/** 1º Domingo do Advento: quarto domingo antes do Natal (entre 27/11 e 3/12). */
export function inicioDoAdvento(ano: number): string {
  const natal = `${ano}-12-25`;
  const dow = diaSemana(natal);
  const quartoDomingo = somar(natal, -(dow === 0 ? 7 : dow));
  return somar(quartoDomingo, -21);
}

/** Epifania no Brasil: domingo entre 2 e 8 de janeiro. */
export function epifania(ano: number): string {
  const dois = `${ano}-01-02`;
  return somar(dois, (7 - diaSemana(dois)) % 7);
}

/** Batismo do Senhor: domingo depois da Epifania; se ela cair em 7 ou 8/1, na segunda-feira seguinte. */
export function batismoDoSenhor(ano: number): string {
  const ep = epifania(ano);
  return Number(ep.slice(8)) >= 7 ? somar(ep, 1) : somar(ep, 7);
}

export function tempoLiturgico(data: string): Tempo {
  const ano = Number(data.slice(0, 4));
  if (data >= inicioDoAdvento(ano)) return data < `${ano}-12-25` ? 'advento' : 'natal';
  if (data <= batismoDoSenhor(ano)) return 'natal';
  const p = pascoa(ano);
  if (data < somar(p, -46)) return 'comum'; // antes da Quarta-feira de Cinzas
  if (data < somar(p, -3)) return 'quaresma'; // até a Quarta-feira Santa
  if (data < p) return 'triduo'; // Quinta, Sexta e Sábado Santos
  if (data <= somar(p, 49)) return 'pascoa'; // até Pentecostes
  return 'comum';
}

/** Ano do ciclo dominical. O ano litúrgico que começa no Advento de 2025 é o "ano 2026" = A. */
export function anoLiturgico(data: string): 'A' | 'B' | 'C' {
  const civil = Number(data.slice(0, 4));
  const rotulo = data >= inicioDoAdvento(civil) ? civil + 1 : civil;
  return (['C', 'A', 'B'] as const)[rotulo % 3];
}

/** Cor de reserva, para quando a Paulus ainda não publicou a data. */
export function corPadrao(data: string): Cor {
  const tempo = tempoLiturgico(data);
  const ano = Number(data.slice(0, 4));
  const p = pascoa(ano);
  if (data === somar(p, -7) || data === somar(p, 49) || data === somar(p, -2)) return 'vermelho'; // Ramos, Pentecostes, Sexta-feira Santa
  if (tempo === 'advento' || tempo === 'quaresma') return 'roxo';
  if (tempo === 'comum') return 'verde';
  return 'branco';
}

/** Glória de reserva, para quando a Paulus ainda não publicou a data. */
export function gloriaPadrao(data: string): boolean {
  const tempo = tempoLiturgico(data);
  const ano = Number(data.slice(0, 4));
  const p = pascoa(ano);
  if (data === somar(p, -3) || data === somar(p, -1)) return true; // Ceia do Senhor e Vigília Pascal
  if (tempo === 'triduo' || tempo === 'advento' || tempo === 'quaresma') return false;
  if (data >= p && data <= somar(p, 7)) return true; // oitava da Páscoa
  if (data >= `${ano}-12-25` || data <= `${ano}-01-01`) return true; // oitava do Natal
  return diaSemana(data) === 0;
}
