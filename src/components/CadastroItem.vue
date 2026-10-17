<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { letraDoItem, montarBlocos, separarBlocos, sugerirRefrao } from '../biblioteca/letra.ts';
import { NOMES_TEMPO, type Tempo } from '../liturgia/calendario.ts';
import { NOMES_ETIQUETA, type EtiquetaMomento, type ItemBiblioteca } from '../modelo/tipos.ts';
import { useBiblioteca } from '../stores/biblioteca.ts';
import EditorOrdem from './EditorOrdem.vue';

const props = defineProps<{
  categoria: 'canto' | 'texto';
  etiqueta?: EtiquetaMomento;
  /** Item do usuário a editar (se vier da biblioteca do projeto, salva uma cópia). */
  editar?: ItemBiblioteca;
}>();
const emit = defineEmits<{ salvo: [item: ItemBiblioteca]; cancelar: [] }>();

const biblioteca = useBiblioteca();

const titulo = ref(props.editar?.titulo ?? '');
const autor = ref(props.editar?.autor ?? '');
const letra = ref(props.editar ? letraDoItem(props.editar) : '');
const momentos = ref<EtiquetaMomento[]>(props.editar?.momentos ?? (props.etiqueta && props.etiqueta !== 'outro' ? [props.etiqueta] : []));
const tempos = ref<Tempo[]>(props.editar?.tempos ?? []);

const colados = computed(() => separarBlocos(letra.value));
const refrao = ref<boolean[]>([]);
const ordem = ref<string[]>([]);
const ordemMexida = ref(false);

// Ao mudar a letra, refaz a sugestão de refrão.
watch(
  () => colados.value.map((b) => b.join('\n')).join('\n\n'),
  () => {
    refrao.value = props.categoria === 'canto' ? sugerirRefrao(colados.value) : colados.value.map(() => false);
  },
  { immediate: true },
);

const montado = computed(() => montarBlocos(colados.value, refrao.value));

// Ao mudar os blocos ou o refrão, refaz a ordem (a menos que seja a primeira carga de um item editado).
let primeira = Boolean(props.editar);
watch(
  () => montado.value.ordem.join(' '),
  () => {
    if (primeira && props.editar) {
      ordem.value = [...props.editar.ordem];
      primeira = false;
      return;
    }
    ordem.value = [...montado.value.ordem];
    ordemMexida.value = false;
  },
  { immediate: true },
);

function alternarRefrao(i: number) {
  const novo = [...refrao.value];
  novo[i] = !novo[i];
  refrao.value = novo;
}

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

const podeSalvar = computed(() => titulo.value.trim() && montado.value.blocos.length > 0 && ordem.value.length > 0);

function salvar() {
  if (!podeSalvar.value) return;
  const dados = {
    categoria: props.categoria,
    titulo: titulo.value.trim(),
    autor: autor.value.trim() || undefined,
    blocos: montado.value.blocos,
    ordem: ordem.value,
    momentos: momentos.value,
    tempos: tempos.value,
  };
  if (props.editar && props.editar.origem === 'usuario') {
    biblioteca.atualizar(props.editar.id, dados);
    emit('salvo', { ...dados, id: props.editar.id, origem: 'usuario' });
  } else {
    emit('salvo', biblioteca.adicionar(dados));
  }
}

const etiquetas = Object.entries(NOMES_ETIQUETA) as [EtiquetaMomento, string][];
const nomesTempo = Object.entries(NOMES_TEMPO) as [Tempo, string][];
</script>

<template>
  <div class="cadastro">
    <h3>{{ editar ? 'Editar' : 'Cadastrar' }} {{ categoria === 'canto' ? 'canto' : 'texto' }}</h3>
    <p v-if="editar && editar.origem === 'biblioteca'" class="pequeno suave">
      Este item é da biblioteca do projeto. Ao salvar, uma cópia sua é criada; o original não muda.
    </p>
    <div class="campo">
      <label for="cad-titulo">Título</label>
      <input id="cad-titulo" v-model="titulo" type="text" />
    </div>
    <div v-if="categoria === 'canto'" class="campo">
      <label for="cad-autor">Autor (opcional)</label>
      <input id="cad-autor" v-model="autor" type="text" />
    </div>
    <div class="campo">
      <label for="cad-letra">{{ categoria === 'canto' ? 'Letra' : 'Texto' }} — cada linha em branco separa um bloco</label>
      <textarea id="cad-letra" v-model="letra" rows="10" placeholder="Cole aqui"></textarea>
    </div>

    <template v-if="colados.length > 0 && categoria === 'canto'">
      <p class="pequeno">
        <strong>Qual bloco é o refrão?</strong>
        <span class="suave"> O app sugeriu; clique para confirmar ou trocar.</span>
      </p>
      <ul class="blocos">
        <li v-for="(b, i) in colados" :key="i" :class="{ refrao: refrao[i] }">
          <button class="marcar" :aria-pressed="refrao[i]" @click="alternarRefrao(i)">
            {{ refrao[i] ? 'Refrão' : 'Estrofe' }}
          </button>
          <span class="previa">{{ b[0] }}<span v-if="b.length > 1" class="suave"> …</span></span>
        </li>
      </ul>
      <div class="campo">
        <label>Ordem de canto (arraste as etiquetas)</label>
        <EditorOrdem v-model="ordem" :blocos="montado.blocos" />
      </div>
    </template>

    <div class="campo">
      <label>Momentos da missa</label>
      <div class="linha">
        <button
          v-for="[valor, nome] in etiquetas"
          :key="valor"
          class="chip"
          :aria-pressed="momentos.includes(valor)"
          @click="momentos = alternar(momentos, valor)"
        >{{ nome }}</button>
      </div>
    </div>
    <div class="campo">
      <label>Tempo litúrgico (nenhum marcado = qualquer tempo)</label>
      <div class="linha">
        <button
          v-for="[valor, nome] in nomesTempo"
          :key="valor"
          class="chip"
          :aria-pressed="tempos.includes(valor)"
          @click="tempos = alternar(tempos, valor)"
        >{{ nome }}</button>
      </div>
    </div>

    <div class="linha">
      <span class="espaco"></span>
      <button @click="emit('cancelar')">Cancelar</button>
      <button class="principal" :disabled="!podeSalvar" @click="salvar">Salvar e usar</button>
    </div>
  </div>
</template>

<style scoped>
.blocos {
  list-style: none;
  padding: 0;
  margin: 0 0 0.9rem;
}
.blocos li {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.25rem 0;
}
.blocos li.refrao .previa {
  font-weight: 700;
}
.marcar {
  min-width: 5.5rem;
  justify-content: center;
  font-size: 0.85rem;
  padding: 0.15em 0.5em;
}
.blocos li.refrao .marcar,
.chip[aria-pressed='true'] {
  background: var(--destaque);
  border-color: var(--destaque);
  color: #fff;
}
.previa {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.chip {
  border-radius: 999px;
  padding: 0.15em 0.7em;
  font-size: 0.85rem;
}
</style>
