<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { desenharSlide, prepararImagens } from '../exportar/canvas.ts';
import type { Slide } from '../slides/tipos.ts';

const props = withDefaults(defineProps<{ slide: Slide; largura?: number }>(), { largura: 480 });
const canvas = ref<HTMLCanvasElement | null>(null);

async function desenhar() {
  const c = canvas.value;
  if (!c) return;
  const escala = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.round(props.largura * escala);
  c.height = Math.round((props.largura * escala * 9) / 16);
  const imgs = await prepararImagens([props.slide]);
  desenharSlide(c, props.slide, imgs);
}

onMounted(desenhar);
watch(() => [props.slide, props.largura], desenhar);
</script>

<template>
  <canvas ref="canvas" class="slide-canvas" role="img" aria-label="Prévia do slide"></canvas>
</template>
