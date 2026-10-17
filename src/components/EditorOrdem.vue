<script setup lang="ts">
import { ref } from 'vue';
import type { Bloco } from '../modelo/tipos.ts';

const props = defineProps<{ blocos: Bloco[]; modelValue: string[] }>();
const emit = defineEmits<{ 'update:modelValue': [ordem: string[]] }>();

const arrastando = ref<number | null>(null);

function atualizar(nova: string[]) {
  emit('update:modelValue', nova);
}

function soltar(i: number) {
  if (arrastando.value === null || arrastando.value === i) return;
  const nova = [...props.modelValue];
  const [movido] = nova.splice(arrastando.value, 1);
  nova.splice(i, 0, movido);
  arrastando.value = null;
  atualizar(nova);
}

function remover(i: number) {
  const nova = [...props.modelValue];
  nova.splice(i, 1);
  atualizar(nova);
}

function tipo(id: string) {
  return props.blocos.find((b) => b.id === id)?.tipo ?? 'estrofe';
}

function primeiraLinha(id: string) {
  return props.blocos.find((b) => b.id === id)?.linhas[0] ?? '';
}
</script>

<template>
  <div class="ordem">
    <ol class="etiquetas" aria-label="Ordem de canto">
      <li
        v-for="(id, i) in modelValue"
        :key="i + id"
        draggable="true"
        :class="['etiqueta', tipo(id)]"
        :title="primeiraLinha(id)"
        @dragstart="arrastando = i"
        @dragover.prevent
        @drop.prevent="soltar(i)"
      >
        {{ id }}
        <button class="tirar" :aria-label="`Tirar ${id} desta posição`" @click="remover(i)">×</button>
      </li>
      <li v-if="modelValue.length === 0" class="suave pequeno">Nenhum bloco na ordem.</li>
    </ol>
    <div class="linha pequeno">
      <span class="suave">Acrescentar:</span>
      <button v-for="b in blocos" :key="b.id" class="mini" :title="b.linhas[0]" @click="atualizar([...modelValue, b.id])">
        + {{ b.id }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.etiquetas {
  list-style: none;
  padding: 0;
  margin: 0 0 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.etiqueta {
  cursor: grab;
  font-weight: 600;
}
.etiqueta.refrao {
  background: var(--destaque);
  color: #fff;
}
.tirar {
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0 0.1em;
  opacity: 0.7;
}
.mini {
  padding: 0.1em 0.5em;
  font-size: 0.85rem;
}
</style>
