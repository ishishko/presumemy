<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createTrigger } from '@/composables/useCreateTrigger'
import TheSidebar from '@/components/layout/TheSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

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

const editorMode = ref(false)
const editorTitle = ref('')
const editorSaveHandler = ref<(() => void) | null>(null)
const editorCloseHandler = ref<(() => void) | null>(null)

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
  editorMode.value = active
  editorTitle.value = title
  editorSaveHandler.value = active ? onSave : null
  editorCloseHandler.value = active ? onClose : null
}

function handleEditorSave() {
  editorSaveHandler.value?.()
}

function handleEditorClose() {
  editorCloseHandler.value?.()
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
        :editor-mode="editorMode"
        :editor-title="editorTitle"
        @create="handleCreate"
        @editor-save="handleEditorSave"
        @editor-close="handleEditorClose"
      />
      <RouterView @set-editor-mode="handleSetEditorMode" />
    </div>
  </div>

  <ToastContainer />
</template>
