<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import MeusCantos from '../components/MeusCantos.vue';
import ResumoLiturgia from '../components/ResumoLiturgia.vue';
import { usePreviaLiturgia } from '../composables/usePreviaLiturgia.ts';
import { HEX_COR } from '../liturgia/calendario.ts';
import type { Missa } from '../modelo/tipos.ts';
import { useMissas } from '../stores/missas.ts';
import { dataPorExtenso, diaDaSemana, proximoDomingo } from '../util/datas.ts';

const router = useRouter();
const missas = useMissas();

const dataNova = ref(proximoDomingo());
const previaNova = usePreviaLiturgia(dataNova);
const criando = ref(false);
const erro = ref('');

async function criar() {
  criando.value = true;
  erro.value = '';
  try {
    const m = await missas.nova(dataNova.value);
    router.push({ name: 'montagem', params: { id: m.id } });
  } catch (e) {
    erro.value = e instanceof Error ? e.message : String(e);
  } finally {
    criando.value = false;
  }
}

// Duplicar com nova data
const dialogo = ref<HTMLDialogElement | null>(null);
const origem = ref<Missa | null>(null);
const dataDuplicar = ref('');
const previaDuplicar = usePreviaLiturgia(dataDuplicar);

function abrirDuplicar(m: Missa) {
  origem.value = m;
  const seguinte = new Date(m.data + 'T12:00:00Z');
  seguinte.setUTCDate(seguinte.getUTCDate() + 7);
  const sugestao = seguinte.toISOString().slice(0, 10);
  dataDuplicar.value = sugestao < proximoDomingo() ? proximoDomingo() : sugestao;
  dialogo.value?.showModal();
}

async function confirmarDuplicar() {
  if (!origem.value) return;
  criando.value = true;
  try {
    const m = await missas.duplicar(origem.value.id, dataDuplicar.value);
    dialogo.value?.close();
    router.push({ name: 'montagem', params: { id: m.id } });
  } catch (e) {
    erro.value = e instanceof Error ? e.message : String(e);
  } finally {
    criando.value = false;
  }
}

const apagando = ref('');
function apagar(m: Missa) {
  if (apagando.value === m.id) {
    missas.remover(m.id);
    apagando.value = '';
  } else {
    apagando.value = m.id;
  }
}
</script>

<template>
  <main class="inicio">
    <section class="painel">
      <h1>Nova missa</h1>
      <div class="campo">
        <label for="data-nova">Data da missa</label>
        <input id="data-nova" v-model="dataNova" type="date" class="data" />
        <span v-if="dataNova" class="pequeno suave"> {{ diaDaSemana(dataNova) }}</span>
      </div>
      <ResumoLiturgia :liturgia="previaNova.liturgia.value" :leituras="previaNova.leituras.value"
        :carregando="previaNova.carregando.value" :erro="previaNova.erro.value" />
      <p v-if="erro" class="aviso">{{ erro }}</p>
      <button class="principal" :disabled="criando || !previaNova.liturgia.value" @click="criar">
        Criar missa
      </button>
    </section>

    <section class="painel">
      <h2>Missas salvas</h2>
      <p v-if="missas.ordenadas.length === 0" class="suave">
        Nenhuma missa ainda. As missas ficam salvas só neste navegador.
      </p>
      <ul class="lista">
        <li v-for="m in missas.ordenadas" :key="m.id">
          <span class="faixa-cor" :style="{ background: HEX_COR[m.liturgia.cor] }"></span>
          <div class="descricao">
            <strong>{{ dataPorExtenso(m.data) }}</strong>
            <span class="suave"> · {{ m.celebracao }}</span>
          </div>
          <RouterLink class="botao" :to="{ name: 'montagem', params: { id: m.id } }">Abrir</RouterLink>
          <button @click="abrirDuplicar(m)">Duplicar</button>
          <button class="discreto perigo" @click="apagar(m)" @blur="apagando = ''">
            {{ apagando === m.id ? 'Confirmar?' : 'Apagar' }}
          </button>
        </li>
      </ul>
    </section>

    <MeusCantos />

    <dialog ref="dialogo">
      <h2>Duplicar missa</h2>
      <p class="pequeno suave">
        Mantém roteiro, cantos e textos. Atualiza a liturgia e as leituras. Limpa avisos e capa.
        O que não combinar com a nova data fica marcado com ⚠.
      </p>
      <div class="campo">
        <label for="data-dup">Nova data</label>
        <input id="data-dup" v-model="dataDuplicar" type="date" class="data" />
      </div>
      <ResumoLiturgia :liturgia="previaDuplicar.liturgia.value" :leituras="previaDuplicar.leituras.value"
        :carregando="previaDuplicar.carregando.value" :erro="previaDuplicar.erro.value" />
      <div class="linha">
        <span class="espaco"></span>
        <button @click="dialogo?.close()">Cancelar</button>
        <button class="principal" :disabled="criando || !previaDuplicar.liturgia.value" @click="confirmarDuplicar">
          Duplicar
        </button>
      </div>
    </dialog>
  </main>
</template>

<style scoped>
.inicio {
  max-width: 46rem;
  margin: 1.5rem auto;
  padding: 0 1rem;
  display: grid;
  gap: 1.2rem;
}
.data {
  max-width: 12rem;
}
.lista {
  list-style: none;
  padding: 0;
  margin: 0;
}
.lista li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--borda);
}
.lista li:last-child {
  border-bottom: 0;
}
.descricao {
  flex: 1;
  min-width: 0;
}
@media (max-width: 560px) {
  .lista li {
    flex-wrap: wrap;
  }
  .descricao {
    flex-basis: calc(100% - 2rem);
  }
}
</style>
