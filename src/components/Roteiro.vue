<script setup lang="ts">
import { ref } from 'vue';
import type { Momento, Situacao } from '../modelo/tipos.ts';

const props = defineProps<{
  momentos: Momento[];
  selecionado: string;
  situacoes: Record<string, Situacao>;
  somenteLeitura?: boolean;
}>();

const emit = defineEmits<{
  selecionar: [id: string];
  mover: [de: number, para: number];
  remover: [id: string];
  acrescentar: [tipo: string];
}>();

const SIMBOLO = { ok: '✓', vazio: '○', atencao: '⚠' } as const;
const TITULO_SINAL = { ok: 'Preenchido', vazio: 'Vazio', atencao: 'Atenção' } as const;

const arrastando = ref<number | null>(null);
const sobre = ref<number | null>(null);

function soltar(i: number) {
  if (arrastando.value !== null && arrastando.value !== i) emit('mover', arrastando.value, i);
  arrastando.value = null;
  sobre.value = null;
}

const escolha = ref('');
function acrescentar() {
  if (escolha.value) emit('acrescentar', escolha.value);
  escolha.value = '';
}

function mover(i: number, delta: number) {
  const para = i + delta;
  if (para >= 0 && para < props.momentos.length) emit('mover', i, para);
}
</script>

<template>
  <nav class="roteiro" aria-label="Roteiro da missa">
    <ol>
      <li
        v-for="(m, i) in momentos"
        :key="m.id"
        :class="{ ativo: m.id === selecionado, sobre: sobre === i && arrastando !== i }"
        :draggable="!somenteLeitura"
        @dragstart="arrastando = i"
        @dragover.prevent="sobre = i"
        @dragleave="sobre = null"
        @drop.prevent="soltar(i)"
        @dragend="arrastando = null; sobre = null"
      >
        <button class="item" :title="situacoes[m.id]?.motivo" @click="emit('selecionar', m.id)">
          <span
            class="sinal"
            :class="situacoes[m.id]?.sinal"
            :title="TITULO_SINAL[situacoes[m.id]?.sinal ?? 'vazio']"
          >{{ SIMBOLO[situacoes[m.id]?.sinal ?? 'vazio'] }}</span>
          <span class="nome">{{ m.nome }}</span>
        </button>
        <span v-if="!somenteLeitura" class="acoes">
          <button class="discreto" title="Subir" aria-label="Subir" :disabled="i === 0" @click="mover(i, -1)">↑</button>
          <button class="discreto" title="Descer" aria-label="Descer" :disabled="i === momentos.length - 1" @click="mover(i, 1)">↓</button>
          <button class="discreto" title="Remover do roteiro" aria-label="Remover" @click="emit('remover', m.id)">×</button>
        </span>
      </li>
    </ol>
    <div v-if="!somenteLeitura" class="acrescentar">
      <label for="novo-momento">Acrescentar momento (depois do selecionado)</label>
      <div class="linha">
        <select id="novo-momento" v-model="escolha" @change="acrescentar">
          <option value="" disabled>Escolha…</option>
          <option value="canto">Canto</option>
          <option value="canto:adoracao">Adoração ao Santíssimo (canto)</option>
          <option value="texto">Texto (oração, orientação)</option>
          <option value="leitura:primeira">Primeira leitura</option>
          <option value="leitura:salmo">Salmo responsorial</option>
          <option value="leitura:segunda">Segunda leitura</option>
          <option value="leitura:aclamacao">Aclamação ao Evangelho</option>
          <option value="leitura:evangelho">Evangelho</option>
          <option value="avisos">Avisos</option>
          <option value="capa">Capa</option>
        </select>
      </div>
    </div>
  </nav>
</template>

<style scoped>
ol {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
}
li {
  display: flex;
  align-items: center;
  border-radius: var(--raio);
  border: 1px solid transparent;
}
li.ativo {
  background: var(--destaque-claro);
  border-color: #e3cfb4;
}
li.sobre {
  border-top: 2px solid var(--destaque);
}
li[draggable='true'] {
  cursor: grab;
}
.item {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 0.35em 0.4em;
}
.nome {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.acoes {
  display: none;
}
li:hover .acoes,
li.ativo .acoes,
li:focus-within .acoes {
  display: flex;
}
.acoes button {
  padding: 0.1em 0.4em;
}
</style>
