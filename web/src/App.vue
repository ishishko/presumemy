<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TheSidebar from '@/components/layout/TheSidebar.vue'
import TheTopbar from '@/components/layout/TheTopbar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const currentRoute = computed(() => {
  const name = route.name as string
  return name || 'dashboard'
})

const crumbs = computed(() => {
  const labels: Record<string, string> = {
    dashboard: 'Inicio',
    presupuestos: 'Presupuestos',
    catalogo: 'Productos',
    insumos: 'Insumos',
    finanzas: 'Finanzas',
    clientes: 'Clientes',
    ajustes: 'Ajustes',
  }
  return [labels[currentRoute.value] || '']
})

const isAuthRoute = computed(() => route.name === 'Login')

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
</script>

<template>
  <div v-if="isAuthRoute">
    <RouterView />
  </div>

  <div v-else class="app-shell">
    <TheSidebar
      :current-route="currentRoute"
      @navigate="handleNavigate"
      @logout="handleLogout"
    />
    <div class="shell-right">
      <TheTopbar :crumbs="crumbs" />
      <RouterView />
    </div>
  </div>
</template>
