<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TheSidebar from '@/components/layout/TheSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const currentRoute = computed(() => (route.name as string) || '')

const pageTitle = computed(() => {
  if (currentRoute.value === 'dashboard') {
    const email = authStore.user?.email || ''
    const name = email.split('@')[0] || 'Usuario'
    return `Hola, ${name}`
  }
  const labels: Record<string, string> = {
    presupuestos: 'Presupuestos',
    productos: 'Productos',
    insumos: 'Insumos',
    finanzas: 'Finanzas',
    clientes: 'Clientes',
    ajustes: 'Ajustes',
  }
  return labels[currentRoute.value] || ''
})

const showCreate = computed(() => {
  return ['presupuestos', 'productos', 'insumos', 'finanzas', 'clientes'].includes(currentRoute.value)
})

const isAuthRoute = computed(() => route.name === 'login')

onMounted(async () => {
  await authStore.init()
})

function handleNavigate(routeId: string) {
  router.push({ name: routeId })
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function handleCreate() {
  // TODO: implement per-section create logic
}
</script>

<template>
  <div v-if="isAuthRoute">
    <RouterView />
  </div>

  <div v-else class="app">
    <TheSidebar
      :current-route="currentRoute"
      @navigate="handleNavigate"
      @logout="handleLogout"
    />
    <div class="main">
      <AppHeader
        :title="pageTitle"
        :show-create="showCreate"
        @create="handleCreate"
      />
      <RouterView />
    </div>
  </div>
</template>
