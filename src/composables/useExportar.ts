import { ref, type Ref } from 'vue';
import type { Missa } from '../modelo/tipos.ts';
import type { Slide } from '../slides/tipos.ts';
import { nomeDoArquivo } from '../util/datas.ts';

export function useExportar(missa: Ref<Missa | undefined>, slides: Ref<Slide[]>) {
  const gerando = ref<'' | 'pptx' | 'pdf'>('');
  const progresso = ref('');
  const erro = ref('');

  async function baixar(formato: 'pptx' | 'pdf') {
    if (!missa.value || gerando.value) return;
    gerando.value = formato;
    erro.value = '';
    progresso.value = '';
    const nome = nomeDoArquivo(missa.value.data, missa.value.celebracao);
    try {
      if (formato === 'pptx') {
        const { gerarPptx } = await import('../exportar/pptx.ts');
        await gerarPptx(slides.value, nome, missa.value.celebracao);
      } else {
        const { gerarPdf } = await import('../exportar/pdf.ts');
        const total = slides.value.length;
        await gerarPdf(slides.value, nome, (feitos) => (progresso.value = `${feitos} de ${total}`));
      }
    } catch (e) {
      erro.value = `Não consegui gerar o arquivo: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      gerando.value = '';
      progresso.value = '';
    }
  }

  return { baixar, gerando, progresso, erro };
}
