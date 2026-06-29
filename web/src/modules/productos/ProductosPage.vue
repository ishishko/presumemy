<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Pencil, Trash2, Star } from '@lucide/vue'
import { patch } from '@/shared/api/client'
import { createTrigger } from '@/shared/lib/createTrigger'
import { useProductosStore } from './store'
import { formatMoney } from '@/shared/lib/format'
import ProductoDetalle from './components/ProductoDetalle.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import CategoriaPills from '@/shared/ui/CategoriaPills.vue'
import CategoriaDeleteDialog from '@/shared/ui/CategoriaDeleteDialog.vue'
import FilterChips from '@/shared/ui/FilterChips.vue'
import { useToast } from '@/shared/lib/useToast'
import type { Producto } from '@/types'

const emit = defineEmits<{
  'set-editor-mode': [active: boolean, title: string, onSave: () => void, onClose: () => void]
}>()

const route = useRoute()
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
  { id: 'favorito' as const, label: 'Favoritos', count: counts.value.favoritos, dotTone: 'warning' as const },
  { id: 'desactualizado' as const, label: 'Precios desactualizados', count: counts.value.desactualizados, dotTone: 'danger' as const },
])

const filtered = computed(() => {
  let list = store.data

  if (catFilter.value !== 'todas') {
    list = list.filter((p) => p.categoriaId === catFilter.value)
  }

  if (stateFilter.value === 'favorito') {
    list = list.filter((p) => p.favorito)
  } else if (stateFilter.value === 'desactualizado') {
    list = list.filter((p) => p.desactualizado)
  }

  return [...list].sort((a, b) => {
    if (a.favorito && !b.favorito) return -1
    if (!a.favorito && b.favorito) return 1
    return a.nombre.localeCompare(b.nombre)
  })
})

function getImageUrl(path: string) {
  if (!path) return ''
  const token = localStorage.getItem('sb-token')
  return `${import.meta.env.VITE_API_URL || ''}/api${path}?token=${token}`
}

