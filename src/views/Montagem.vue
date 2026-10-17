<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import EditorAvisos from '../components/EditorAvisos.vue';
import EditorCanto from '../components/EditorCanto.vue';
import EditorCapa from '../components/EditorCapa.vue';
import EditorLeitura from '../components/EditorLeitura.vue';
import MiniSlide from '../components/MiniSlide.vue';
import Roteiro from '../components/Roteiro.vue';
import { useExportar } from '../composables/useExportar.ts';
import { useSlides } from '../composables/useSlides.ts';
import { HEX_COR, NOMES_COR, NOMES_TEMPO } from '../liturgia/calendario.ts';
import { leiturasDoDia } from '../liturgia/leituras.ts';
import { aplicarLeituras, novoMomento } from '../modelo/roteiro.ts';
import { situacaoDoMomento } from '../modelo/situacao.ts';
import type { Momento, Situacao, TipoLeituraMomento, TipoMomento } from '../modelo/tipos.ts';
import { useBiblioteca } from '../stores/biblioteca.ts';
import { useMissas } from '../stores/missas.ts';
import { dataPorExtenso, diaDaSemana } from '../util/datas.ts';

const props = defineProps<{ id: string }>();
const route = useRoute();
const router = useRouter();
const missas = useMissas();
const biblioteca = useBiblioteca();

const missa = computed(() => missas.missa(props.id));

// No celular a tela é só de consulta.
const consultaCelular = window.matchMedia('(max-width: 900px)');
const celular = ref(consultaCelular.matches);
const aoMudarTela = (e: MediaQueryListEvent) => (celular.value = e.matches);
consultaCelular.addEventListener('change', aoMudarTela);
onUnmounted(() => consultaCelular.removeEventListener('change', aoMudarTela));
const { slides } = useSlides(missa);
const exportar = useExportar(missa, slides);

const selecionado = ref('');
watch(
  () => [route.query.momento, missa.value?.id],
  () => {
    const pedido = typeof route.query.momento === 'string' ? route.query.momento : '';
    const existe = missa.value?.momentos.some((m) => m.id === pedido);
    if (existe) selecionado.value = pedido;
    else if (!missa.value?.momentos.some((m) => m.id === selecionado.value)) selecionado.value = missa.value?.momentos[0]?.id ?? '';
  },
  { immediate: true },
);

function selecionar(id: string) {
  selecionado.value = id;
  router.replace({ query: { momento: id } });
}

const momento = computed(() => missa.value?.momentos.find((m) => m.id === selecionado.value));

const situacoes = computed(() => {
  const mapa: Record<string, Situacao> = {};
  if (!missa.value) return mapa;
  for (const m of missa.value.momentos) mapa[m.id] = situacaoDoMomento(missa.value, m, biblioteca.item);
  return mapa;
});
const atencoes = computed(() => missa.value?.momentos.filter((m) => situacoes.value[m.id]?.sinal === 'atencao') ?? []);

const slidesDoMomento = computed(() => slides.value.filter((s) => s.momentoId === selecionado.value));

// Marca a data de alteração (para a lista de missas salvas).
watch(
  () => (missa.value ? [missa.value.momentos, missa.value.celebracao, missa.value.capa] : null),
  () => {
    if (missa.value) missas.tocar(missa.value);
  },
  { deep: true },
);

function mover(de: number, para: number) {
  const lista = missa.value!.momentos;
  const [m] = lista.splice(de, 1);
  lista.splice(para, 0, m);
}

function remover(id: string) {
  const lista = missa.value!.momentos;
  const i = lista.findIndex((m) => m.id === id);
  if (i < 0) return;
  lista.splice(i, 1);
  if (selecionado.value === id) selecionar(lista[Math.min(i, lista.length - 1)]?.id ?? '');
}

async function acrescentar(escolha: string) {
  const m = missa.value!;
  const [tipo, sub] = escolha.split(':') as [TipoMomento, string | undefined];
  let novo: Momento = novoMomento(tipo, { leitura: sub as TipoLeituraMomento | undefined });
  if (tipo === 'leitura') [novo] = aplicarLeituras([novo], await leiturasDoDia(m.data));
  const i = m.momentos.findIndex((x) => x.id === selecionado.value);
  m.momentos.splice(i >= 0 ? i + 1 : m.momentos.length, 0, novo);
  selecionar(novo.id);
}
</script>

