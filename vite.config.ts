import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

// No GitHub Pages o site fica em /slides-para-missa/.
// BASE_URL pode ser trocado por variável de ambiente (ex.: domínio próprio).
export default defineConfig({
  base: process.env.BASE_URL ?? '/slides-para-missa/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
