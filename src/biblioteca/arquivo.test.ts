import { describe, expect, it } from 'vitest';
import type { ItemBiblioteca } from '../modelo/tipos.ts';
import { exportarItens, idDoTitulo, lerArquivoCantos, separarNovos } from './arquivo.ts';

const canto: ItemBiblioteca = {
  id: 'u-1',
  origem: 'usuario',
  categoria: 'canto',
  titulo: 'Canto de Teste',
  autor: 'Fulano',
  blocos: [
    { id: 'R', tipo: 'refrao', linhas: ['refrão'] },
    { id: 'E1', tipo: 'estrofe', linhas: ['estrofe'] },
  ],
  ordem: ['R', 'E1', 'R'],
  momentos: ['entrada'],
  tempos: ['advento'],
};

describe('arquivo de cantos', () => {
  it('exporta e importa sem perder dados (e sem id/origem)', () => {
    const arquivo = JSON.stringify(exportarItens([canto]));
    const [lido] = lerArquivoCantos(arquivo);
    expect(lido).toEqual({
      categoria: 'canto', titulo: 'Canto de Teste', autor: 'Fulano', blocos: canto.blocos,
      ordem: ['R', 'E1', 'R'], momentos: ['entrada'], tempos: ['advento'],
    });
  });

  it('recusa arquivos de outro formato', () => {
    expect(() => lerArquivoCantos('{"itens": []}')).toThrow(/não é um arquivo de cantos/);
    expect(() => lerArquivoCantos('não é json')).toThrow(/não é um arquivo de cantos/);
  });

  it('descarta itens inválidos e etiquetas desconhecidas', () => {
    const arquivo = JSON.stringify({
      formato: 'slides-para-missa/cantos', versao: 1, exportadoEm: '',
      itens: [
        { titulo: '', blocos: [] },
        { titulo: 'Ok', blocos: [{ id: 'E1', tipo: 'estrofe', linhas: ['a'] }], ordem: ['E1', 'X'], momentos: ['entrada', 'inventado'], tempos: ['natal', 'verao'] },
      ],
    });
    const itens = lerArquivoCantos(arquivo);
    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({ ordem: ['E1'], momentos: ['entrada'], tempos: ['natal'] });
  });

  it('reconhece cantos repetidos por título e primeira linha', () => {
    const { novos, repetidos } = separarNovos([canto, { ...canto, titulo: 'canto de teste!' }, { ...canto, titulo: 'Outro' }], [canto]);
    expect(repetidos).toBe(2);
    expect(novos.map((n) => n.titulo)).toEqual(['Outro']);
  });

  it('cria ids a partir do título, sem repetir', () => {
    const usados = new Set(['canto-de-teste']);
    expect(idDoTitulo('Canto de Teste', usados)).toBe('canto-de-teste-2');
    expect(idDoTitulo('Ave, Maria!', usados)).toBe('ave-maria');
  });
});
