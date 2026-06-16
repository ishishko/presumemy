<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Pencil, Trash2 } from '@lucide/vue'
import { del } from '@/services/api'
import { createTrigger } from '@/composables/useCreateTrigger'
import { useProductosStore } from '@/stores/productos'
import ProductoDetalle from '@/components/overlays/ProductoDetalle.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import CategoriaPills from '@/components/ui/CategoriaPills.vue'
import { useToast } from '@/composables/useToast'
import type { Producto } from '@/types'

const emit = defineEmits<{
  'set-editor-mode': [active: boolean, title: string, onSave: () => void, onClose: () => void]
}>()

const store = useProductosStore()
const { toast } = useToast()

const catFilter = ref<number | 'todas'>('todas')
const showOverlay = ref(false)
const editingProducto = ref<Producto | null>(null)
const showConfirmDelete = ref(false)
const deletingProducto = ref<Producto | null>(null)

const showConfirmDeleteCat = ref(false)
const deletingCat = ref<any | null>(null)

const showLoading = computed(() => !store.hasFetched)

const filtered = computed(() => {
  if (catFilter.value === 'todas') return store.data
  return store.data.filter((p) => p.categoriaId === catFilter.value)
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

async function handleDeleteCatConfirm() {
  if (!deletingCat.value) return
  try {
    await store.removeCategoria(deletingCat.value.id)
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
    <CategoriaPills
      v-model="catFilter"
      variant="productos"
      :categorias="store.categorias"
      @create="handleCreateCat"
      @rename="handleRenameCat"
      @remove="handleRemoveCatClick"
    />

    <div v-if="filtered.length === 0" class="prod-empty">
      <p>No hay productos en esta categoría</p>
    </div>

    <div v-else class="prod-grid">
      <div
        v-for="p in filtered"
        :key="p.id"
        class="prod-card"
        @click="handleEdit(p)"
      >
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
        <div class="prod-foot">
          <span class="stock">Stock: <strong>{{ p.bomLineas?.length || 0 }} insumos</strong></span>
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

  <ConfirmDialog
    :open="showConfirmDeleteCat"
    title="Eliminar categoría"
    :message="deletingCat && (deletingCat._count?.productos ?? 0) > 0
      ? `La categoría ${deletingCat.nombre} tiene ${deletingCat._count.productos} productos asociados. No se puede eliminar.`
      : `Vas a eliminar la categoría ${deletingCat?.nombre}. Esta acción no se puede deshacer.`"
    :confirm-label="(deletingCat && (deletingCat._count?.productos ?? 0) > 0) ? '' : 'Eliminar'"
    variant="danger"
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
</style>
