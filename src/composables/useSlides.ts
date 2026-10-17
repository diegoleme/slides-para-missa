import { computed, ref, type Ref } from 'vue';
import type { Missa } from '../modelo/tipos.ts';
import { criarMedidorCanvas, type Medidor } from '../slides/medidor.ts';
import { gerarSlides, type ResultadoMotor } from '../slides/motor.ts';
import { useBiblioteca } from '../stores/biblioteca.ts';

let medidor: Medidor | null = null;
// Muda quando as fontes do sistema terminam de carregar, para remedir.
const versaoFontes = ref(0);
if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.ready.then(() => {
    medidor = null;
    versaoFontes.value++;
  });
}

function medir(): Medidor {
  if (!medidor) medidor = criarMedidorCanvas();
  return medidor;
}

export function useSlides(missa: Ref<Missa | undefined>) {
  const biblioteca = useBiblioteca();
  const resultado = computed<ResultadoMotor>(() => {
    void versaoFontes.value;
    if (!missa.value) return { slides: [], tamanhoCorpo: 0 };
    return gerarSlides(missa.value, { medir: medir(), item: biblioteca.item });
  });
  return { resultado, slides: computed(() => resultado.value.slides) };
}
