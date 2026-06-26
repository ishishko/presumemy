<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createTrigger } from '@/shared/lib/createTrigger'
import { editorMode, editorTitle, editorSaveHandler, editorCloseHandler, setEditorMode, resetEditorMode, editorDirty } from '@/shared/lib/editorMode'
import AppSidebar from '@/app/shell/AppSidebar.vue'
import AppHeader from '@/app/shell/AppHeader.vue'
import ToastContainer from '@/shared/ui/ToastContainer.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

watch(
  () => route.path,
  () => {
    resetEditorMode()
  }
)

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

// rutas sin shell (sidebar/topbar): login y vistas públicas
const isBareRoute = computed(() => route.name === 'login' || route.meta.public === true)

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
  createTrigger.value = currentRoute.value
}

function handleSetEditorMode(active: boolean, title: string, onSave: () => void, onClose: () => void) {
  setEditorMode(active, title, onSave, onClose)
}

function handleEditorSave() {
  editorSaveHandler.value?.()
}

function handleEditorClose() {
  editorCloseHandler.value?.()
}
</script>

<template>
  <div v-if="isBareRoute">
    <RouterView />
  </div>

  <div v-else class="grid grid-cols-[240px_1fr] min-h-screen bg-page-bg">
    <AppSidebar
      :current-route="currentRoute"
      @navigate="handleNavigate"
      @logout="handleLogout"
    />
    <div class="flex flex-col min-h-screen min-w-0">
      <AppHeader
        :title="pageTitle"
        :show-create="showCreate"
        :editor-mode="editorMode"
        :editor-title="editorTitle"
        :editor-dirty="editorDirty"
        @create="handleCreate"
        @editor-save="handleEditorSave"
        @editor-close="handleEditorClose"
      />
      <main class="flex-1 p-8">
        <RouterView @set-editor-mode="handleSetEditorMode" />
      </main>
    </div>
  </div>

  <ToastContainer />
</template>
