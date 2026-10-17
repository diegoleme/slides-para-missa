<script setup lang="ts">
import { HEX_COR, NOMES_COR, NOMES_TEMPO, type DiaLiturgico } from '../liturgia/calendario.ts';
import type { DiaPaulus } from '../modelo/paulus.ts';

defineProps<{
  liturgia: DiaLiturgico | null;
  leituras: DiaPaulus | null;
  carregando: boolean;
  erro?: string;
}>();
</script>

<template>
  <div class="resumo">
    <p v-if="carregando" class="suave">Consultando a liturgia do dia…</p>
    <p v-else-if="erro" class="aviso">{{ erro }}</p>
    <template v-else-if="liturgia">
      <p class="celebracao">{{ liturgia.celebracao }}</p>
      <p class="linha pequeno">
        <span><span class="faixa-cor" :style="{ background: HEX_COR[liturgia.cor] }"></span> {{ NOMES_COR[liturgia.cor] }}</span>
        <span class="suave">·</span>
        <span>{{ NOMES_TEMPO[liturgia.tempo] }}</span>
        <span class="suave">·</span>
        <span>Ano {{ liturgia.ano }}</span>
        <template v-if="!liturgia.temGloria">
          <span class="suave">·</span>
          <span>sem Glória</span>
        </template>
      </p>
      <p v-if="leituras" class="pequeno suave">
        ✓ Leituras da Paulus encontradas: {{ leituras.leituras.filter((l) => l.tipo !== 'salmo').map((l) => l.referencia).join(' · ') }}
      </p>
      <p v-else class="pequeno aviso">
        ⚠ A Paulus ainda não publicou esta data. Tempo, ano e cor foram calculados; confira o nome da celebração.
        As leituras ficam vazias, para preencher à mão.
      </p>
    </template>
  </div>
</template>

<style scoped>
.celebracao {
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.3em;
}
</style>
