<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Pencil, Trash2, Star } from '@lucide/vue'
import { del, patch } from '@/services/api'
import { createTrigger } from '@/composables/useCreateTrigger'
import { useProductosStore } from '@/stores/productos'
import ProductoDetalle from '@/components/overlays/ProductoDetalle.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import CategoriaPills from '@/components/ui/CategoriaPills.vue'
import CategoriaDeleteDialog from '@/components/ui/CategoriaDeleteDialog.vue'
import { useToast } from '@/composables/useToast'
import type { Producto } from '@/types'

const emit = defineEmits<{
  'set-editor-mode': [active: boolean, title: string, onSave: () => void, onClose: () => void]
}>()

const store = useProductosStore()
const { toast } = useToast()

const catFilter = ref<number | 'todas'>('todas')
const stateFilter = ref<'todos' | 'favorito' | 'desactualizado'>('todos')
const showOverlay = ref(false)
const editingProducto = ref<Producto | null>(null)
const showConfirmDelete = ref(false)
const deletingProducto = ref<Producto | null>(null)

const showConfirmDeleteCat = ref(false)
const deletingCat = ref<any | null>(null)

const showLoading = computed(() => !store.hasFetched)

const counts = computed(() => {
  const c = { favoritos: 0, desactualizados: 0 }
  store.data.forEach((p) => {
    if (p.favorito) c.favoritos++
    if (p.desactualizado) c.desactualizados++
  })
  return c
})

const stateChips = computed(() => [
  { id: 'todos' as const, label: 'Todos', count: store.data.length },
  { id: 'favorito' as const, label: 'Favoritos ★', count: counts.value.favoritos, dot: '#FBBF24' },
  { id: 'desactualizado' as const, label: 'Precios desactualizados ⚠️', count: counts.value.desactualizados, dot: '#EA5F3C' },
])

const filtered = computed(() => {
  let list = store.data

  // Apply category filter
  if (catFilter.value !== 'todas') {
    list = list.filter((p) => p.categoriaId === catFilter.value)
  }

  // Apply state filter
  if (stateFilter.value === 'favorito') {
    list = list.filter((p) => p.favorito)
  } else if (stateFilter.value === 'desactualizado') {
    list = list.filter((p) => p.desactualizado)
  }

  // Sorting: favorites first, then alphabetically by name
  return [...list].sort((a, b) => {
    if (a.favorito && !b.favorito) return -1
    if (!a.favorito && b.favorito) return 1
    return a.nombre.localeCompare(b.nombre)
  })
})

