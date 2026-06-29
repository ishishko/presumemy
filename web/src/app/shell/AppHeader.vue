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
</script>

<template>
  <div class="app-header">
    <div class="header-left">
      <h1 v-if="!editorMode">{{ title }}</h1>
      
      <template v-if="editorMode">
        <span class="editor-mode-title">
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
      <div :id="EDITOR_STATUS_SLOT_ID" class="header-status-slot"></div>
      
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
    <div class="search-wrap" ref="searchContainer">
      <div class="search">
        <Search :size="16" :stroke-width="1.5" />
        <input
          v-model="query"
          type="text"
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
            class="result-item"
            :class="{ active: activeIndex === idx }"
            @click="navigateToResult(r)"
            @mouseenter="activeIndex = idx"
          >
            <div class="result-meta">
              <span class="type-badge" :class="r.tipo">
                {{ r.tipo }}
              </span>
              <span class="code">{{ r.codigo }}</span>
            </div>
            <div class="result-title">{{ r.titulo }}</div>
            <div class="result-subtitle">{{ r.subtitulo }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botón campana de notificaciones -->
    <div class="header-right">
      <BaseButton variant="ghost" icon title="Notificaciones">
        <Bell :size="20" :stroke-width="1.5" />
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.app-header {
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
  z-index: 50;
  background: rgba(255, 255, 255, 0.85);
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  height: 56px;
  padding: 0px 32px;
  display: grid;
  position: sticky;
  top: 0px;
}
.header-left {
  justify-self: start;
  align-items: center;
  gap: 12px;
  display: flex;
}
.header-left h1 {
  color: var(--color-violet-700);
  letter-spacing: -0.01em;
  margin: 0px;
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
}
.editor-mode-title {
  color: var(--color-violet-700);
  letter-spacing: -0.01em;
  font-size: 18px;
  font-weight: 600;
}
.header-status-slot {
  align-items: center;
  display: inline-flex;
}
.header-status-slot:empty {
  display: none;
}
.search-wrap {
  position: relative;
  justify-self: center;
  min-width: 360px;
  max-width: 520px;
}
.search {
  width: 100%;
  position: relative;
}
.search input {
  box-sizing: border-box;
  width: 100%;
  height: 34px;
  font-family: var(--font-sans);
  background: var(--color-page-bg);
  border: 1px solid var(--border);
  color: var(--color-ink);
  border-radius: 8px;
  padding: 0px 10px 0px 32px;
  font-size: 13px;
  transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
}
.search input:focus {
  outline: none;
  border-color: rgba(117, 204, 206, 0.5);
  background: var(--color-surface);
  box-shadow: 0 0 0 2px rgba(117, 204, 206, 0.2);
}
.search input::placeholder {
  color: var(--color-ink-muted);
}
.search svg {
  width: 16px;
  height: 16px;
  color: var(--color-ink-muted);
  position: absolute;
  top: 9px;
  left: 10px;
}
.search-loader {
  color: var(--color-ink-muted);
  align-items: center;
  display: flex;
  position: absolute;
  top: 10px;
  right: 12px;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.search-dropdown {
  background: var(--color-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-pop);
  z-index: 100;
  max-height: 380px;
  position: absolute;
  top: calc(100% + 6px);
  left: 0px;
  right: 0px;
  overflow-y: auto;
}
.dropdown-status {
  text-align: center;
  color: var(--color-ink-muted);
  padding: 16px;
  font-size: 13px;
}
.results-list {
  padding: 6px;
}
.result-item {
  border-radius: var(--radius-sm);
  cursor: pointer;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  transition: background 0.12s;
  display: flex;
}
.result-item.active {
  background: var(--color-violet-50);
}
.result-meta {
  align-items: center;
  gap: 8px;
  display: flex;
}
.type-badge {
  text-transform: uppercase;
  border-radius: var(--radius-pill);
  letter-spacing: 0.05em;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
}
.type-badge.insumo {
  background: var(--color-violet-50);
  color: var(--color-violet-700);
  border: 1px solid var(--color-violet-100);
}
.type-badge.producto {
  background: var(--color-violet-100);
  color: var(--color-violet-700);
  border: 1px solid var(--color-lavender);
}
.type-badge.cliente {
  background: var(--color-teal-50);
  color: var(--color-teal-700);
  border: 1px solid var(--color-teal-100);
}
.type-badge.presupuesto {
  background: var(--color-mint);
  color: var(--color-green-700);
  border: 1px solid rgba(52, 165, 108, 0.2);
}
.result-item .code {
  font-family: var(--font-mono);
  color: var(--color-ink-muted);
  font-size: 11px;
}
.result-item .result-title {
  color: var(--color-ink);
  font-size: 13px;
  font-weight: 500;
}
.result-item .result-subtitle {
  color: var(--color-ink-muted);
  font-size: 11px;
}
.header-right {
  justify-self: end;
}
</style>