<template>
  <main v-if="!missa" class="nao-encontrada">
    <p>Esta missa não está salva neste navegador.</p>
    <RouterLink to="/" class="botao">Voltar ao início</RouterLink>
  </main>

  <main v-else class="montagem">
    <header class="cabecalho">
      <RouterLink to="/" class="botao discreto" aria-label="Voltar ao início">←</RouterLink>
      <div class="titulo">
        <h1>{{ missa.celebracao }}</h1>
        <p class="pequeno linha">
          <span>{{ diaDaSemana(missa.data) }}, {{ dataPorExtenso(missa.data) }}</span>
          <span class="suave">·</span>
          <span><span class="faixa-cor" :style="{ background: HEX_COR[missa.liturgia.cor] }"></span> {{ NOMES_COR[missa.liturgia.cor] }}</span>
          <span class="suave">·</span>
          <span>{{ NOMES_TEMPO[missa.liturgia.tempo] }}, ano {{ missa.liturgia.ano }}</span>
        </p>
      </div>
      <div class="acoes linha">
        <span v-if="atencoes.length" class="pequeno atencao" :title="atencoes.map((m) => m.nome).join(', ')">
          ⚠ {{ atencoes.length }} {{ atencoes.length === 1 ? 'item pede' : 'itens pedem' }} atenção
        </span>
        <RouterLink :to="{ name: 'slides', params: { id: missa.id } }" class="botao">Ver todos os slides ({{ slides.length }})</RouterLink>
        <button class="principal" :disabled="!!exportar.gerando.value || slides.length === 0" @click="exportar.baixar('pptx')">
          {{ exportar.gerando.value === 'pptx' ? 'Gerando…' : 'Baixar .pptx' }}
        </button>
        <button :disabled="!!exportar.gerando.value || slides.length === 0" @click="exportar.baixar('pdf')">
          {{ exportar.gerando.value === 'pdf' ? `Gerando ${exportar.progresso.value}…` : 'Baixar PDF' }}
        </button>
      </div>
    </header>
    <p v-if="exportar.erro.value" class="aviso">{{ exportar.erro.value }}</p>
    <p v-if="biblioteca.erro" class="aviso">{{ biblioteca.erro }}</p>
    <p class="aviso so-celular">No celular dá só para consultar. Para montar a missa, use um computador.</p>

    <div class="colunas">
      <section class="painel coluna-roteiro">
        <h2>Roteiro</h2>
        <Roteiro
          :momentos="missa.momentos"
          :selecionado="selecionado"
          :situacoes="situacoes"
          :somente-leitura="celular"
          @selecionar="selecionar"
          @mover="mover"
          @remover="remover"
          @acrescentar="acrescentar"
        />
      </section>

      <section class="painel coluna-editor">
        <template v-if="momento">
          <p v-if="situacoes[momento.id]?.sinal === 'atencao'" class="aviso">⚠ {{ situacoes[momento.id].motivo }}</p>
          <EditorCapa v-if="momento.tipo === 'capa'" :missa="missa" />
          <EditorCanto v-else-if="momento.tipo === 'canto' || momento.tipo === 'texto'" :key="momento.id" :missa="missa" :momento="momento" />
          <EditorLeitura v-else-if="momento.tipo === 'leitura'" :key="momento.id" :missa="missa" :momento="momento" />
          <EditorAvisos v-else-if="momento.tipo === 'avisos'" :momento="momento" />
        </template>
        <p v-else class="suave">Escolha um momento no roteiro.</p>
      </section>

      <section class="painel coluna-previa">
        <h2>Prévia</h2>
        <p v-if="slidesDoMomento.length === 0" class="suave pequeno">Este momento ainda não gera slides.</p>
        <ol class="previas">
          <li v-for="(s, i) in slidesDoMomento" :key="i">
            <MiniSlide :slide="s" :largura="360" />
          </li>
        </ol>
      </section>
    </div>
  </main>
</template>

<style scoped>
.montagem {
  padding: 1rem 1.2rem 2rem;
}
.nao-encontrada {
  max-width: 30rem;
  margin: 3rem auto;
  text-align: center;
}
.cabecalho {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.titulo {
  flex: 1;
  min-width: 16rem;
}
.titulo h1 {
  margin-bottom: 0.1em;
}
.titulo p {
  margin: 0;
}
.atencao {
  color: var(--atencao);
  font-weight: 600;
}
.colunas {
  display: grid;
  grid-template-columns: minmax(14rem, 17rem) minmax(0, 1fr) minmax(16rem, 24rem);
  gap: 1rem;
  align-items: start;
}
.coluna-roteiro,
.coluna-previa {
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 2rem);
  overflow: auto;
}
.previas {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.6rem;
}
.so-celular {
  display: none;
}
@media (max-width: 900px) {
  .colunas {
    grid-template-columns: 1fr;
  }
  .coluna-editor,
  .acoes button {
    display: none;
  }
  .so-celular {
    display: block;
  }
  .coluna-roteiro,
  .coluna-previa {
    position: static;
    max-height: none;
  }
}
</style>
