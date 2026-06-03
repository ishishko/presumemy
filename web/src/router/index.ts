import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/insumos',
    name: 'Insumos',
    component: () => import('@/views/InsumosView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/catalogo',
    name: 'Catalogo',
    component: () => import('@/views/CatalogoView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/clientes',
    name: 'Clientes',
    component: () => import('@/views/ClientesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/presupuestos',
    name: 'Presupuestos',
    component: () => import('@/views/PresupuestosView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/finanzas',
    name: 'Finanzas',
    component: () => import('@/views/FinanzasView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ajustes',
    name: 'Ajustes',
    component: () => import('@/views/AjustesView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (authStore.loading) {
    await authStore.init()
  }

  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    return { name: 'Login' }
  }

  if (to.name === 'Login' && authStore.isAuthenticated) {
    return { path: '/dashboard' }
  }
})

export default router
