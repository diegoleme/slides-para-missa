import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { novoId } from '../modelo/roteiro.ts';
import type { ItemBiblioteca } from '../modelo/tipos.ts';
import { CHAVES, gravar, ler } from '../util/armazenamento.ts';

interface ArquivoBiblioteca {
  versao: number;
  itens: Omit<ItemBiblioteca, 'origem'>[];
}

export const useBiblioteca = defineStore('biblioteca', () => {
  const doProjeto = ref<ItemBiblioteca[]>([]);
  const doUsuario = ref<ItemBiblioteca[]>(ler<ItemBiblioteca[]>(CHAVES.bibliotecaUsuario, []));
  const carregada = ref(false);
  const erro = ref('');

  watch(doUsuario, (v) => gravar(CHAVES.bibliotecaUsuario, v), { deep: true });

  async function carregar() {
    if (carregada.value) return;
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}data/biblioteca.json`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const arquivo = (await r.json()) as ArquivoBiblioteca;
      doProjeto.value = arquivo.itens.map((i) => ({ ...i, origem: 'biblioteca' as const }));
      carregada.value = true;
    } catch {
      erro.value = 'Não consegui carregar a biblioteca do projeto. Seus cantos cadastrados continuam disponíveis.';
    }
  }

  const todos = computed(() => [...doUsuario.value, ...doProjeto.value]);
  const porId = computed(() => new Map(todos.value.map((i) => [i.id, i])));
  const item = (id: string) => porId.value.get(id);

  function adicionar(dados: Omit<ItemBiblioteca, 'id' | 'origem'>): ItemBiblioteca {
    const novo: ItemBiblioteca = { ...dados, id: `u-${novoId()}`, origem: 'usuario' };
    doUsuario.value.unshift(novo);
    return novo;
  }

  function atualizar(id: string, dados: Omit<ItemBiblioteca, 'id' | 'origem'>) {
    const i = doUsuario.value.findIndex((x) => x.id === id);
    if (i >= 0) doUsuario.value[i] = { ...dados, id, origem: 'usuario' };
  }

  function remover(id: string) {
    doUsuario.value = doUsuario.value.filter((x) => x.id !== id);
  }

  return { doProjeto, doUsuario, carregada, erro, carregar, todos, item, adicionar, atualizar, remover };
});
