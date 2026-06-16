<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Pencil, Trash2 } from '@lucide/vue'
import { del } from '@/services/api'
import { createTrigger } from '@/composables/useCreateTrigger'
import { useInsumosStore } from '@/stores/insumos'
import InsumoDetalle from '@/components/overlays/InsumoDetalle.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import CategoriaPills from '@/components/ui/CategoriaPills.vue'
import { useToast } from '@/composables/useToast'
import type { Insumo } from '@/types'

const store = useInsumosStore()
const route = useRoute()
const { toast } = useToast()

const emit = defineEmits<{
  'set-editor-mode': [active: boolean, title: string, onSave: () => void, onClose: () => void]
}>()

const stateFilter = ref('todos')
const catFilter = ref<number | 'todas'>('todas')
const showOverlay = ref(false)
const editingInsumo = ref<Insumo | null>(null)
const showConfirmDelete = ref(false)
const deletingInsumo = ref<Insumo | null>(null)

const showConfirmDeleteCat = ref(false)
const deletingCat = ref<any | null>(null)

const showLoading = computed(() => !store.hasFetched)

type Nivel = 'critico' | 'bajo' | 'ok'

function getNivel(i: Insumo): Nivel {
  const stock = Number(i.stock)
  const min = Number(i.stockMinimo)
  if (stock < min * 0.5) return 'critico'
  if (stock < min) return 'bajo'
  return 'ok'
}

const counts = computed(() => {
  const c = { critico: 0, bajo: 0, ok: 0 }
  store.data.forEach((i) => { c[getNivel(i)]++ })
  return c
})

const filtered = computed(() => {
  return store.data.filter((i) => {
    if (stateFilter.value !== 'todos' && getNivel(i) !== stateFilter.value) return false
    if (catFilter.value !== 'todas' && i.categoriaId !== catFilter.value) return false
    return true
  })
})

