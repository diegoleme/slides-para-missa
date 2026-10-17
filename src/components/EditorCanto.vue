<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { buscar } from '../biblioteca/busca.ts';
import { NOMES_TEMPO } from '../liturgia/calendario.ts';
import { NOMES_ETIQUETA, type EtiquetaMomento, type ItemBiblioteca, type Missa, type Momento } from '../modelo/tipos.ts';
import { useBiblioteca } from '../stores/biblioteca.ts';
import CadastroItem from './CadastroItem.vue';
import EditorOrdem from './EditorOrdem.vue';

const props = defineProps<{ missa: Missa; momento: Momento }>();
const biblioteca = useBiblioteca();

const categoria = computed(() => (props.momento.tipo === 'texto' ? 'texto' : 'canto'));
const item = computed(() => (props.momento.itemId ? biblioteca.item(props.momento.itemId) : undefined));

const modo = ref<'ver' | 'buscar' | 'cadastrar' | 'editar'>('ver');
watch(
  () => props.momento.id,
  () => {
    modo.value = props.momento.itemId ? 'ver' : 'buscar';
    termo.value = '';
    filtrarMomento.value = true;
    filtrarTempo.value = true;
  },
  { immediate: true },
);

const termo = ref('');
const filtrarMomento = ref(true);
const filtrarTempo = ref(true);
const resultados = computed(() =>
  buscar(biblioteca.todos, termo.value, {
    etiqueta: filtrarMomento.value ? props.momento.etiqueta : undefined,
    tempo: filtrarTempo.value ? props.missa.liturgia.tempo : undefined,
  }).slice(0, 60),
);

function escolher(it: ItemBiblioteca) {
  props.momento.itemId = it.id;
  props.momento.ordem = undefined;
  modo.value = 'ver';
}

function tirar() {
  props.momento.itemId = undefined;
  props.momento.ordem = undefined;
  modo.value = 'buscar';
}

const ordem = computed({
  get: () => props.momento.ordem ?? item.value?.ordem ?? [],
  set: (v: string[]) => {
    props.momento.ordem = v;
  },
});

const mostrarAbertura = computed({
  get: () => !props.momento.semAbertura,
  set: (v: boolean) => {
    props.momento.semAbertura = !v;
  },
});

const etiquetas = Object.entries(NOMES_ETIQUETA) as [EtiquetaMomento, string][];

function trechoDaLetra(it: ItemBiblioteca) {
  return it.blocos[0]?.linhas.slice(0, 2).join(' / ') ?? '';
}
</script>

