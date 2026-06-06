import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { resetEditorMode } from '@/composables/useEditorMode'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/insumos',
    name: 'insumos',
    component: () => import('@/views/InsumosView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/productos',
    name: 'productos',
    component: () => import('@/views/ProductosView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/clientes',
    name: 'clientes',
    component: () => import('@/views/ClientesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/presupuestos',
    name: 'presupuestos',
    component: () => import('@/views/PresupuestosView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/finanzas',
    name: 'finanzas',
    component: () => import('@/views/FinanzasView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ajustes',
    name: 'ajustes',
    component: () => import('@/views/AjustesView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  resetEditorMode()
  const authStore = useAuthStore()

  if (authStore.loading) {
    await authStore.init()
  }

  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { path: '/dashboard' }
  }
})

export default router
