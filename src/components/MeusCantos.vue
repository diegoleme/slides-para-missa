<script setup lang="ts">
import { ref } from 'vue';
import { exportarItens, lerArquivoCantos } from '../biblioteca/arquivo.ts';
import { useBiblioteca } from '../stores/biblioteca.ts';
import { hojeIso } from '../util/datas.ts';

const biblioteca = useBiblioteca();
const mensagem = ref('');
const erro = ref('');

function exportar() {
  const conteudo = JSON.stringify(exportarItens(biblioteca.doUsuario), null, 2);
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `cantos ${hojeIso()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importar(evento: Event) {
  const input = evento.target as HTMLInputElement;
  const arquivo = input.files?.[0];
  input.value = '';
  if (!arquivo) return;
  mensagem.value = '';
  erro.value = '';
  try {
    const { adicionados, repetidos } = biblioteca.importar(lerArquivoCantos(await arquivo.text()));
    mensagem.value =
      `${adicionados} ${adicionados === 1 ? 'canto importado' : 'cantos importados'}` +
      (repetidos ? `; ${repetidos} já ${repetidos === 1 ? 'existia' : 'existiam'} e ${repetidos === 1 ? 'foi pulado' : 'foram pulados'}.` : '.');
  } catch (e) {
    erro.value = e instanceof Error ? e.message : String(e);
  }
}
</script>

<template>
  <section class="painel">
    <h2>Meus cantos</h2>
    <p class="pequeno suave">
      {{ biblioteca.doUsuario.length }}
      {{ biblioteca.doUsuario.length === 1 ? 'canto cadastrado' : 'cantos cadastrados' }} neste navegador.
      Exporte para passar a outra pessoa do ministério ou para enviar à biblioteca do projeto.
    </p>
    <div class="linha">
      <button :disabled="biblioteca.doUsuario.length === 0" @click="exportar">Exportar meus cantos</button>
      <label class="botao">
        Importar cantos
        <input type="file" accept="application/json,.json" class="oculto" @change="importar" />
      </label>
    </div>
    <p v-if="mensagem" class="pequeno ok">{{ mensagem }}</p>
    <p v-if="erro" class="aviso">{{ erro }}</p>
  </section>
</template>

<style scoped>
.oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
label.botao {
  position: relative;
  color: var(--texto);
  font-size: 1rem;
  margin: 0;
}
.ok {
  color: var(--ok);
  margin: 0.6rem 0 0;
}
p.aviso {
  margin: 0.6rem 0 0;
}
</style>
