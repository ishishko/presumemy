<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Pencil, Trash2 } from '@lucide/vue'
import { get, del } from '@/services/api'
import { createTrigger } from '@/composables/useCreateTrigger'
import ProductoDetalle from '@/components/overlays/ProductoDetalle.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import type { Producto, CategoriaProducto, PaginationResult } from '@/types'

const productos = ref<Producto[]>([])
const categorias = ref<CategoriaProducto[]>([])
const loading = ref(true)
const error = ref('')

const catFilter = ref('todas')

const showOverlay = ref(false)
const editingProducto = ref<Producto | null>(null)
const showConfirmDelete = ref(false)
const deletingProducto = ref<Producto | null>(null)

const { toast } = useToast()

const filtered = computed(() => {
  if (catFilter.value === 'todas') return productos.value
  return productos.value.filter((p) => p.categoria?.nombre === catFilter.value)
})

function money(v: number): string {
  return `$ ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function loadProductos() {
  try {
    const [prodRes, catsRes] = await Promise.all([
      get<PaginationResult<Producto>>('/productos', { page: 1, limit: 100 }),
      get<{ data: CategoriaProducto[] }>('/productos/categorias'),
    ])
    productos.value = prodRes.data
    categorias.value = catsRes.data
  } catch (e: any) {
    error.value = e.message || 'Error al cargar productos'
  } finally {
    loading.value = false
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

function handleSaved() {
  loadProductos()
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
    toast('Producto eliminado', 'info')
    productos.value = productos.value.filter(x => x.id !== p.id)
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
  deletingProducto.value = null
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
  <div class="content">
    <div v-if="loading" class="card"><p>Cargando productos...</p></div>
    <div v-else-if="error" class="card"><p class="err">{{ error }}</p></div>

    <template v-else>
      <div class="pill-row">
        <button
          :class="['pill', catFilter === 'todas' && 'active']"
          @click="catFilter = 'todas'"
        >Todos</button>
        <button
          v-for="c in categorias"
          :key="c.id"
          :class="['pill', catFilter === c.nombre && 'active']"
          @click="catFilter = c.nombre"
        >{{ c.nombre }}</button>
      </div>

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
    </template>
  </div>

  <ProductoDetalle
    :open="showOverlay"
    :producto="editingProducto"
    @close="showOverlay = false"
    @saved="handleSaved"
  />

  <ConfirmDialog
    :open="showConfirmDelete"
    title="Eliminar producto"
    :message="`Vas a eliminar ${deletingProducto?.codigo} · ${deletingProducto?.nombre}. Esta acción no se puede deshacer.`"
    confirm-label="Eliminar"
    variant="danger"
    @confirm="handleDeleteConfirm"
    @cancel="showConfirmDelete = false; deletingProducto = null"
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