<template>
  <div class="editor-canto">
    <div class="linha campo">
      <div class="espaco">
        <label :for="`nome-${momento.id}`">Nome do momento</label>
        <input :id="`nome-${momento.id}`" v-model="momento.nome" type="text" />
      </div>
      <div>
        <label :for="`etq-${momento.id}`">Etiqueta</label>
        <select :id="`etq-${momento.id}`" v-model="momento.etiqueta">
          <option v-for="[valor, nome] in etiquetas" :key="valor" :value="valor">{{ nome }}</option>
        </select>
      </div>
    </div>

    <!-- Item escolhido -->
    <section v-if="modo === 'ver' && item" class="escolhido">
      <div class="linha">
        <div class="espaco">
          <h3>{{ item.titulo }}</h3>
          <p class="pequeno suave">
            {{ item.origem === 'usuario' ? 'Cadastrado por você' : 'Biblioteca do projeto' }}
            <template v-if="item.autor"> · {{ item.autor }}</template>
          </p>
          <p v-if="item.fonte" class="pequeno suave">{{ item.fonte }}</p>
        </div>
        <button @click="modo = 'buscar'">Trocar</button>
        <button @click="modo = 'editar'">Editar letra</button>
        <button class="discreto perigo" @click="tirar">Tirar</button>
      </div>

      <template v-if="item.blocos.length > 1">
        <label>Ordem nesta missa</label>
        <EditorOrdem v-model="ordem" :blocos="item.blocos" />
        <p v-if="momento.ordem" class="pequeno">
          <span class="suave">Ordem alterada só nesta missa.</span>
          <button class="discreto" @click="momento.ordem = undefined">Voltar à ordem do canto</button>
        </p>
      </template>

      <label v-if="momento.tipo === 'canto'" class="caixa">
        <input v-model="mostrarAbertura" type="checkbox" />
        Mostrar slide de abertura com o título
      </label>
    </section>
    <p v-else-if="modo === 'ver' && momento.itemId" class="aviso">
      O item escolhido não está mais na biblioteca.
      <button @click="tirar">Escolher outro</button>
    </p>

    <!-- Busca -->
    <section v-if="modo === 'buscar'">
      <div class="linha campo">
        <input v-model="termo" type="search" :placeholder="`Buscar ${categoria === 'canto' ? 'canto' : 'texto'} por título ou trecho`" class="espaco" />
        <button @click="modo = 'cadastrar'">Cadastrar novo</button>
        <button v-if="item" class="discreto" @click="modo = 'ver'">Voltar</button>
      </div>
      <div class="linha pequeno filtros">
        <span class="suave">Filtros:</span>
        <button
          v-if="momento.etiqueta && momento.etiqueta !== 'outro'"
          class="etiqueta"
          :class="{ desligado: !filtrarMomento }"
          :title="filtrarMomento ? 'Remover filtro' : 'Aplicar filtro'"
          @click="filtrarMomento = !filtrarMomento"
        >{{ NOMES_ETIQUETA[momento.etiqueta] }} {{ filtrarMomento ? '×' : '+' }}</button>
        <button
          class="etiqueta"
          :class="{ desligado: !filtrarTempo }"
          :title="filtrarTempo ? 'Remover filtro' : 'Aplicar filtro'"
          @click="filtrarTempo = !filtrarTempo"
        >{{ NOMES_TEMPO[missa.liturgia.tempo] }} {{ filtrarTempo ? '×' : '+' }}</button>
      </div>
      <ul class="resultados">
        <li v-for="r in resultados" :key="r.id">
          <button class="resultado" @click="escolher(r)">
            <strong>{{ r.titulo }}</strong>
            <span class="pequeno suave">{{ trechoDaLetra(r) }}</span>
          </button>
        </li>
        <li v-if="resultados.length === 0" class="suave pequeno">
          Nada encontrado{{ filtrarMomento || filtrarTempo ? ' com estes filtros. Tente removê-los ou' : '. Você pode' }}
          cadastrar um novo.
        </li>
      </ul>
    </section>

    <CadastroItem
      v-if="modo === 'cadastrar'"
      :categoria="categoria"
      :etiqueta="momento.etiqueta"
      @salvo="escolher"
      @cancelar="modo = item ? 'ver' : 'buscar'"
    />
    <CadastroItem
      v-if="modo === 'editar' && item"
      :categoria="item.categoria"
      :editar="item"
      @salvo="escolher"
      @cancelar="modo = 'ver'"
    />
  </div>
</template>

<style scoped>
.escolhido h3 {
  margin-bottom: 0.1em;
}
.filtros {
  margin-bottom: 0.6rem;
}
.filtros .etiqueta {
  cursor: pointer;
}
.etiqueta.desligado {
  background: transparent;
  border: 1px dashed var(--borda);
  color: var(--suave);
}
.resultados {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 55vh;
  overflow: auto;
}
.resultado {
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--borda);
  border-radius: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1em;
  text-align: left;
  padding: 0.5em 0.3em;
}
.resultado:hover {
  background: var(--destaque-claro);
}
.caixa {
  display: flex;
  align-items: center;
  gap: 0.4em;
  margin-top: 0.8rem;
  color: var(--texto);
}
.caixa input {
  width: auto;
}
</style>
