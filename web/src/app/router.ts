import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/modules/auth/store'
import { resetEditorMode } from '@/shared/lib/editorMode'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/p/:token',
    name: 'public-presupuesto',
    component: () => import('@/modules/presupuestos/PublicPresupuestoPage.vue'),
    meta: { requiresAuth: false, public: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/modules/dashboard/DashboardPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/insumos',
    name: 'insumos',
    component: () => import('@/modules/insumos/InsumosPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/productos',
    name: 'productos',
    component: () => import('@/modules/productos/ProductosPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/clientes',
    name: 'clientes',
    component: () => import('@/modules/clientes/ClientesPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/presupuestos',
    name: 'presupuestos',
    component: () => import('@/modules/presupuestos/PresupuestosPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/finanzas',
    name: 'finanzas',
    component: () => import('@/modules/finanzas/FinanzasPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ajustes',
    name: 'ajustes',
    component: () => import('@/modules/ajustes/AjustesPage.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  resetEditorMode()

  if (to.meta.public) {
    return
  }

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
