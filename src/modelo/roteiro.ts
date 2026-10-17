// Roteiro padrão da missa dominical e preenchimento das leituras.

import type { DiaPaulus, LeituraPaulus } from './paulus.ts';
import type { DadosLeitura, EtiquetaMomento, Momento, TipoLeituraMomento } from './tipos.ts';

export function novoId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

const ROTULOS_LEITURA: Record<TipoLeituraMomento, string> = {
  primeira: 'Primeira Leitura',
  salmo: 'Salmo Responsorial',
  segunda: 'Segunda Leitura',
  aclamacao: 'Aclamação ao Evangelho',
  evangelho: 'Evangelho',
};

export function leituraVazia(tipo: TipoLeituraMomento): DadosLeitura {
  return { tipo, rotulo: ROTULOS_LEITURA[tipo], titulo: '', referencia: '', refrao: '', aclamacao: '', versiculo: '' };
}

function canto(nome: string, etiqueta: EtiquetaMomento): Momento {
  return { id: novoId(), tipo: 'canto', nome, etiqueta };
}

function texto(nome: string, etiqueta: EtiquetaMomento, itemId?: string): Momento {
  return { id: novoId(), tipo: 'texto', nome, etiqueta, itemId };
}

function leitura(nome: string, tipo: TipoLeituraMomento): Momento {
  return { id: novoId(), tipo: 'leitura', nome, leitura: leituraVazia(tipo) };
}

/** Roteiro padrão da missa dominical. Ajustável em cada missa. */
export function roteiroPadrao(): Momento[] {
  return [
    { id: novoId(), tipo: 'capa', nome: 'Capa' },
    canto('Canto de entrada', 'entrada'),
    canto('Ato penitencial', 'ato-penitencial'),
    canto('Glória', 'gloria'),
    leitura('Primeira leitura', 'primeira'),
    leitura('Salmo responsorial', 'salmo'),
    leitura('Segunda leitura', 'segunda'),
    leitura('Aclamação ao Evangelho', 'aclamacao'),
    leitura('Evangelho', 'evangelho'),
    texto('Profissão de fé', 'creio'),
    canto('Ofertório', 'ofertorio'),
    canto('Santo', 'santo'),
    texto('Consagração', 'consagracao', 'orientacao-ajoelhe-se'),
    texto('Pai-Nosso', 'pai-nosso', 'orientacao-pai-nosso'),
    canto('Cordeiro de Deus', 'cordeiro'),
    canto('Comunhão', 'comunhao'),
    texto('Ação de graças', 'pos-comunhao', 'alma-de-cristo'),
    { id: novoId(), tipo: 'avisos', nome: 'Avisos', avisos: '' },
    canto('Canto final', 'final'),
  ];
}

/** Tipos de momento que podem ser acrescentados ao roteiro. */
export function novoMomento(tipo: Momento['tipo'], extra?: { leitura?: TipoLeituraMomento; etiqueta?: EtiquetaMomento; nome?: string }): Momento {
  switch (tipo) {
    case 'canto':
      return canto(extra?.nome ?? 'Canto', extra?.etiqueta ?? 'outro');
    case 'texto':
      return texto(extra?.nome ?? 'Texto', extra?.etiqueta ?? 'outro');
    case 'leitura': {
      const t = extra?.leitura ?? 'primeira';
      return leitura(extra?.nome ?? ROTULOS_LEITURA[t], t);
    }
    case 'avisos':
      return { id: novoId(), tipo: 'avisos', nome: extra?.nome ?? 'Avisos', avisos: '' };
    case 'capa':
      return { id: novoId(), tipo: 'capa', nome: extra?.nome ?? 'Capa' };
  }
}

function deLeituraPaulus(tipo: TipoLeituraMomento, l: LeituraPaulus | undefined): DadosLeitura | null {
  if (!l) return null;
  const base = leituraVazia(tipo);
  if (tipo === 'aclamacao') {
    if (!l.aclamacao && !l.versiculo) return null;
    return { ...base, aclamacao: l.aclamacao ?? '', versiculo: l.versiculo ?? '' };
  }
  return {
    ...base,
    rotulo: tipo === 'evangelho' ? 'Evangelho' : l.rotulo || base.rotulo,
    titulo: l.titulo ?? '',
    referencia: l.referencia ?? '',
    refrao: l.refrao ?? '',
  };
}

/**
 * Preenche os momentos de leitura com os dados da Paulus.
 * Quando não há dado para um momento, os campos ficam vazios e ele recebe ⚠.
 */
export function aplicarLeituras(momentos: Momento[], dia: DiaPaulus | null): Momento[] {
  return momentos.map((m) => {
    if (m.tipo !== 'leitura' || !m.leitura) return m;
    const tipo = m.leitura.tipo;
    const fonte = tipo === 'aclamacao'
      ? dia?.leituras.find((l) => l.tipo === 'evangelho')
      : dia?.leituras.find((l) => l.tipo === tipo);
    const dados = deLeituraPaulus(tipo, fonte);
    return dados
      ? { ...m, leitura: dados, leituraSemDados: false }
      : { ...m, leitura: leituraVazia(tipo), leituraSemDados: true };
  });
}
