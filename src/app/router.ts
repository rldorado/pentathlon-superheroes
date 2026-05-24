import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/heroes',
  },
  {
    path: '/heroes',
    name: 'heroes',
    component: () => import('@/features/heroes/components/HeroesPage.vue'),
    meta: { title: 'Héroes inscritos' },
  },
  {
    path: '/pentatlon',
    name: 'pentatlon',
    component: () => import('./views/PlaceholderView.vue'),
    meta: { title: 'Simulador del pentatlón' },
    props: { title: 'Simulador del pentatlón', subtitle: 'Pendiente de implementación' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('./views/PlaceholderView.vue'),
    meta: { title: 'No encontrado' },
    props: { title: '404 — No encontrado', subtitle: 'Esta ruta no existe.' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  const baseTitle = 'Pentatlón de Superhéroes'
  const pageTitle = typeof to.meta.title === 'string' ? to.meta.title : null
  document.title = pageTitle ? `${pageTitle} · ${baseTitle}` : baseTitle
})
