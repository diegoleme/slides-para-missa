// Dados litúrgicos de uma data.
// Fonte da verdade: a Paulus (nome, cor e Glória). Tempo e ano vêm das regras do
// calendário (regras.ts), que também dão cor e Glória de reserva quando a Paulus
// ainda não publicou a data.

import type { DiaPaulus } from '../modelo/paulus.ts';
import { DIAS_SEMANA } from '../util/datas.ts';
import { anoLiturgico, corPadrao, gloriaPadrao, tempoLiturgico, type Cor, type Tempo } from './regras.ts';

export type { Cor, Tempo } from './regras.ts';

export interface DiaLiturgico {
  data: string;
  celebracao: string;
  cor: Cor;
  tempo: Tempo;
  /** Ano do ciclo dominical: A, B ou C. */
  ano: 'A' | 'B' | 'C';
  /** Se a missa do dia tem Glória. */
  temGloria: boolean;
  /** 'paulus' quando há página da Paulus para a data; 'regras' quando é só o cálculo de reserva. */
  fonte: 'paulus' | 'regras';
}

export const NOMES_TEMPO: Record<Tempo, string> = {
  advento: 'Advento',
  natal: 'Tempo do Natal',
  quaresma: 'Quaresma',
  triduo: 'Tríduo Pascal',
  pascoa: 'Tempo Pascal',
  comum: 'Tempo Comum',
};

export const NOMES_COR: Record<Cor, string> = {
  verde: 'Verde',
  roxo: 'Roxo',
  branco: 'Branco',
  vermelho: 'Vermelho',
  rosa: 'Rosa',
  preto: 'Preto',
};

/** Cor da faixa nos slides. */
export const HEX_COR: Record<Cor, string> = {
  verde: '#2E7D32',
  roxo: '#6A1B9A',
  branco: '#F5F0E1',
  vermelho: '#C62828',
  rosa: '#E78FB3',
  preto: '#444444',
};

const MINUSCULAS = new Set(['a', 'à', 'ao', 'aos', 'as', 'às', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos', 'o', 'os', 'para', 'por']);

/** "NOSSO SENHOR JESUS CRISTO, REI DO UNIVERSO*" → "Nosso Senhor Jesus Cristo, Rei do Universo" */
export function nomeLegivel(texto: string): string {
  return texto
    .replace(/\*+/g, '')
    .trim()
    .toLowerCase()
    .split(/(\s+)/)
    .map((palavra, i) => {
      if (/^\s+$/.test(palavra)) return palavra;
      const limpa = palavra.replace(/[^\p{L}]/gu, '');
      if (/^[ivxl]+$/.test(limpa) && limpa.length > 1) return palavra.toUpperCase(); // São João XXIII
      if (i > 0 && MINUSCULAS.has(limpa)) return palavra;
      return palavra.replace(/\p{L}/u, (l) => l.toUpperCase());
    })
    .join('');
}

/** Nome a partir do cabeçalho, quando a Paulus não traz a celebração ("Dia 17 – 2º DOMINGO DO TEMPO COMUM"). */
function nomeDoCabecalho(cabecalho: string): string {
  const resto = cabecalho.replace(/^\s*(dia\s*)?\d{1,2}º?\s*[–-]?\s*/i, '').trim();
  const soDiaDaSemana = DIAS_SEMANA.some((d) => resto.toLowerCase().replace(/-feira$/, '') === d.replace(/-feira$/, ''));
  return resto && !soDiaDaSemana ? resto : '';
}

function nomeDeReserva(data: string, tempo: Tempo): string {
  const dia = DIAS_SEMANA[new Date(data + 'T12:00:00Z').getUTCDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} – ${NOMES_TEMPO[tempo]}`;
}

const CORES_PAULUS = new Set<string>(['verde', 'roxo', 'branco', 'vermelho', 'rosa', 'preto']);

/** Junta os dados da Paulus (quando houver) com as regras do calendário. */
export function montarDiaLiturgico(data: string, paulus: DiaPaulus | null): DiaLiturgico {
  const tempo = tempoLiturgico(data);
  const base = { data, tempo, ano: anoLiturgico(data) };
  if (!paulus) {
    return { ...base, celebracao: nomeDeReserva(data, tempo), cor: corPadrao(data), temGloria: gloriaPadrao(data), fonte: 'regras' };
  }
  const nome = paulus.celebracao || nomeDoCabecalho(paulus.cabecalho);
  return {
    ...base,
    celebracao: nome ? nomeLegivel(nome) : nomeDeReserva(data, tempo),
    cor: paulus.cor && CORES_PAULUS.has(paulus.cor) ? (paulus.cor as Cor) : corPadrao(data),
    temGloria: paulus.observacao ? /gl[óo]ria/i.test(paulus.observacao) : gloriaPadrao(data),
    fonte: 'paulus',
  };
}
