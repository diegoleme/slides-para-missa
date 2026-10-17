<script setup lang="ts">
import { onMounted } from 'vue';
import { useBiblioteca } from './stores/biblioteca.ts';
import { useMissas } from './stores/missas.ts';

const biblioteca = useBiblioteca();
const missas = useMissas();
onMounted(() => biblioteca.carregar());
</script>

<template>
  <header class="topo">
    <RouterLink to="/" class="marca">✝ Slides para Missa</RouterLink>
  </header>
  <div v-if="missas.falhaAoSalvar" class="aviso fixo">
    O navegador não conseguiu salvar as últimas mudanças (o espaço pode estar cheio). Tente remover a imagem de capa
    de missas antigas ou apagar missas que não usa mais.
  </div>
  <RouterView />
</template>

<style scoped>
.topo {
  display: flex;
  align-items: center;
  padding: 0.6rem 1.2rem;
  background: #1f1d1a;
}
.marca {
  color: #fff;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.01em;
}
.fixo {
  margin: 0.8rem 1.2rem 0;
}
</style>
