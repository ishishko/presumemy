<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Bell, Plus, Loader } from '@lucide/vue'
import { EDITOR_SLOT_ID, EDITOR_SLOT_END_ID, hayEditorAbierto } from '@/shared/lib/editorSlot'
import { useGlobalSearch } from '@/modules/search/useGlobalSearch'
import BaseButton from '@/shared/ui/BaseButton.vue'

defineProps<{
  title: string
  showCreate?: boolean
}>()

defineEmits<{
  create: []
}>()

const router = useRouter()
const { query, results, loading } = useGlobalSearch()

const activeIndex = ref(-1)
const showDropdown = ref(false)
const searchContainer = ref<HTMLElement | null>(null)

function handleClickOutside(event: MouseEvent) {
  if (searchContainer.value && !searchContainer.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

function onFocus() {
  showDropdown.value = true
}

function onInput() {
  showDropdown.value = true
  activeIndex.value = -1
}

function navigateToResult(result: any) {
  showDropdown.value = false
  let path = ''
  if (result.tipo === 'insumo') path = '/insumos'
  else if (result.tipo === 'producto') path = '/productos'
  else if (result.tipo === 'cliente') path = '/clientes'
  else if (result.tipo === 'presupuesto') path = '/presupuestos'

  if (path) {
    router.push({ path, query: { edit: result.codigo } })
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!showDropdown.value || results.value.length === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % results.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + results.value.length) % results.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIndex.value >= 0 && activeIndex.value < results.value.length) {
      navigateToResult(results.value[activeIndex.value])
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    showDropdown.value = false
  }
}
</script>

<template>
  <header class="h-16 bg-surface border-b border-border flex items-center justify-between px-6 flex-shrink-0">
    <!-- Left: Title + Editor controls -->
    <div class="flex items-center gap-4">
      <h1 class="text-22 font-medium text-violet-700 m-0">{{ title }}</h1>
      
      <!-- El editor abierto teletransporta acá sus propios controles -->
      <div :id="EDITOR_SLOT_ID" class="inline-flex items-center gap-4"></div>

      <BaseButton
        v-if="!hayEditorAbierto && showCreate"
        variant="primary"
        :icon="true"
        @click="$emit('create')"
        title="Crear nuevo"
      >
        <Plus :size="16" :stroke-width="2" />
      </BaseButton>
    </div>

    <!-- Center: Search -->
    <div class="relative" ref="searchContainer">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" :stroke-width="1.5" />
        <input
          v-model="query"
          type="text"
          placeholder="Buscar presupuestos, clientes, productos…"
          class="w-80 pl-9 pr-3 py-2 bg-page-bg border border-border rounded-lg text-13 text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-teal-500 focus:shadow-focus-ring transition-colors"
          @focus="onFocus"
          @input="onInput"
          @keydown="onKeydown"
        />
        <div v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
          <Loader class="w-3.5 h-3.5 animate-spin" />
        </div>
      </div>

      <!-- Search results dropdown -->
      <div
        v-if="showDropdown && query.trim().length >= 2"
        class="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-border rounded-lg shadow-pop z-100 max-h-95 overflow-y-auto"
      >
        <div v-if="loading && results.length === 0" class="p-4 text-center text-13 text-ink-muted">
          Buscando...
        </div>
        <div v-else-if="results.length === 0" class="p-4 text-center text-13 text-ink-muted">
          Sin resultados para "{{ query }}"
        </div>
        <div v-else class="p-1.5">
          <div
            v-for="(r, idx) in results"
            :key="r.tipo + '-' + r.id"
            :class="[
              'px-3 py-2.5 rounded-md cursor-pointer flex flex-col gap-0.75 transition-colors',
              activeIndex === idx ? 'bg-violet-50' : 'hover:bg-page-bg'
            ]"
            @click="navigateToResult(r)"
            @mouseenter="activeIndex = idx"
          >
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'text-10 uppercase font-semibold px-2 py-0.5 rounded-pill border',
                  r.tipo === 'insumo' ? 'bg-violet-50 text-violet-700 border-violet-100' :
                  r.tipo === 'producto' ? 'bg-violet-100 text-violet-700 border-lavender' :
                  r.tipo === 'cliente' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                  'bg-mint text-green-700 border-green-500/20'
                ]"
              >{{ r.tipo }}</span>
              <span class="font-mono text-11 text-ink-muted">{{ r.codigo }}</span>
            </div>
            <div class="text-13 font-medium text-ink">{{ r.titulo }}</div>
            <div class="text-11 text-ink-muted">{{ r.subtitulo }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: acciones del editor + notificaciones -->
    <div class="flex items-center gap-1">
      <div :id="EDITOR_SLOT_END_ID" class="inline-flex items-center"></div>
      <BaseButton variant="ghost" :icon="true" title="Notificaciones">
        <Bell :size="20" :stroke-width="1.5" />
      </BaseButton>
    </div>
  </header>
</template>
