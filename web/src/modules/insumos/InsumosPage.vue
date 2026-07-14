<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { createTrigger } from '@/shared/lib/createTrigger'
import { useInsumosStore } from '@/modules/insumos/store'
import { getNivel } from '@/modules/insumos/stock'
import { formatMoney } from '@/shared/lib/format'
import InsumoDetalle from './components/InsumoDetalle.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FilterChips from '@/shared/ui/FilterChips.vue'
import DataTable from '@/shared/ui/DataTable.vue'
import RowActions from '@/shared/ui/RowActions.vue'
import StockBar from './components/StockBar.vue'
import CategoriaPills from '@/shared/ui/CategoriaPills.vue'
import CategoriaDeleteDialog from '@/shared/ui/CategoriaDeleteDialog.vue'
import { useToast } from '@/shared/lib/useToast'
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

const counts = computed(() => {
  const c = { sin_unidades: 0, critico: 0, bajo: 0, ok: 0 }
  store.data.forEach((i) => {
    c[getNivel(Number(i.stock), Number(i.stockMinimo))]++
  })
  return c
})

const filtered = computed(() => {
  return store.data.filter((i) => {
    if (stateFilter.value !== 'todos' && getNivel(Number(i.stock), Number(i.stockMinimo)) !== stateFilter.value) return false
    if (catFilter.value !== 'todas' && i.categoriaId !== catFilter.value) return false
    return true
  })
})

const stateChips = computed(() => [
  { id: 'todos', label: 'Todos', count: store.data.length },
  { id: 'ok', label: 'OK', count: counts.value.ok, dotTone: 'ok' as const },
  { id: 'bajo', label: 'Bajo', count: counts.value.bajo, dotTone: 'warning' as const },
  { id: 'critico', label: 'Crítico', count: counts.value.critico, dotTone: 'danger' as const },
  { id: 'sin_unidades', label: 'Sin unidades', count: counts.value.sin_unidades, dotTone: 'danger' as const },
])

const columns = [
  { key: 'nombre', label: 'Insumo' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'stock', label: 'Stock', align: 'right' as const },
  { key: 'stockMinimo', label: 'Mínimo', align: 'right' as const },
  { key: 'costoUnitario', label: 'Costo unitario', align: 'right' as const },
  { key: 'nivel', label: 'Nivel', width: '160px' },
  { key: 'acciones', label: '', width: '80px' }
]

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
    await store.remove(i.id)
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
  <div class="p-6">
    <div v-if="showLoading" class="bg-surface border border-border rounded-lg p-5">
      <p class="text-14 text-ink-muted">Cargando insumos...</p>
    </div>
    <template v-else>
      <div class="mb-4">
        <FilterChips
          :model-value="stateFilter"
          :chips="stateChips"
          deselectable
          @update:model-value="stateFilter = $event === null ? 'todos' : ($event as string)"
        />
      </div>

      <CategoriaPills
        v-model="catFilter"
        all-label="Todas"
        :categorias="store.categorias"
        @create="handleCreateCat"
        @rename="handleRenameCat"
        @remove="handleRemoveCatClick"
      />

      <DataTable
        :columns="columns"
        :rows="filtered"
        empty-text="Sin resultados con los filtros actuales."
      >
        <template #row="{ item: i }">
          <td class="px-4 py-3.5 align-middle text-13 text-ink font-medium select-none" @dblclick="handleEdit(i)">
            <div class="flex flex-col gap-0.5">
              <span>{{ i.nombre }}</span>
              <span class="text-11 text-ink-muted font-mono">{{ i.codigo }}</span>
            </div>
          </td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink-muted select-none" @dblclick="handleEdit(i)">
            {{ i.categoria?.nombre }}
          </td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink font-medium text-right tabular-nums select-none" @dblclick="handleEdit(i)">
            {{ i.stock }} <span class="text-ink-muted text-12 font-normal">{{ i.unidad }}</span>
          </td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink-muted text-right select-none" @dblclick="handleEdit(i)">
            {{ i.stockMinimo }} <span class="text-12">{{ i.unidad }}</span>
          </td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink text-right tabular-nums select-none" @dblclick="handleEdit(i)">
            {{ i.costoUnitario ? formatMoney(i.costoUnitario) : '—' }}
          </td>
          <td class="px-4 py-3.5 align-middle w-[160px]" @dblclick="handleEdit(i)">
            <StockBar :stock="Number(i.stock)" :minimo="Number(i.stockMinimo)" />
          </td>
          <td class="px-4 py-3.5 align-middle w-[80px]">
            <RowActions
              @edit="handleEdit(i)"
              @delete="handleDeleteClick(i)"
            />
          </td>
        </template>
      </DataTable>

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

  <CategoriaDeleteDialog
    :open="showConfirmDeleteCat"
    :categoria="deletingCat"
    :categorias="store.categorias"
    @confirm="handleDeleteCatConfirm"
    @cancel="showConfirmDeleteCat = false; deletingCat = null"
  />
</template>
