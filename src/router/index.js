import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ChampionsView from '../views/ChampionsView.vue';
import ChampionDetailView from '../views/ChampionDetailView.vue';
import AboutView from '../views/AboutView.vue';
import FavoritesView from '../views/FavoritesView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Home' } },
    { path: '/champions', name: 'champions', component: ChampionsView, meta: { title: 'Champions' } },
    { path: '/champions/:id', name: 'champion-detail', component: ChampionDetailView, meta: { title: 'Champion' } },
    { path: '/favorieten', name: 'favorites', component: FavoritesView, meta: { title: 'Favorieten' } },
    { path: '/over', name: 'about', component: AboutView, meta: { title: 'Over' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} — Sigma.GG` : 'Sigma.GG';
});

export default router;
