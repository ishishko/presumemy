<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Bell, Plus, Save, X, Loader } from '@lucide/vue'
import { useGlobalSearch } from '@/modules/search'
import { EDITOR_STATUS_SLOT_ID } from '@/shared/lib/editorMode'
import BaseButton from '@/shared/ui/BaseButton.vue'

defineProps<{
  title: string
  showCreate?: boolean
  editorMode?: boolean
  editorTitle?: string
  editorDirty?: boolean
}>()

defineEmits<{
  create: []
  editorSave: []
  editorClose: []
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

const BADGE_COLORS: Record<string, string> = {
  insumo: 'bg-violet-50 text-violet-700 border border-violet-100',
  producto: 'bg-violet-100 text-violet-700 border border-lavender',
  cliente: 'bg-teal-50 text-teal-700 border border-teal-100',
  presupuesto: 'bg-mint text-green-700 border border-green-500/20',
}
</script>

<template>
  <div class="h-14 sticky top-0 z-10 flex items-center gap-4 px-8 bg-surface/80 backdrop-blur-sm border-b border-border">
    <div class="flex items-center gap-3.5 flex-1 min-w-0">
      <h1 v-if="!editorMode" class="text-22 font-medium text-violet-700 m-0 truncate">{{ title }}</h1>
      
      <template v-if="editorMode">
        <span class="text-18 font-semibold text-violet-700 tracking-[-0.01em] truncate">
          {{ editorTitle || 'Nuevo' }}
        </span>
        
        <BaseButton
          variant="ghost"
          icon
          :disabled="!editorDirty"
          @click="$emit('editorSave')"
          title="Guardar borrador"
        >
          <Save :size="18" />
        </BaseButton>
        
        <BaseButton
          variant="ghost"
          icon
          @click="$emit('editorClose')"
          title="Cerrar"
        >
          <X :size="18" />
        </BaseButton>
      </template>
      
      <!-- Destino del badge de estado del editor -->
      <div :id="EDITOR_STATUS_SLOT_ID" class="inline-flex items-center empty:hidden"></div>
      
      <BaseButton
        v-if="!editorMode && showCreate"
        variant="primary"
        icon
        title="Crear nuevo"
        @click="$emit('create')"
      >
        <Plus :size="16" :stroke-width="2" />
      </BaseButton>
    </div>

    <!-- Buscador global -->
    <div class="relative w-80 shrink-0" ref="searchContainer">
      <div class="flex items-center gap-2 bg-page-bg rounded-md px-3 h-9 border border-border/10 focus-within:border-teal-500/50 focus-within:bg-surface focus-within:shadow-[0_0_0_2px_rgba(117,204,206,0.2)] transition-all">
        <Search :size="16" :stroke-width="1.5" class="text-ink-muted shrink-0" />
        <input
          v-model="query"
          type="text"
          placeholder="Buscar presupuestos, clientes..."
          class="w-full bg-transparent border-0 text-13 text-ink outline-none placeholder:text-ink-muted/70"
          @focus="onFocus"
          @input="onInput"
          @keydown="onKeydown"
        />
        <div v-if="loading" class="shrink-0 text-ink-muted">
          <Loader class="animate-spin" :size="14" />
        </div>
      </div>

      <!-- Dropdown de resultados -->
      <div v-if="showDropdown && query.trim().length >= 2" class="absolute top-full mt-1.5 left-0 right-0 bg-surface border border-border rounded-md shadow-pop z-50 max-h-[380px] overflow-y-auto">
        <div v-if="loading && results.length === 0" class="p-4 text-center text-13 text-ink-muted">
          Buscando...
        </div>
        <div v-else-if="results.length === 0" class="p-4 text-center text-13 text-ink-muted">
          Sin resultados para "{{ query }}"
        </div>
        <div v-else class="p-1.5 flex flex-col gap-0.5">
          <div
            v-for="(r, idx) in results"
            :key="r.tipo + '-' + r.id"
            class="p-2.5 rounded-sm cursor-pointer flex flex-col gap-1 transition-colors select-none"
            :class="[activeIndex === idx ? 'bg-violet-50' : '']"
            @click="navigateToResult(r)"
            @mouseenter="activeIndex = idx"
          >
            <div class="flex items-center gap-2">
              <span class="text-[9px] uppercase font-bold px-2 py-0.5 rounded-pill tracking-wider" :class="[BADGE_COLORS[r.tipo] || '']">
                {{ r.tipo }}
              </span>
              <span class="font-mono text-11 text-ink-muted">{{ r.codigo }}</span>
            </div>
            <div class="text-13 font-semibold text-ink leading-tight">{{ r.titulo }}</div>
            <div class="text-11 text-ink-muted">{{ r.subtitulo }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botón campana de notificaciones -->
    <div class="flex items-center shrink-0">
      <BaseButton variant="ghost" icon title="Notificaciones">
        <Bell :size="20" :stroke-width="1.5" />
      </BaseButton>
    </div>
  </div>
</template>
