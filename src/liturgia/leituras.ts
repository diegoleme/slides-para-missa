// Busca as leituras gravadas pelo robô (public/data/leituras/AAAA-MM.json).

import type { ArquivoLeiturasMes, DiaPaulus } from '../modelo/paulus.ts';
import { montarDiaLiturgico, type DiaLiturgico } from './calendario.ts';

const meses = new Map<string, Promise<ArquivoLeiturasMes | null>>();

function carregarMes(mes: string): Promise<ArquivoLeiturasMes | null> {
  let p = meses.get(mes);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}data/leituras/${mes}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<ArquivoLeiturasMes>) : null))
      .catch(() => null);
    meses.set(mes, p);
    // Se falhou (ex.: sem internet), deixa tentar de novo depois.
    p.then((v) => {
      if (!v) meses.delete(mes);
    });
  }
  return p;
}

/** Leituras do dia, ou null se não houver (data fora do período, robô falhou, sem internet). */
export async function leiturasDoDia(data: string): Promise<DiaPaulus | null> {
  const arquivo = await carregarMes(data.slice(0, 7));
  return arquivo?.dias[data] ?? null;
}

/** Dados litúrgicos e leituras de uma data. */
export async function liturgiaDoDia(data: string): Promise<{ liturgia: DiaLiturgico; leituras: DiaPaulus | null }> {
  const leituras = await leiturasDoDia(data);
  return { liturgia: montarDiaLiturgico(data, leituras), leituras };
}
