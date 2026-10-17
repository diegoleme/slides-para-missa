<script setup lang="ts">
import { computed, watch } from 'vue';
import type { Missa, Momento } from '../modelo/tipos.ts';

const props = defineProps<{ missa: Missa; momento: Momento }>();
const l = computed(() => props.momento.leitura!);

// Ao preencher à mão, o ⚠ de "sem dados" sai.
watch(
  () => [l.value.titulo, l.value.referencia, l.value.refrao, l.value.aclamacao, l.value.versiculo].join('|'),
  (texto) => {
    if (props.momento.leituraSemDados && texto.replace(/\|/g, '').trim()) props.momento.leituraSemDados = false;
  },
);

const id = (campo: string) => `${campo}-${props.momento.id}`;
</script>

<template>
  <div v-if="momento.leitura">
    <div class="campo">
      <label :for="id('nome')">Nome do momento</label>
      <input :id="id('nome')" v-model="momento.nome" type="text" />
    </div>
    <p v-if="momento.leituraSemDados" class="aviso">
      ⚠ Não encontrei esta leitura da Paulus para {{ missa.data.split('-').reverse().join('/') }}.
      Preencha à mão (consulte a
      <a href="https://www.paulus.com.br/portal/liturgia-diaria/" target="_blank" rel="noopener">Liturgia Diária</a>)
      ou remova o momento do roteiro.
    </p>
    <p v-else class="pequeno suave">Preenchido com os dados da Paulus. Tudo pode ser editado.</p>

    <template v-if="l.tipo === 'aclamacao'">
      <div class="campo">
        <label :for="id('acl')">Aclamação</label>
        <input :id="id('acl')" v-model="l.aclamacao" type="text" placeholder="Aleluia, aleluia, aleluia." />
      </div>
      <div class="campo">
        <label :for="id('vers')">Versículo (use / para quebrar a linha)</label>
        <textarea :id="id('vers')" v-model="l.versiculo" rows="3"></textarea>
      </div>
    </template>

    <template v-else>
      <div class="campo">
        <label :for="id('rot')">Rótulo</label>
        <input :id="id('rot')" v-model="l.rotulo" type="text" />
      </div>
      <div v-if="l.tipo !== 'salmo'" class="campo">
        <label :for="id('tit')">Título</label>
        <input :id="id('tit')" v-model="l.titulo" type="text" placeholder="Ex.: Leitura do livro do profeta Isaías" />
      </div>
      <div class="campo">
        <label :for="id('ref')">{{ l.tipo === 'salmo' ? 'Salmo' : 'Referência' }}</label>
        <input :id="id('ref')" v-model="l.referencia" type="text" :placeholder="l.tipo === 'salmo' ? 'Ex.: 22(23)' : 'Ex.: Isaías 45,1.4-6'" />
      </div>
      <div v-if="l.tipo === 'salmo'" class="campo">
        <label :for="id('refrao')">Refrão (use / para quebrar a linha)</label>
        <textarea :id="id('refrao')" v-model="l.refrao" rows="3"></textarea>
      </div>
    </template>
    <p class="pequeno suave">O texto completo da leitura não aparece nos slides.</p>
  </div>
</template>