function money(v: number): string {
  return `$ ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const stateChips = computed(() => [
  { id: 'todos', label: 'Todos', count: store.data.length },
  { id: 'critico', label: 'Crítico', count: counts.value.critico, dot: '#EA5F3C' },
  { id: 'bajo', label: 'Bajo', count: counts.value.bajo, dot: '#F8D132' },
  { id: 'ok', label: 'OK', count: counts.value.ok, dot: '#75CCCE' },
])

const nivelMeta: Record<Nivel, { label: string; color: string; bg: string; barClass: string }> = {
  critico: { label: 'Crítico', color: '#EA5F3C', bg: 'var(--coral-50)', barClass: 'low' },
  bajo: { label: 'Bajo', color: '#7A5D00', bg: 'var(--yellow)', barClass: 'warn' },
  ok: { label: 'OK', color: '#2E6F70', bg: 'var(--teal-100)', barClass: 'ok' },
}

async function loadInsumos() {
  try {
    await store.fetch()
  } catch (e: any) {
    if (store.data.length === 0) {
      toast(e.message || 'Error al cargar insumos', 'error')
    }
  }
}

function handleCreate() {
  editingInsumo.value = null
  showOverlay.value = true
}

function handleEdit(i: Insumo) {
  editingInsumo.value = i
  showOverlay.value = true
}

function handleSaved(insumo: Insumo) {
  store.upsert(insumo)
}

function handleDeleteClick(i: Insumo) {
  deletingInsumo.value = i
  showConfirmDelete.value = true
}

async function handleDeleteConfirm() {
  if (!deletingInsumo.value) return
  const i = deletingInsumo.value
  try {
    await del('/insumos', i.id)
    store.remove(i.id)
    toast('Insumo eliminado', 'info')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
  deletingInsumo.value = null
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

function proveedorPrincipal(i: Insumo): string {
  const principal = i.proveedores?.find((p) => p.esPrincipal)
  return principal?.proveedor?.nombre || ''
}

function handleHeaderUpdate(payload: any) {
  if (payload.mode === 'editor') {
    emit('set-editor-mode', true, payload.title, payload.onSave, payload.onClose)
  } else {
    emit('set-editor-mode', false, '', () => {}, () => {})
  }
}

function handleClose() {
  showOverlay.value = false
  emit('set-editor-mode', false, '', () => {}, () => {})
}

onMounted(loadInsumos)

watch(
  [() => route.query.edit, () => store.hasFetched],
  ([editVal, hasFetched]) => {
    if (editVal && hasFetched) {
      const i = store.data.find(item => item.codigo === editVal || String(item.id) === editVal)
      if (i) {
        handleEdit(i)
      }
    }
  },
  { immediate: true }
)

watch(createTrigger, (val) => {
  if (val === 'insumos') {
    handleCreate()
    createTrigger.value = null
  }
})
</script>

<template>
  <div class="content">
    <div v-if="showLoading" class="card"><p>Cargando insumos...</p></div>
    <template v-else>
    <div class="insumos-filter-row">
      <button
        v-for="s in stateChips"
        :key="s.id"
        :class="['insumos-state-pill', stateFilter === s.id && 'active']"
        @click="stateFilter = s.id"
      >
        <span v-if="s.dot" class="d" :style="{ background: s.dot }" />
        {{ s.label }}
        <span class="k">{{ s.count }}</span>
      </button>
    </div>

    <CategoriaPills
      v-model="catFilter"
      variant="insumos"
      :categorias="store.categorias"
      @create="handleCreateCat"
      @rename="handleRenameCat"
      @remove="handleRemoveCatClick"
    />

    <div class="table-wrap">
      <table class="data-table insumos-table">
        <thead>
          <tr>
            <th>Insumo</th>
            <th>Categoría</th>
            <th class="num">Stock</th>
            <th class="num">Mínimo</th>
            <th class="num">Costo unitario</th>
            <th>Proveedor principal</th>
            <th style="width: 160px">Nivel</th>
            <th>Estado</th>
            <th style="width: 80px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in filtered" :key="i.id" @dblclick="handleEdit(i)">
            <td style="font-weight: 500">
              <div style="display: flex; flex-direction: column; gap: 2px">
                <span>{{ i.nombre }}</span>
                <span style="font-size: 11px; color: var(--ink-muted); font-family: var(--font-mono)">{{ i.codigo }}</span>
              </div>
            </td>
            <td style="color: var(--ink-muted)">{{ i.categoria?.nombre }}</td>
            <td class="num" style="font-weight: 500">
              {{ i.stock }} <span style="color: var(--ink-muted); font-size: 12px; font-weight: 400">{{ i.unidad }}</span>
            </td>
            <td class="num" style="color: var(--ink-muted)">
              {{ i.stockMinimo }} <span style="font-size: 12px">{{ i.unidad }}</span>
            </td>
            <td class="num" style="font-variant-numeric: tabular-nums">
              {{ i.costoUnitario ? money(i.costoUnitario) : '—' }}
            </td>
            <td style="color: var(--ink-muted)">
              {{ proveedorPrincipal(i) || '—' }}
            </td>
            <td>
              <div :class="['stock-bar', nivelMeta[getNivel(i)].barClass]">
                <div :style="{ width: Math.min(100, (Number(i.stock) / Math.max(Number(i.stockMinimo), 1)) * 100) + '%' }"></div>
              </div>
            </td>
            <td>
              <span
                class="insumos-state-badge"
                :style="{ background: nivelMeta[getNivel(i)].bg, color: nivelMeta[getNivel(i)].color }"
              >
                <span class="d" /> {{ nivelMeta[getNivel(i)].label }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="row-action-btn" @click="handleEdit(i)" title="Editar">
                  <Pencil :size="14" />
                </button>
                <button class="row-action-btn row-action-danger" @click="handleDeleteClick(i)" title="Eliminar">
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="9" style="text-align: center; color: var(--ink-muted); padding: 24px 0">
              Sin resultados con los filtros actuales.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <InsumoDetalle
      :open="showOverlay"
      :insumo="editingInsumo"
      @close="handleClose"
      @saved="handleSaved"
      @update:header="handleHeaderUpdate"
    />
    </template>
  </div>

  <ConfirmDialog
    :open="showConfirmDelete"
    title="Eliminar insumo"
    :message="`Vas a eliminar ${deletingInsumo?.codigo} · ${deletingInsumo?.nombre}. Esta acción no se puede deshacer.`"
    confirm-label="Eliminar"
    variant="danger"
    @confirm="handleDeleteConfirm"
    @cancel="showConfirmDelete = false; deletingInsumo = null"
  />

  <ConfirmDialog
    :open="showConfirmDeleteCat"
    title="Eliminar categoría"
    :message="deletingCat && (deletingCat._count?.insumos ?? 0) > 0
      ? `La categoría ${deletingCat.nombre} tiene ${deletingCat._count.insumos} insumos asociados. No se puede eliminar.`
      : `Vas a eliminar la categoría ${deletingCat?.nombre}. Esta acción no se puede deshacer.`"
    :confirm-label="(deletingCat && (deletingCat._count?.insumos ?? 0) > 0) ? '' : 'Eliminar'"
    variant="danger"
    @confirm="handleDeleteCatConfirm"
    @cancel="showConfirmDeleteCat = false; deletingCat = null"
  />
</template>

<style scoped>
.row-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.row-action-btn {
  background: transparent;
  border: 0;
  color: var(--ink-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  transition: background 120ms ease, color 120ms ease;
}

.row-action-btn:hover { background: var(--page-bg); color: var(--ink); }
.row-action-danger:hover { background: var(--coral-50); color: var(--coral-500); }

.insumos-table tbody tr {
  cursor: pointer;
  user-select: none;
}
</style>