function money(v: number): string {
  return formatMoney(v)
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
    await store.remove(p.id)
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

watch(
  [() => route.query.edit, () => store.hasFetched],
  ([editVal, hasFetched]) => {
    if (editVal && hasFetched) {
      const p = store.data.find(item => item.codigo === editVal || String(item.id) === editVal)
      if (p) {
        handleEdit(p)
      }
    }
  },
  { immediate: true }
)

watch(createTrigger, (val) => {
  if (val === 'productos') {
    handleCreate()
    createTrigger.value = null
  }
})
</script>

<template>
  <div class="w-full">
    <div v-if="showLoading" class="border border-border rounded-lg bg-surface p-6">
      <p class="text-14 text-ink-muted">Cargando productos...</p>
    </div>
    <template v-else>
      <div class="mb-4">
        <FilterChips
          :model-value="stateFilter"
          :chips="stateChips"
          deselectable
          @update:model-value="stateFilter = $event === null ? 'todos' : ($event as 'todos' | 'favorito' | 'desactualizado')"
        />
      </div>

      <CategoriaPills
        v-model="catFilter"
        variant="productos"
        :categorias="store.categorias"
        @create="handleCreateCat"
        @rename="handleRenameCat"
        @remove="handleRemoveCatClick"
      />

      <div v-if="filtered.length === 0" class="border border-dashed border-border rounded-lg p-12 text-center text-ink-muted text-14 select-none">
        No hay productos con los filtros seleccionados
      </div>

      <div v-else class="prod-grid">
        <div
          v-for="p in filtered"
          :key="p.id"
          class="prod-card"
          @click="handleEdit(p)"
        >
          <button
            type="button"
            class="prod-fav-btn"
            :class="{ active: p.favorito }"
            @click.stop="toggleFavorite(p)"
            :title="p.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'"
          >
            <Star :size="14" :class="[p.favorito ? 'fill-amber-600 text-amber-600' : 'fill-none']" />
          </button>

          <div class="prod-actions">
            <button
              type="button"
              class="prod-action-btn"
              @click.stop="handleEdit(p)"
              title="Editar"
            >
              <Pencil :size="14" />
            </button>
            <button
              type="button"
              class="prod-action-btn prod-action-danger"
              @click.stop="handleDeleteClick(p)"
              title="Eliminar"
            >
              <Trash2 :size="14" />
            </button>
          </div>

          <div class="prod-thumb">
            <img v-if="p.imagenes && p.imagenes.length > 0" :src="getImageUrl(p.imagenes[0])" :alt="p.nombre" class="w-full h-full object-cover" />
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
          <div v-if="p.desactualizado" class="inline-flex items-center gap-1 text-11 font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-2 self-start select-none">
            Reajustar precio
          </div>
          <div class="prod-foot">
            <span class="stock">Receta: <strong>{{ p.bomLineas?.length || 0 }} líneas</strong></span>
            <span class="price">{{ money(p.precio) }}</span>
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
.prod-grid {
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  display: grid;
}
@media (max-width: 1024px) {
  .prod-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .prod-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .prod-grid {
    grid-template-columns: 1fr;
  }
}
.prod-card {
  background: var(--color-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-1);
  cursor: pointer;
  user-select: none;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  transition: border-color 120ms ease, transform 80ms ease;
  display: flex;
  position: relative;
}
.prod-card:hover {
  border-color: var(--color-border-strong);
}
.prod-card:active {
  transform: translateY(1px);
}
.prod-fav-btn {
  border: 1px solid var(--border);
  color: var(--color-ink-muted);
  cursor: pointer;
  z-index: 5;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  place-items: center;
  padding: 6px;
  transition: background 120ms ease, color 120ms ease, transform 120ms ease;
  display: grid;
  position: absolute;
  top: 8px;
  left: 8px;
}
.prod-fav-btn:hover {
  background: var(--color-surface);
  color: #D97706;
  transform: scale(1.1);
}
.prod-fav-btn.active {
  color: #D97706;
  background: #FEF3C7;
  border-color: #FBBF24;
}
.prod-actions {
  opacity: 0;
  z-index: 5;
  gap: 4px;
  transition: opacity 120ms ease;
  display: flex;
  position: absolute;
  top: 8px;
  right: 8px;
}
.prod-card:hover .prod-actions {
  opacity: 1;
}
.prod-action-btn {
  background: var(--color-surface);
  border: 1px solid var(--border);
  color: var(--color-ink-muted);
  cursor: pointer;
  border-radius: 6px;
  place-items: center;
  padding: 6px;
  transition: background 120ms ease, color 120ms ease;
  display: grid;
}
.prod-action-btn:hover {
  background: var(--color-page-bg);
  color: var(--color-ink);
}
.prod-action-btn.prod-action-danger:hover {
  background: var(--color-coral-50);
  color: var(--color-coral-500);
}
.prod-thumb {
  aspect-ratio: 4 / 3;
  color: rgba(28, 26, 30, 0.28);
  background: #f0eef4;
  border-radius: 8px;
  place-items: center;
  width: 100%;
  display: grid;
  overflow: hidden;
}
.prod-thumb img {
  width: 100%;
  height: 100%;
  object-cover: cover;
}
.prod-thumb svg {
  width: 30px;
  height: 30px;
}
.prod-card .prod-name {
  color: var(--color-ink);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.35;
  display: -webkit-box;
  overflow: hidden;
}
.prod-card .prod-meta-1 {
  color: var(--color-ink-muted);
  align-items: center;
  gap: 8px;
  margin-top: -4px;
  font-size: 12px;
  display: flex;
}
.prod-card .prod-meta-1 .code {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-muted);
}
.prod-card .prod-meta-1 .sep {
  background: var(--color-border-strong);
  border-radius: 999px;
  width: 3px;
  height: 3px;
}
.prod-card .prod-foot {
  border-top: 1px solid var(--border);
  justify-content: space-between;
  align-items: baseline;
  padding-top: 8px;
  font-size: 12px;
  display: flex;
}
.prod-card .prod-foot .stock {
  color: var(--color-ink-muted);
}
.prod-card .prod-foot .stock strong {
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.prod-card .prod-foot .price {
  color: var(--color-violet-700);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  font-size: 15px;
  font-weight: 500;
}
</style>
