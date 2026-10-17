<script setup lang="ts">
import { ref } from 'vue';
import type { Missa } from '../modelo/tipos.ts';
import { prepararCapa } from '../util/imagem.ts';

const props = defineProps<{ missa: Missa }>();
const erro = ref('');
const carregando = ref(false);

async function escolher(evento: Event) {
  const input = evento.target as HTMLInputElement;
  const arquivo = input.files?.[0];
  input.value = '';
  if (!arquivo) return;
  erro.value = '';
  carregando.value = true;
  try {
    props.missa.capa = await prepararCapa(arquivo);
  } catch (e) {
    erro.value = e instanceof Error ? e.message : String(e);
  } finally {
    carregando.value = false;
  }
}
</script>

<template>
  <div>
    <div class="campo">
      <label for="celebracao">Nome da celebração (aparece na capa e no nome do arquivo)</label>
      <input id="celebracao" v-model="missa.celebracao" type="text" />
      <button v-if="missa.celebracao !== missa.liturgia.celebracao" class="discreto pequeno" @click="missa.celebracao = missa.liturgia.celebracao">
        Voltar para “{{ missa.liturgia.celebracao }}”
      </button>
    </div>
    <div class="campo">
      <label>Imagem (opcional)</label>
      <p class="pequeno suave">
        Aparece na capa e em todas as aberturas de momento, escurecida para o texto ficar legível.
        É recortada no formato do slide (16:9).
      </p>
      <div class="linha">
        <label class="botao">
          {{ missa.capa ? 'Trocar imagem' : 'Escolher imagem' }}
          <input type="file" accept="image/*" class="oculto" @change="escolher" />
        </label>
        <button v-if="missa.capa" class="discreto perigo" @click="missa.capa = undefined">Remover imagem</button>
        <span v-if="carregando" class="suave pequeno">Preparando…</span>
      </div>
      <p v-if="erro" class="aviso">{{ erro }}</p>
      <img v-if="missa.capa" :src="missa.capa.src" alt="Imagem da capa" class="miniatura" />
    </div>
    <p class="pequeno suave">Ao duplicar a missa, a imagem é removida.</p>
  </div>
</template>

<style scoped>
.oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
label.botao {
  color: var(--texto);
  font-size: 1rem;
  margin: 0;
  position: relative;
}
.miniatura {
  margin-top: 0.6rem;
  width: 100%;
  max-width: 20rem;
  border-radius: 4px;
  display: block;
}
</style>
