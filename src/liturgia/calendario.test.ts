import { describe, expect, it } from 'vitest';
import type { DiaPaulus } from '../modelo/paulus.ts';
import { montarDiaLiturgico, nomeLegivel } from './calendario.ts';

const paulus = (extra: Partial<DiaPaulus>): DiaPaulus => ({
  data: '2027-01-17', url: 'u', modificadoEm: 'm', cabecalho: '', celebracao: '', leituras: [], ...extra,
});

describe('dia litúrgico', () => {
  it('deixa o nome da Paulus legível', () => {
    expect(nomeLegivel('NOSSO SENHOR JESUS CRISTO, REI DO UNIVERSO')).toBe('Nosso Senhor Jesus Cristo, Rei do Universo');
    expect(nomeLegivel('27ª SEMANA DO TEMPO COMUM*')).toBe('27ª Semana do Tempo Comum');
    expect(nomeLegivel('BEM-AVENTURADA VIRGEM MARIA DA CONCEIÇÃO APARECIDA')).toBe('Bem-aventurada Virgem Maria da Conceição Aparecida');
    expect(nomeLegivel('SÃO JOÃO XXIII, PAPA')).toBe('São João XXIII, Papa');
    expect(nomeLegivel('EPIFANIA DO SENHOR')).toBe('Epifania do Senhor');
  });

  it('usa nome, cor e Glória da Paulus; tempo e ano das regras', () => {
    const d = montarDiaLiturgico('2026-11-01', paulus({
      data: '2026-11-01', celebracao: 'TODOS OS SANTOS E SANTAS', cor: 'branco',
      observacao: '(branco, glória, creio, prefácio próprio – ofício da solenidade)',
    }));
    expect(d).toEqual({
      data: '2026-11-01', celebracao: 'Todos os Santos e Santas', cor: 'branco', tempo: 'comum', ano: 'A', temGloria: true, fonte: 'paulus',
    });
  });

  it('usa o cabeçalho quando a Paulus não traz a celebração', () => {
    const d = montarDiaLiturgico('2027-01-17', paulus({ cabecalho: 'Dia 17 – 2º DOMINGO DO TEMPO COMUM', cor: 'verde' }));
    expect(d.celebracao).toBe('2º Domingo do Tempo Comum');
  });

  it('não usa um cabeçalho que só tem o dia da semana', () => {
    const d = montarDiaLiturgico('2027-02-24', paulus({ data: '2027-02-24', cabecalho: '24 – QUARTA-FEIRA' }));
    expect(d.celebracao).toBe('Quarta-feira – Quaresma');
  });

  it('sem Paulus, calcula tudo pelas regras', () => {
    expect(montarDiaLiturgico('2027-03-21', null)).toEqual({
      data: '2027-03-21', celebracao: 'Domingo – Quaresma', cor: 'vermelho', tempo: 'quaresma', ano: 'B', temGloria: false, fonte: 'regras',
    });
    expect(montarDiaLiturgico('2027-04-11', null)).toMatchObject({ cor: 'branco', tempo: 'pascoa', temGloria: true });
  });
});
