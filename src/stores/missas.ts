import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { liturgiaDoDia } from '../liturgia/leituras.ts';
import { criarMissa, duplicarMissa } from '../modelo/missa.ts';
import type { Missa } from '../modelo/tipos.ts';
import { CHAVES, gravar, ler } from '../util/armazenamento.ts';

export const useMissas = defineStore('missas', () => {
  const missas = ref<Missa[]>(ler<Missa[]>(CHAVES.missas, []));
  /** Mensagem quando o navegador não conseguiu salvar. */
  const falhaAoSalvar = ref(false);

  // Salvamento automático (com um pequeno atraso para não gravar a cada tecla).
  let espera: ReturnType<typeof setTimeout> | undefined;
  watch(
    missas,
    (v) => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        falhaAoSalvar.value = !gravar(CHAVES.missas, v);
      }, 400);
    },
    { deep: true },
  );

  const ordenadas = computed(() => [...missas.value].sort((a, b) => b.data.localeCompare(a.data) || b.atualizadaEm.localeCompare(a.atualizadaEm)));

  const missa = (id: string) => missas.value.find((m) => m.id === id);

  async function nova(data: string): Promise<Missa> {
    const { liturgia, leituras } = await liturgiaDoDia(data);
    const m = criarMissa(data, liturgia, leituras);
    missas.value.push(m);
    return m;
  }

  async function duplicar(id: string, data: string): Promise<Missa> {
    const origem = missa(id);
    if (!origem) throw new Error('Missa não encontrada.');
    const { liturgia, leituras } = await liturgiaDoDia(data);
    const m = duplicarMissa(origem, data, liturgia, leituras);
    missas.value.push(m);
    return m;
  }

  function remover(id: string) {
    missas.value = missas.value.filter((m) => m.id !== id);
  }

  function tocar(m: Missa) {
    m.atualizadaEm = new Date().toISOString();
  }

  return { missas, ordenadas, missa, nova, duplicar, remover, tocar, falhaAoSalvar };
});
