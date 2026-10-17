<script setup lang="ts">
import type { Momento } from '../modelo/tipos.ts';

defineProps<{ momento: Momento }>();
</script>

<template>
  <div>
    <div class="campo">
      <label :for="`nome-${momento.id}`">Nome do momento</label>
      <input :id="`nome-${momento.id}`" v-model="momento.nome" type="text" />
    </div>
    <div class="campo">
      <label :for="`avisos-${momento.id}`">Avisos — cada linha em branco começa um novo slide</label>
      <textarea
        :id="`avisos-${momento.id}`"
        v-model="momento.avisos"
        rows="14"
        placeholder="Domingo que vem: festa da padroeira, depois da missa das 10h.&#10;&#10;Inscrições para a catequese na secretaria."
      ></textarea>
    </div>
    <p class="pequeno suave">Ao duplicar a missa, os avisos são apagados.</p>
  </div>
</template>