function money(v: number): string {
  return `$ ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function loadProductos() {
  try {
    await store.fetch()
  } catch (e: any) {
    if (store.data.length === 0) {
      toast(e.message || 'Error al cargar productos', 'error')
    }
  }
}

function handleCreate() {
  editingProducto.value = null
  showOverlay.value = true
}

function handleEdit(p: Producto) {
  editingProducto.value = p
  showOverlay.value = true
}

function handleSaved(producto: Producto) {
  store.upsert(producto)
}

function handleHeaderUpdate(payload: { mode: 'editor'; title: string; onSave: () => void; onClose: () => void } | { mode: 'normal' }) {
  if (payload.mode === 'editor') {
    emit('set-editor-mode', true, payload.title, payload.onSave, payload.onClose)
  } else {
    emit('set-editor-mode', false, '', () => {}, () => {})
  }
}

function handleDeleteClick(p: Producto) {
  deletingProducto.value = p
  showConfirmDelete.value = true
}

async function handleDeleteConfirm() {
  if (!deletingProducto.value) return
  const p = deletingProducto.value
  try {
    await del('/productos', p.id)
    store.remove(p.id)
    toast('Producto eliminado', 'info')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
  deletingProducto.value = null
}

async function toggleFavorite(p: Producto) {
  try {
    const res = await patch<Producto>('/productos', `${p.id}/favorito`, {})
    store.upsert(res)
    toast(p.favorito ? 'Quitado de favoritos' : 'Marcado como favorito', 'info')
  } catch (e: any) {
    toast(e.message || 'Error al actualizar favorito', 'error')
  }
}

async function handleCreateCat(nombre: string) {
  try {
    await store.createCategoria(nombre)
    toast('Categoría creada', 'success')
  } catch (e: any) {
    toast(e.message || 'Error al crear categoría', 'error')
  }
}

async function handleRenameCat(payload: { id: number; nombre: string }) {
  try {
    await store.updateCategoria(payload.id, payload.nombre)
    toast('Categoría actualizada', 'success')
  } catch (e: any) {
    toast(e.message || 'Error al actualizar categoría', 'error')
  }
}

function handleRemoveCatClick(cat: any) {
  deletingCat.value = cat
  showConfirmDeleteCat.value = true
}

async function handleDeleteCatConfirm(reasignarA?: number) {
  if (!deletingCat.value) return
  try {
    await store.removeCategoria(deletingCat.value.id, reasignarA)
    toast('Categoría eliminada', 'info')
    if (catFilter.value === deletingCat.value.id) {
      catFilter.value = 'todas'
    }
  } catch (e: any) {
    toast(e.message || 'Error al eliminar categoría', 'error')
  }
  showConfirmDeleteCat.value = false
  deletingCat.value = null
}

onMounted(loadProductos)

watch(createTrigger, (val) => {
  if (val === 'productos') {
    handleCreate()
    createTrigger.value = null
  }
})
</script>

<template>
  <div class="content" style="position: relative">
    <div v-if="showLoading" class="card"><p>Cargando productos...</p></div>
    <template v-else>
    <div class="insumos-filter-row">
      <button
        v-for="s in stateChips"
        :key="s.id"
        :class="['insumos-state-pill', stateFilter === s.id && 'active']"
        @click="stateFilter = stateFilter === s.id ? 'todos' : s.id"
      >
        <span v-if="s.dot" class="d" :style="{ background: s.dot }" />
        {{ s.label }}
        <span class="k">{{ s.count }}</span>
      </button>
    </div>

    <CategoriaPills
      v-model="catFilter"
      variant="productos"
      :categorias="store.categorias"
      @create="handleCreateCat"
      @rename="handleRenameCat"
      @remove="handleRemoveCatClick"
    />

    <div v-if="filtered.length === 0" class="prod-empty">
      <p>No hay productos con los filtros seleccionados</p>
    </div>

    <div v-else class="prod-grid">
      <div
        v-for="p in filtered"
        :key="p.id"
        class="prod-card"
        @click="handleEdit(p)"
      >
        <button
          class="prod-fav-btn"
          :class="{ active: p.favorito }"
          @click.stop="toggleFavorite(p)"
          :title="p.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'"
        >
          <Star :size="14" :fill="p.favorito ? '#D97706' : 'none'" />
        </button>

        <div class="prod-thumb">
          <img v-if="p.imagenUrl" :src="p.imagenUrl" :alt="p.nombre" />
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
        <div class="prod-name">{{ p.nombre }}</div>
        <div class="prod-meta-1">
          <span class="code">{{ p.codigo }}</span>
          <span class="sep" />
          <span>{{ p.categoria?.nombre }}</span>
        </div>
        <div v-if="p.desactualizado" class="prod-warning-badge">
          ⚠️ Reajustar precio
        </div>
        <div class="prod-foot">
          <span class="stock">Receta: <strong>{{ p.bomLineas?.length || 0 }} líneas</strong></span>
          <span class="price">{{ money(p.precio) }}</span>
        </div>
        <div class="prod-actions">
          <button class="prod-action-btn" @click.stop="handleEdit(p)" title="Editar">
            <Pencil :size="14" />
          </button>
          <button class="prod-action-btn prod-action-danger" @click.stop="handleDeleteClick(p)" title="Eliminar">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <ProductoDetalle
      :open="showOverlay"
      :producto="editingProducto"
      @close="showOverlay = false"
      @saved="handleSaved"
      @update:header="handleHeaderUpdate"
    />
    </template>
  </div>

  <ConfirmDialog
    :open="showConfirmDelete"
    title="Eliminar producto"
    :message="`Vas a eliminar ${deletingProducto?.codigo} · ${deletingProducto?.nombre}. Esta acción no se puede deshacer.`"
    confirm-label="Eliminar"
    variant="danger"
    @confirm="handleDeleteConfirm"
    @cancel="showConfirmDelete = false; deletingProducto = null"
  />

  <CategoriaDeleteDialog
    :open="showConfirmDeleteCat"
    :categoria="deletingCat"
    :categorias="store.categorias"
    @confirm="handleDeleteCatConfirm"
    @cancel="showConfirmDeleteCat = false; deletingCat = null"
  />
</template>

<style scoped>
.prod-card {
  position: relative;
}

.prod-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 120ms ease;
  z-index: 5;
}

.prod-card:hover .prod-actions { opacity: 1; }

.prod-action-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  transition: background 120ms ease, color 120ms ease;
}

.prod-action-btn:hover { background: var(--page-bg); color: var(--ink); }
.prod-action-danger:hover { background: var(--coral-50); color: var(--coral-500); }

.prod-fav-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--border);
  color: var(--ink-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  transition: background 120ms ease, color 120ms ease, transform 120ms ease;
  z-index: 5;
}

.prod-fav-btn:hover {
  background: var(--surface);
  color: #D97706;
  transform: scale(1.1);
}

.prod-fav-btn.active {
  color: #D97706;
  border-color: #FBBF24;
  background: #FEF3C7;
}

.prod-warning-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #D97706;
  background: #FEF3C7;
  border: 1px solid #FCD34D;
  padding: 3px 8px;
  border-radius: 999px;
  margin-top: 8px;
  align-self: flex-start;
}
</style>
