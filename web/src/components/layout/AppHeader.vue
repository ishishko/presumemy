<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Bell, Plus, Save, X, Loader } from '@lucide/vue'
import { useGlobalSearch } from '@/composables/useGlobalSearch'

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
</script>

<template>
  <div class="app-header">
    <div class="header-left">
      <h1>{{ title }}</h1>
      <template v-if="editorMode">
        <span class="editor-mode-title">{{ editorTitle || 'Nuevo' }}</span>
        <button
          class="icon-btn"
          @click="$emit('editorSave')"
          title="Guardar borrador"
          :disabled="!editorDirty"
          :style="{ opacity: editorDirty ? 1 : 0.4, cursor: editorDirty ? 'pointer' : 'not-allowed' }"
        >
          <Save :size="18" />
        </button>
        <button class="icon-btn" @click="$emit('editorClose')" title="Cerrar">
          <X :size="18" />
        </button>
      </template>
      <!-- destino del badge de estado del editor (Teleport desde PresupuestoEditor) -->
      <div id="editor-header-status" class="header-status-slot"></div>
      <button
        v-if="!editorMode && showCreate"
        class="btn btn-primary btn-icon"
        :title="`Crear nuevo`"
        @click="$emit('create')"
      >
        <Plus :size="16" :stroke-width="2" />
      </button>
    </div>
    <div class="search-wrap" ref="searchContainer">
      <div class="search">
        <Search :size="16" :stroke-width="1.5" />
        <input
          v-model="query"
          placeholder="Buscar presupuestos, clientes, productos…"
          @focus="onFocus"
          @input="onInput"
          @keydown="onKeydown"
        />
        <div v-if="loading" class="search-loader">
          <Loader class="spin" :size="14" />
        </div>
      </div>

      <!-- Dropdown de resultados -->
      <div v-if="showDropdown && query.trim().length >= 2" class="search-dropdown">
        <div v-if="loading && results.length === 0" class="dropdown-status">
          Buscando...
        </div>
        <div v-else-if="results.length === 0" class="dropdown-status">
          Sin resultados para "{{ query }}"
        </div>
        <div v-else class="results-list">
          <div
            v-for="(r, idx) in results"
            :key="r.tipo + '-' + r.id"
            :class="['result-item', activeIndex === idx && 'active']"
            @click="navigateToResult(r)"
            @mouseenter="activeIndex = idx"
          >
            <div class="result-meta">
              <span :class="['type-badge', r.tipo]">{{ r.tipo }}</span>
              <span class="code">{{ r.codigo }}</span>
            </div>
            <div class="result-title">{{ r.titulo }}</div>
            <div class="result-subtitle">{{ r.subtitulo }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="header-right">
      <button class="icon-btn" title="Notificaciones">
        <Bell :size="20" :stroke-width="1.5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor-mode-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--violet-700);
  letter-spacing: -0.01em;
}

/* slot del badge de estado; sin contenido no ocupa lugar (evita gap fantasma) */
.header-status-slot {
  display: inline-flex;
  align-items: center;
}
.header-status-slot:empty {
  display: none;
}

.search-wrap {
  position: relative;
}

.search-loader {
  position: absolute;
  right: 12px;
  top: 10px;
  color: var(--ink-muted);
  display: flex;
  align-items: center;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-pop);
  z-index: 100;
  max-height: 380px;
  overflow-y: auto;
}

.dropdown-status {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--ink-muted);
}

.results-list {
  padding: 6px;
}

.result-item {
  padding: 10px 12px;
  border-radius: var(--r-sm);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: background 120ms ease;
}

.result-item.active {
  background: var(--violet-50);
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-badge {
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  letter-spacing: 0.05em;
}

.type-badge.insumo {
  background: var(--violet-50);
  color: var(--violet-700);
  border: 1px solid var(--violet-100);
}

.type-badge.producto {
  background: var(--violet-100);
  color: var(--violet-700);
  border: 1px solid var(--lavender);
}

.type-badge.cliente {
  background: var(--teal-50);
  color: var(--teal-700);
  border: 1px solid var(--teal-100);
}

.type-badge.presupuesto {
  background: var(--mint);
  color: var(--green-700);
  border: 1px solid rgba(52, 165, 108, 0.2);
}

.result-item .code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-muted);
}

.result-item .result-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}

.result-item .result-subtitle {
  font-size: 11px;
  color: var(--ink-muted);
}
</style>
