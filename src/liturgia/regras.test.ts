import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Brazil_PtBr } from '@romcal/calendar.brazil';
import { Romcal } from 'romcal';
import { describe, expect, it } from 'vitest';
import type { ArquivoLeiturasMes, DiaPaulus } from '../modelo/paulus.ts';
import { anoLiturgico, batismoDoSenhor, epifania, gloriaPadrao, inicioDoAdvento, pascoa, tempoLiturgico } from './regras.ts';

describe('regras do calendário', () => {
  it('calcula a Páscoa', () => {
    expect(pascoa(2025)).toBe('2025-04-20');
    expect(pascoa(2026)).toBe('2026-04-05');
    expect(pascoa(2027)).toBe('2027-03-28');
    expect(pascoa(2038)).toBe('2038-04-25');
  });

  it('calcula Advento, Epifania (domingo, no Brasil) e Batismo do Senhor', () => {
    expect(inicioDoAdvento(2026)).toBe('2026-11-29');
    expect(inicioDoAdvento(2027)).toBe('2027-11-28');
    expect(epifania(2027)).toBe('2027-01-03');
    expect(batismoDoSenhor(2027)).toBe('2027-01-10');
    // Epifania em 8/1 → Batismo na segunda-feira, 9/1.
    expect(epifania(2023)).toBe('2023-01-08');
    expect(batismoDoSenhor(2023)).toBe('2023-01-09');
  });

  it('dá o tempo e o ano de datas conhecidas', () => {
    expect([tempoLiturgico('2026-10-18'), anoLiturgico('2026-10-18')]).toEqual(['comum', 'A']);
    expect([tempoLiturgico('2026-11-29'), anoLiturgico('2026-11-29')]).toEqual(['advento', 'B']);
    expect(tempoLiturgico('2026-12-25')).toBe('natal');
    expect(tempoLiturgico('2027-01-11')).toBe('comum');
    expect(tempoLiturgico('2027-02-10')).toBe('quaresma'); // Cinzas
    expect(tempoLiturgico('2027-03-25')).toBe('triduo'); // Quinta-feira Santa
    expect(tempoLiturgico('2027-03-28')).toBe('pascoa');
    expect(tempoLiturgico('2027-05-16')).toBe('pascoa'); // Pentecostes
    expect(tempoLiturgico('2027-05-17')).toBe('comum');
  });
});

// A romcal (só nos testes) confere as regras em 16 anos.
// Diferença proposital: a Quinta-feira Santa conta como Tríduo, porque a missa da
// paróquia nesse dia é a da Ceia do Senhor; para a romcal, o dia é da Quaresma.
describe('regras × romcal (2020–2035)', () => {
  const TEMPO: Record<string, string> = {
    ADVENT: 'advento', CHRISTMAS_TIME: 'natal', LENT: 'quaresma',
    PASCHAL_TRIDUUM: 'triduo', EASTER_TIME: 'pascoa', ORDINARY_TIME: 'comum',
  };
  const ANO: Record<string, string> = { YEAR_A: 'A', YEAR_B: 'B', YEAR_C: 'C' };

  it('tempo e ano batem dia a dia', { timeout: 60000 }, async () => {
    const divergencias: string[] = [];
    for (let ano = 2020; ano <= 2035; ano++) {
      const quintaSanta = new Date(new Date(pascoa(ano) + 'T12:00:00Z').getTime() - 3 * 86400000).toISOString().slice(0, 10);
      const cal = await new Romcal({ localizedCalendar: Brazil_PtBr, epiphanyOnSunday: true }).generateCalendar(ano);
      for (const [data, lista] of Object.entries(cal)) {
        if (data === quintaSanta) continue;
        const d = lista[0] as unknown as { seasons: string[]; cycles: { sundayCycle: string } };
        const tempos = d.seasons.map((s) => TEMPO[s]);
        if (!tempos.includes(tempoLiturgico(data)) || ANO[d.cycles.sundayCycle] !== anoLiturgico(data)) {
          divergencias.push(data);
        }
      }
    }
    expect(divergencias).toEqual([]);
  });
});

// Confere as regras com o que a Paulus publicou (roda de novo a cada coleta do robô).
describe('regras × dados da Paulus', () => {
  const pasta = join(process.cwd(), 'public', 'data', 'leituras');
  const dias: DiaPaulus[] = readdirSync(pasta)
    .filter((n) => /^\d{4}-\d{2}\.json$/.test(n))
    .flatMap((n) => Object.values((JSON.parse(readFileSync(join(pasta, n), 'utf8')) as ArquivoLeiturasMes).dias));

  it('o tempo citado no nome da celebração bate com o calculado', () => {
    const PISTAS: [RegExp, string][] = [
      [/ADVENTO/, 'advento'],
      [/QUARESMA|CINZAS/, 'quaresma'],
      [/TEMPO COMUM/, 'comum'],
      [/P[ÁA]SCOA|PASCAL/, 'pascoa'],
    ];
    const erradas: string[] = [];
    for (const dia of dias) {
      const nome = `${dia.celebracao} ${dia.cabecalho}`.toUpperCase();
      for (const [pista, tempo] of PISTAS) {
        if (pista.test(nome) && tempoLiturgico(dia.data) !== tempo) erradas.push(`${dia.data} ${nome}`);
      }
    }
    expect(erradas).toEqual([]);
  });

  it('nos domingos, o Glória de reserva bate com a Paulus', () => {
    const erradas = dias
      .filter((d) => d.observacao && new Date(d.data + 'T12:00:00Z').getUTCDay() === 0)
      .filter((d) => /gl[óo]ria/i.test(d.observacao!) !== gloriaPadrao(d.data))
      .map((d) => `${d.data} ${d.observacao}`);
    expect(erradas).toEqual([]);
  });
});
