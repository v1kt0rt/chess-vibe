import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomePage from './pages/HomePage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  // Lazy-loaded: the chessboard (and its CSS) is only downloaded when you open it
  { path: '/play', name: 'play', component: () => import('./components/Main.vue') },
  // Any unknown URL goes back to the start page
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  // Real URLs like /play (netlify.toml already rewrites every path to index.html)
  history: createWebHistory(),
  routes,
})
