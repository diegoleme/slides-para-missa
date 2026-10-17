// Sinal de cada momento no roteiro: ✓ preenchido, ○ vazio, ⚠ atenção.

import { NOMES_TEMPO } from '../liturgia/calendario.ts';
import type { ItemBiblioteca, Missa, Momento, Situacao } from './tipos.ts';

function temAleluia(texto: string): boolean {
  return /aleluia/i.test(texto);
}

function textoDoItem(item: ItemBiblioteca): string {
  return item.titulo + ' ' + item.blocos.map((b) => b.linhas.join(' ')).join(' ');
}

export function situacaoDoMomento(
  missa: Missa,
  momento: Momento,
  item: (id: string) => ItemBiblioteca | undefined,
): Situacao {
  const { liturgia } = missa;
  const quaresma = liturgia.tempo === 'quaresma' || liturgia.tempo === 'triduo';

  switch (momento.tipo) {
    case 'capa':
      return { sinal: 'ok' };

    case 'avisos':
      return (momento.avisos ?? '').trim() ? { sinal: 'ok' } : { sinal: 'vazio' };

    case 'leitura': {
      const l = momento.leitura;
      if (momento.leituraSemDados) {
        return { sinal: 'atencao', motivo: 'Não encontrei esta leitura para a data. Preencha à mão ou remova o momento.' };
      }
      if (!l) return { sinal: 'vazio' };
      if (l.tipo === 'aclamacao') {
        if (quaresma && temAleluia(l.aclamacao + ' ' + l.versiculo)) {
          return { sinal: 'atencao', motivo: 'Na Quaresma não se canta Aleluia.' };
        }
        return l.aclamacao.trim() || l.versiculo.trim() ? { sinal: 'ok' } : { sinal: 'vazio' };
      }
      const preenchida = l.tipo === 'salmo' ? l.refrao.trim() || l.referencia.trim() : l.referencia.trim();
      return preenchida ? { sinal: 'ok' } : { sinal: 'vazio' };
    }

    case 'canto':
    case 'texto': {
      const ehGloria = momento.etiqueta === 'gloria';
      if (ehGloria && !liturgia.temGloria) {
        return { sinal: 'atencao', motivo: `Esta missa não tem Glória (${NOMES_TEMPO[liturgia.tempo]}). Remova o momento.` };
      }
      if (!momento.itemId) return { sinal: 'vazio' };
      const it = item(momento.itemId);
      if (!it) return { sinal: 'atencao', motivo: 'Este canto não está mais na biblioteca.' };
      if (it.tempos.length > 0 && !it.tempos.includes(liturgia.tempo)) {
        const tempos = it.tempos.map((t) => NOMES_TEMPO[t]).join(', ');
        return { sinal: 'atencao', motivo: `Canto de outro tempo litúrgico (${tempos}); esta missa é no ${NOMES_TEMPO[liturgia.tempo]}.` };
      }
      if (quaresma && temAleluia(textoDoItem(it))) {
        return { sinal: 'atencao', motivo: 'Na Quaresma não se canta Aleluia.' };
      }
      if (it.momentos.includes('gloria') && !liturgia.temGloria) {
        return { sinal: 'atencao', motivo: `Esta missa não tem Glória (${NOMES_TEMPO[liturgia.tempo]}).` };
      }
      return { sinal: 'ok' };
    }
  }
}
