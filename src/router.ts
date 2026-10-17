import { createRouter, createWebHashHistory } from 'vue-router';
import Inicio from './views/Inicio.vue';

// Hash na URL (#/missa/...) porque o GitHub Pages não sabe redirecionar rotas.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'inicio', component: Inicio },
    { path: '/missa/:id', name: 'montagem', component: () => import('./views/Montagem.vue'), props: true },
    { path: '/missa/:id/slides', name: 'slides', component: () => import('./views/TodosSlides.vue'), props: true },
    { path: '/:qualquer(.*)', redirect: '/' },
  ],
});
