import { ref, watch, type Ref } from 'vue';
import type { DiaLiturgico } from '../liturgia/calendario.ts';
import { liturgiaDoDia } from '../liturgia/leituras.ts';
import type { DiaPaulus } from '../modelo/paulus.ts';

/** Liturgia e leituras de uma data, atualizadas quando a data muda. */
export function usePreviaLiturgia(data: Ref<string>) {
  const liturgia = ref<DiaLiturgico | null>(null);
  const leituras = ref<DiaPaulus | null>(null);
  const carregando = ref(false);
  const erro = ref('');
  let pedido = 0;

  watch(
    data,
    async (d) => {
      const meu = ++pedido;
      liturgia.value = null;
      leituras.value = null;
      erro.value = '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
      carregando.value = true;
      try {
        const r = await liturgiaDoDia(d);
        if (meu !== pedido) return;
        liturgia.value = r.liturgia;
        leituras.value = r.leituras;
      } catch (e) {
        if (meu === pedido) erro.value = e instanceof Error ? e.message : String(e);
      } finally {
        if (meu === pedido) carregando.value = false;
      }
    },
    { immediate: true },
  );

  return { liturgia, leituras, carregando, erro };
}
