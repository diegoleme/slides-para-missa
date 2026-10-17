<script setup lang="ts">
import { computed } from 'vue';
import MiniSlide from '../components/MiniSlide.vue';
import { useExportar } from '../composables/useExportar.ts';
import { useSlides } from '../composables/useSlides.ts';
import { useMissas } from '../stores/missas.ts';
import { dataPorExtenso } from '../util/datas.ts';

const props = defineProps<{ id: string }>();
const missas = useMissas();
const missa = computed(() => missas.missa(props.id));
const { slides } = useSlides(missa);
const exportar = useExportar(missa, slides);

const nomeMomento = (id: string) => missa.value?.momentos.find((m) => m.id === id)?.nome ?? '';
</script>

<template>
  <main v-if="!missa" class="todos">
    <p>Esta missa não está salva neste navegador.</p>
    <RouterLink to="/" class="botao">Voltar ao início</RouterLink>
  </main>
  <main v-else class="todos">
    <header class="linha cabecalho">
      <RouterLink :to="{ name: 'montagem', params: { id: missa.id } }" class="botao discreto">← Voltar à montagem</RouterLink>
      <div class="espaco">
        <h1>{{ missa.celebracao }}</h1>
        <p class="pequeno suave">{{ dataPorExtenso(missa.data) }} · {{ slides.length }} slides · clique num slide para editar o item que o gerou</p>
      </div>
      <button class="principal" :disabled="!!exportar.gerando.value || slides.length === 0" @click="exportar.baixar('pptx')">
        {{ exportar.gerando.value === 'pptx' ? 'Gerando…' : 'Baixar .pptx' }}
      </button>
      <button :disabled="!!exportar.gerando.value || slides.length === 0" @click="exportar.baixar('pdf')">
        {{ exportar.gerando.value === 'pdf' ? `Gerando ${exportar.progresso.value}…` : 'Baixar PDF' }}
      </button>
    </header>
    <p v-if="exportar.erro.value" class="aviso">{{ exportar.erro.value }}</p>
    <ol class="grade">
      <li v-for="(s, i) in slides" :key="i">
        <RouterLink :to="{ name: 'montagem', params: { id: missa.id }, query: { momento: s.momentoId } }" class="cartao">
          <MiniSlide :slide="s" :largura="300" />
          <span class="pequeno"><span class="suave">{{ i + 1 }}.</span> {{ nomeMomento(s.momentoId) }}</span>
        </RouterLink>
      </li>
    </ol>
  </main>
</template>

<style scoped>
.todos {
  padding: 1rem 1.2rem 2rem;
}
.cabecalho {
  margin-bottom: 1rem;
}
.cabecalho h1 {
  margin-bottom: 0.1em;
}
.cabecalho p {
  margin: 0;
}
.grade {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(15rem, 100%), 1fr));
  gap: 0.9rem;
}
.cartao {
  display: grid;
  gap: 0.3rem;
  text-decoration: none;
  color: var(--texto);
  padding: 0.3rem;
  border-radius: var(--raio);
  border: 2px solid transparent;
}
.cartao:hover,
.cartao:focus-visible {
  border-color: var(--destaque);
}
</style>
