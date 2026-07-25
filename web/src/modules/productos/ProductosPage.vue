<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { createTrigger } from '@/shared/lib/createTrigger'
import { useProductosStore } from '@/modules/productos/store'
import { formatMoney } from '@/shared/lib/format'
import ProductoDetalle from './components/ProductoDetalle.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FilterChips from '@/shared/ui/FilterChips.vue'
import CategoriaPills from '@/shared/ui/CategoriaPills.vue'
import CategoriaDeleteDialog from '@/shared/ui/CategoriaDeleteDialog.vue'
import { useToast } from '@/shared/lib/useToast'
import { Pencil, Trash2, Star, Image } from '@lucide/vue'
import type { Producto } from './types'

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
    await store.toggleFavorito(p.id)
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

function handleClose() {
  showOverlay.value = false
  emit('set-editor-mode', false, '', () => {}, () => {})
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
  <div class="p-6 relative">
    <div v-if="showLoading" class="bg-surface border border-border rounded-lg p-5">
      <p class="text-14 text-ink-muted">Cargando productos...</p>
    </div>
    <template v-else>
      <div class="mb-4">
        <FilterChips
          :model-value="stateFilter"
          :chips="stateChips"
          deselectable
          @update:model-value="stateFilter = $event === null ? 'todos' : ($event as any)"
        />
      </div>

      <CategoriaPills
        v-model="catFilter"
        all-label="Todos"
        :categorias="store.categorias"
        @create="handleCreateCat"
        @rename="handleRenameCat"
        @remove="handleRemoveCatClick"
      />

      <div v-if="filtered.length === 0" class="bg-surface border border-border rounded-lg p-8 text-center">
        <p class="text-14 text-ink-muted">No hay productos con los filtros seleccionados</p>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div
          v-for="p in filtered"
          :key="p.id"
          class="bg-surface border border-border rounded-lg overflow-hidden cursor-pointer hover:shadow-2 transition-shadow relative group"
          @click="handleEdit(p)"
        >
          <button
            class="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/85 border border-border flex items-center justify-center z-10 transition-all hover:bg-white hover:scale-110"
            :class="p.favorito ? 'text-amber-600 border-amber-400 bg-amber-50' : 'text-ink-muted'"
            @click.stop="toggleFavorite(p)"
            :title="p.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'"
          >
            <Star :size="14" :fill="p.favorito ? '#D97706' : 'none'" />
          </button>

          <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              class="w-7 h-7 rounded-md bg-surface border border-border flex items-center justify-center text-ink-muted hover:bg-page-bg hover:text-ink transition-colors"
              @click.stop="handleEdit(p)"
              title="Editar"
            >
              <Pencil :size="14" />
            </button>
            <button
              class="w-7 h-7 rounded-md bg-surface border border-border flex items-center justify-center text-ink-muted hover:bg-coral-50 hover:text-coral-500 transition-colors"
              @click.stop="handleDeleteClick(p)"
              title="Eliminar"
            >
              <Trash2 :size="14" />
            </button>
          </div>

          <div class="aspect-square bg-page-bg flex items-center justify-center overflow-hidden">
            <img v-if="p.imagenes && p.imagenes.length > 0" :src="getImageUrl(p.imagenes[0])" :alt="p.nombre" class="w-full h-full object-cover" />
            <Image v-else :size="32" class="text-ink-muted/40" />
          </div>

          <div class="p-3">
            <div class="text-14 font-medium text-ink mb-1 line-clamp-2">{{ p.nombre }}</div>
            <div class="flex items-center gap-1.5 text-12 text-ink-muted">
              <span class="font-mono">{{ p.codigo }}</span>
              <span class="w-0.5 h-0.5 rounded-full bg-ink-muted/40" />
              <span>{{ p.categoria?.nombre }}</span>
            </div>
            <div v-if="p.desactualizado" class="inline-flex items-center gap-1 text-11 font-semibold text-amber-600 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-pill mt-2">
              Reajustar precio
            </div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <span class="text-12 text-ink-muted">Receta: <strong class="text-ink">{{ p.bomLineas?.length || 0 }} líneas</strong></span>
              <span class="text-13 font-medium text-ink tabular-nums">{{ formatMoney(p.precio) }}</span>
            </div>
          </div>
        </div>
      </div>

      <ProductoDetalle
        :open="showOverlay"
        :producto="editingProducto"
        @close="handleClose"
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
