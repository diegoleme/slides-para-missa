// Criar e duplicar missas (funções puras; a busca de liturgia e leituras fica no store).

import type { DiaLiturgico } from '../liturgia/calendario.ts';
import type { DiaPaulus } from './paulus.ts';
import { aplicarLeituras, novoId, roteiroPadrao } from './roteiro.ts';
import type { Missa } from './tipos.ts';

export function criarMissa(data: string, liturgia: DiaLiturgico, leituras: DiaPaulus | null): Missa {
  const agora = new Date().toISOString();
  return {
    id: novoId(),
    data,
    celebracao: liturgia.celebracao,
    liturgia,
    momentos: aplicarLeituras(roteiroPadrao(), leituras),
    criadaEm: agora,
    atualizadaEm: agora,
  };
}

/**
 * Duplicar com nova data:
 * - mantém roteiro, cantos e textos;
 * - atualiza a liturgia e as leituras;
 * - limpa avisos e capa.
 * O que não combinar com a nova data aparece com ⚠ (ver situacao.ts).
 */
export function duplicarMissa(origem: Missa, data: string, liturgia: DiaLiturgico, leituras: DiaPaulus | null): Missa {
  const agora = new Date().toISOString();
  const momentos = origem.momentos.map((m) => {
    const copia = { ...m, id: novoId() };
    if (copia.tipo === 'avisos') copia.avisos = '';
    if (copia.ordem) copia.ordem = [...copia.ordem];
    return copia;
  });
  return {
    id: novoId(),
    data,
    celebracao: liturgia.celebracao,
    liturgia,
    capa: undefined,
    momentos: aplicarLeituras(momentos, leituras),
    criadaEm: agora,
    atualizadaEm: agora,
  };
}
