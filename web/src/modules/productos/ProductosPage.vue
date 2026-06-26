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

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="p in filtered"
          :key="p.id"
          class="bg-surface border border-border rounded-lg p-4 shadow-1 flex flex-col relative cursor-pointer select-none group hover:border-border-strong hover:shadow-2"
          @click="handleEdit(p)"
        >
          <button
            type="button"
            class="absolute top-2 left-2 border p-1.5 rounded-full grid place-items-center transition-all duration-120 z-10 cursor-pointer"
            :class="[
              p.favorito
                ? 'text-amber-600 border-amber-200 bg-amber-50/80 hover:bg-amber-50 hover:scale-110'
                : 'bg-white/80 border-border text-ink-muted hover:bg-surface hover:text-amber-600 hover:scale-110'
            ]"
            @click.stop="toggleFavorite(p)"
            :title="p.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'"
          >
            <Star :size="14" :class="[p.favorito ? 'fill-amber-600 text-amber-600' : 'fill-none']" />
          </button>

          <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-120 z-10">
            <button
              type="button"
              class="bg-surface border border-border text-ink-muted hover:bg-page-bg hover:text-ink p-1.5 rounded-md grid place-items-center transition-colors duration-120 cursor-pointer"
              @click.stop="handleEdit(p)"
              title="Editar"
            >
              <Pencil :size="14" />
            </button>
            <button
              type="button"
              class="bg-surface border border-border text-ink-muted hover:bg-coral-50 hover:text-coral-500 p-1.5 rounded-md grid place-items-center transition-colors duration-120 cursor-pointer"
              @click.stop="handleDeleteClick(p)"
              title="Eliminar"
            >
              <Trash2 :size="14" />
            </button>
          </div>

          <div class="w-full aspect-square border border-border rounded bg-page-bg/40 flex items-center justify-center overflow-hidden mb-3 select-none">
            <img v-if="p.imagenes && p.imagenes.length > 0" :src="getImageUrl(p.imagenes[0])" :alt="p.nombre" class="w-full h-full object-cover" />
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-12 h-12 text-ink-muted/40">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <div class="text-14 font-medium text-ink line-clamp-1 mb-1">{{ p.nombre }}</div>
          <div class="flex items-center gap-1.5 text-12 text-ink-muted mb-3 select-none">
            <span class="font-mono text-11">{{ p.codigo }}</span>
            <span class="w-1 h-1 rounded-full bg-border-strong" />
            <span>{{ p.categoria?.nombre }}</span>
          </div>
          <div v-if="p.desactualizado" class="inline-flex items-center gap-1 text-11 font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-2 self-start select-none">
            Reajustar precio
          </div>
          <div class="mt-auto pt-2 border-t border-border/65 flex justify-between items-center select-none">
            <span class="text-12 text-ink-muted">Receta: <strong class="text-ink font-semibold">{{ p.bomLineas?.length || 0 }} líneas</strong></span>
            <span class="text-15 font-semibold text-ink font-mono tabular-nums">{{ money(p.precio) }}</span>
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
