// Tempo, cor e ano litúrgico de uma data, calculados pela romcal (calendário do Brasil).
// A romcal é carregada sob demanda para não pesar na abertura do app.

export type Cor = 'verde' | 'roxo' | 'branco' | 'vermelho' | 'rosa' | 'preto' | 'dourado';
export type Tempo = 'advento' | 'natal' | 'quaresma' | 'triduo' | 'pascoa' | 'comum';

export interface DiaLiturgico {
  data: string;
  celebracao: string;
  /** Cor principal (a primeira da romcal). */
  cor: Cor;
  tempo: Tempo;
  /** Ano do ciclo dominical: A, B ou C. */
  ano: 'A' | 'B' | 'C';
  /** SOLEMNITY, FEAST, SUNDAY, MEMORIAL, WEEKDAY... */
  grau: string;
  /** Se a missa do dia tem Glória. */
  temGloria: boolean;
  idRomcal: string;
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
  dourado: 'Dourado',
};

/** Cor da faixa nos slides. */
export const HEX_COR: Record<Cor, string> = {
  verde: '#2E7D32',
  roxo: '#6A1B9A',
  branco: '#F5F0E1',
  vermelho: '#C62828',
  rosa: '#E78FB3',
  preto: '#444444',
  dourado: '#C9A227',
};

const COR_ROMCAL: Record<string, Cor> = {
  GREEN: 'verde',
  PURPLE: 'roxo',
  WHITE: 'branco',
  RED: 'vermelho',
  ROSE: 'rosa',
  BLACK: 'preto',
  GOLD: 'dourado',
};

const TEMPO_ROMCAL: Record<string, Tempo> = {
  ADVENT: 'advento',
  CHRISTMAS_TIME: 'natal',
  LENT: 'quaresma',
  PASCHAL_TRIDUUM: 'triduo',
  EASTER_TIME: 'pascoa',
  ORDINARY_TIME: 'comum',
};

const ANO_ROMCAL: Record<string, 'A' | 'B' | 'C'> = { YEAR_A: 'A', YEAR_B: 'B', YEAR_C: 'C' };

/** Forma mínima do que usamos de um LiturgicalDay da romcal. */
export interface DiaRomcal {
  id: string;
  name: string;
  rank: string;
  colors: string[];
  seasons: string[];
  periods: string[];
  cycles: { sundayCycle: string };
  calendar: { dayOfWeek: number };
}

export function converterDiaRomcal(data: string, dia: DiaRomcal): DiaLiturgico {
  const tempo = TEMPO_ROMCAL[dia.seasons[0] ?? 'ORDINARY_TIME'] ?? 'comum';
  return {
    data,
    celebracao: dia.name,
    cor: COR_ROMCAL[dia.colors[0] ?? 'GREEN'] ?? 'verde',
    tempo,
    ano: ANO_ROMCAL[dia.cycles.sundayCycle] ?? 'A',
    grau: dia.rank,
    temGloria: calcularGloria(dia, tempo),
    idRomcal: dia.id,
  };
}

function calcularGloria(dia: DiaRomcal, tempo: Tempo): boolean {
  // Fiéis Defuntos tem grau de solenidade, mas não tem Glória.
  if (dia.id === 'commemoration_of_all_the_faithful_departed') return false;
  if (dia.rank === 'SOLEMNITY' || dia.rank === 'FEAST') return true;
  if (dia.periods.includes('CHRISTMAS_OCTAVE') || dia.periods.includes('EASTER_OCTAVE')) return true;
  // A Missa da Ceia do Senhor (Quinta-feira Santa) tem Glória.
  // A Vigília Pascal também tem, mas a romcal não a separa do Sábado Santo.
  if (dia.id === 'thursday_of_the_lords_supper') return true;
  if (tempo === 'advento' || tempo === 'quaresma' || tempo === 'triduo') return false;
  return dia.calendar.dayOfWeek === 0;
}

type Calendario = Record<string, DiaRomcal[]>;
const cache = new Map<number, Promise<Calendario>>();

async function calendarioDoAno(ano: number): Promise<Calendario> {
  let pronto = cache.get(ano);
  if (!pronto) {
    pronto = (async () => {
      const [{ Romcal }, { Brazil_PtBr }] = await Promise.all([import('romcal'), import('@romcal/calendar.brazil')]);
      // No Brasil a Epifania é celebrada no domingo entre 2 e 8 de janeiro.
      // O calendário do Brasil na romcal (dev.140) a deixa em 6/1; por isso forçamos aqui.
      const romcal = new Romcal({ localizedCalendar: Brazil_PtBr, scope: 'gregorian', epiphanyOnSunday: true });
      return (await romcal.generateCalendar(ano)) as unknown as Calendario;
    })();
    cache.set(ano, pronto);
  }
  return pronto;
}

/**
 * Ajusta o dia calculado pela romcal com o que a Paulus publica:
 * a observação da Paulus diz se há Glória (ex.: "(branco, glória, creio...)").
 */
export function ajustarComPaulus(dia: DiaLiturgico, observacaoPaulus: string | undefined): DiaLiturgico {
  if (!observacaoPaulus) return dia;
  return { ...dia, temGloria: /gl[óo]ria/i.test(observacaoPaulus) };
}

/** Dia litúrgico de uma data (AAAA-MM-DD). */
export async function diaLiturgico(data: string): Promise<DiaLiturgico> {
  const calendario = await calendarioDoAno(Number(data.slice(0, 4)));
  const dias = calendario[data];
  if (!dias || dias.length === 0) throw new Error(`A romcal não devolveu a data ${data}`);
  return converterDiaRomcal(data, dias[0]);
}
