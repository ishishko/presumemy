<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { patch } from '@/shared/api/client'
import { createTrigger } from '@/shared/lib/createTrigger'
import { usePresupuestosStore } from './store'
import { formatMoney, formatDate } from '@/shared/lib/format'
import PresupuestoEditor from './components/PresupuestoEditor.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FilterChips from '@/shared/ui/FilterChips.vue'
import DataTable from '@/shared/ui/DataTable.vue'
import RowActions from '@/shared/ui/RowActions.vue'
import Pagination from '@/shared/ui/Pagination.vue'
import { usePagination } from '@/shared/lib/usePagination'
import { useToast } from '@/shared/lib/useToast'
import type { Presupuesto } from '@/types'

const emit = defineEmits<{
  'set-editor-mode': [active: boolean, title: string, onSave: () => void, onClose: () => void]
}>()

const store = usePresupuestosStore()
const route = useRoute()
const { toast } = useToast()

const filter = ref('todos')
const showEditor = ref(false)
const editingPresupuesto = ref<Presupuesto | null>(null)
const showConfirmDelete = ref(false)
const deletingPresupuesto = ref<Presupuesto | null>(null)

const showLoading = computed(() => store.loading && !store.hasFetched)

const filtered = computed(() => {
  if (filter.value === 'todos') return store.data
  return store.data.filter((p) => p.estado === filter.value)
})

const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  paginatedItems,
  startIndex,
  endIndex,
  prevPage,
  nextPage,
} = usePagination(filtered, 10)

function money(v: number): string {
  return formatMoney(v)
}

const statusTones: Record<string, { tone: string; label: string }> = {
  borrador: { tone: 'default', label: 'Borrador' },
  en_curso: { tone: 'teal', label: 'En curso' },
  cerrado: { tone: 'mint', label: 'Cerrado' },
  facturado: { tone: 'lavender', label: 'Facturado' },
  cancelado: { tone: 'coral', label: 'Cancelado' },
  enviado: { tone: 'violet', label: 'Enviado' },
}

const TRANSITIONS: Record<string, string[]> = {
  borrador: ['en_curso', 'cancelado'],
  en_curso: ['cerrado', 'cancelado'],
  cerrado: ['facturado', 'en_curso'],
  facturado: [],
  cancelado: [],
  enviado: ['en_curso', 'cancelado'],
}

function getAvailableTransitions(state: string): string[] {
  return TRANSITIONS[state] || []
}

const activeDropdownId = ref<number | null>(null)
const showConfirmStateChange = ref(false)
const stateChangeTarget = ref<{ presupuesto: Presupuesto; newStatus: string } | null>(null)

function toggleDropdown(id: number) {
  if (activeDropdownId.value === id) {
    activeDropdownId.value = null
  } else {
    activeDropdownId.value = id
  }
}

function closeAllDropdowns() {
  activeDropdownId.value = null
}

onMounted(() => {
  window.addEventListener('click', closeAllDropdowns)
})

onUnmounted(() => {
  window.removeEventListener('click', closeAllDropdowns)
})

async function handleStatusChange(p: Presupuesto, newStatus: string) {
  if (newStatus === 'facturado' || newStatus === 'cancelado') {
    stateChangeTarget.value = { presupuesto: p, newStatus }
    showConfirmStateChange.value = true
    return
  }
  await proceedStatusChange(p, newStatus)
}

async function proceedStatusChange(p: Presupuesto, newStatus: string) {
  const originalStatus = p.estado
  p.estado = newStatus as any
  try {
    const updated = await patch<Presupuesto>('/presupuestos', `${p.id}/estado`, { estado: newStatus })
    store.upsert(updated)
    toast(`Estado actualizado a ${statusTones[newStatus]?.label || newStatus}`)
  } catch (e: any) {
    p.estado = originalStatus
    toast(e.message || 'Error al actualizar el estado', 'error')
  }
}

function handleStateChangeConfirm() {
  if (stateChangeTarget.value) {
    const { presupuesto, newStatus } = stateChangeTarget.value
    proceedStatusChange(presupuesto, newStatus)
  }
  showConfirmStateChange.value = false
  stateChangeTarget.value = null
}

function handleStateChangeCancel() {
  showConfirmStateChange.value = false
  stateChangeTarget.value = null
}

const filters = [
  { id: 'todos', label: 'Todos' },
  { id: 'borrador', label: 'Borrador' },
  { id: 'en_curso', label: 'En curso' },
  { id: 'cerrado', label: 'Cerrado' },
  { id: 'facturado', label: 'Facturado' },
  { id: 'cancelado', label: 'Cancelado' },
]

async function loadPresupuestos() {
  try {
    await store.fetch()
  } catch (e: any) {
    if (store.data.length === 0) {
      toast(e.message || 'Error al cargar presupuestos', 'error')
    }
  }
}

function handleCreate() {
  editingPresupuesto.value = null
  showEditor.value = true
}

function handleEdit(p: Presupuesto) {
  editingPresupuesto.value = p
  showEditor.value = true
}

function handleSaved(presupuesto: Presupuesto) {
  store.upsert(presupuesto)
}

function handleHeaderUpdate(payload: { mode: 'editor'; title: string; onSave: () => void; onClose: () => void } | { mode: 'normal' }) {
  if (payload.mode === 'editor') {
    emit('set-editor-mode', true, payload.title, payload.onSave, payload.onClose)
  } else {
    emit('set-editor-mode', false, '', () => {}, () => {})
  }
}

function handleClose() {
  showEditor.value = false
  emit('set-editor-mode', false, '', () => {}, () => {})
}

function handleDeleteClick(p: Presupuesto) {
  deletingPresupuesto.value = p
  showConfirmDelete.value = true
}

async function handleDeleteConfirm() {
  if (!deletingPresupuesto.value) return
  const p = deletingPresupuesto.value
  try {
    await store.remove(p.id)
    toast('Presupuesto eliminado', 'info')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
  deletingPresupuesto.value = null
}

function formatFecha(d?: string): string {
  if (!d) return '—'
  return formatDate(d, 'short')
}

const columns = [
  { key: 'folio', label: 'Folio', width: '100px' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'tematica', label: 'Temática' },
  { key: 'fecha', label: 'Fecha', width: '140px' },
  { key: 'estado', label: 'Estado', width: '160px' },
  { key: 'total', label: 'Total', align: 'right' as const, width: '140px' },
  { key: 'acciones', label: '', width: '80px' }
]

onMounted(loadPresupuestos)

watch(
  [() => route.query.edit, () => store.hasFetched],
  ([editVal, hasFetched]) => {
    if (editVal && hasFetched) {
      const p = store.data.find(item => item.folio === editVal || String(item.id) === editVal)
      if (p) {
        handleEdit(p)
      }
    }
  },
  { immediate: true }
)

watch(createTrigger, (val) => {
  if (val === 'presupuestos') {
    handleCreate()
    createTrigger.value = null
  }
})
</script>

<template>
  <div class="w-full">
    <div v-if="showLoading" class="border border-border rounded-lg bg-surface p-6">
      <p class="text-14 text-ink-muted">Cargando presupuestos...</p>
    </div>
    <template v-else>
      <div class="mb-4">
        <FilterChips
          v-model="filter"
          :chips="filters"
        />
      </div>

      <DataTable
        :columns="columns"
        :rows="paginatedItems"
        empty-text="Sin presupuestos con este filtro."
      >
        <template #row="{ item: p }">
          <td class="px-4 py-3.5 align-middle text-13 font-mono text-ink-muted select-none" @dblclick="handleEdit(p)">
            {{ p.folio }}
          </td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink font-medium select-none" @dblclick="handleEdit(p)">
            {{ p.cliente?.nombre || 'Sin cliente' }}
          </td>
          <td class="px-4 py-3.5 align-middle text-13 select-none" @dblclick="handleEdit(p)">
            <span v-if="p.tematica" class="badge lavender">
              {{ p.tematica }}
            </span>
            <span v-else class="text-ink-muted">—</span>
          </td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink-muted select-none" @dblclick="handleEdit(p)">
            {{ formatFecha(p.fechaEntrega || p.createdAt) }}
          </td>
          <td class="px-4 py-3.5 align-middle select-none">
            <div class="relative inline-block" @click.stop @dblclick.stop>
              <button
                type="button"
                class="status-badge-wrap"
                :class="[
                  statusTones[p.estado]?.tone || 'default',
                  getAvailableTransitions(p.estado).length > 0 ? 'interactive' : ''
                ]"
                @click="toggleDropdown(p.id)"
                :disabled="getAvailableTransitions(p.estado).length === 0"
              >
                <span class="dot" />
                <span>{{ statusTones[p.estado]?.label || p.estado }}</span>
                <span v-if="getAvailableTransitions(p.estado).length > 0" class="chevron-arrow" />
              </button>
              <div v-if="activeDropdownId === p.id" class="status-dropdown-menu" @click.stop>
                <button
                  v-for="t in getAvailableTransitions(p.estado)"
                  :key="t"
                  type="button"
                  class="status-dropdown-item"
                  :class="statusTones[t]?.tone || 'default'"
                  @click="handleStatusChange(p, t); activeDropdownId = null"
                >
                  <span class="dot" />
                  <span>{{ statusTones[t]?.label || t }}</span>
                </button>
              </div>
            </div>
          </td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink font-medium text-right tabular-nums select-none" @dblclick="handleEdit(p)">
            {{ money(p.total) }}
          </td>
          <td class="px-4 py-3.5 align-middle w-[80px]">
            <RowActions
              @edit="handleEdit(p)"
              @delete="handleDeleteClick(p)"
            />
          </td>
        </template>
      </DataTable>

      <Pagination
        v-if="filtered.length > 0"
        v-model:currentPage="currentPage"
        v-model:pageSize="pageSize"
        :totalPages="totalPages"
        :totalItems="totalItems"
        :startIndex="startIndex"
        :endIndex="endIndex"
        @prev="prevPage"
        @next="nextPage"
      />

      <PresupuestoEditor
        :open="showEditor"
        :presupuesto="editingPresupuesto"
        @close="handleClose"
        @saved="handleSaved"
        @update:header="handleHeaderUpdate"
      />
    </template>
  </div>

  <ConfirmDialog
    :open="showConfirmDelete"
    title="Eliminar presupuesto"
    :message="`Vas a eliminar ${deletingPresupuesto?.folio}. Esta acción no se puede deshacer.`"
    confirm-label="Eliminar"
    variant="danger"
    @confirm="handleDeleteConfirm"
    @cancel="showConfirmDelete = false; deletingPresupuesto = null"
  />

  <ConfirmDialog
    :open="showConfirmStateChange"
    :title="`Cambiar estado a ${statusTones[stateChangeTarget?.newStatus || '']?.label || ''}`"
    :message="stateChangeTarget?.newStatus === 'facturado'
      ? `¿Estás seguro de que deseas facturar el presupuesto ${stateChangeTarget?.presupuesto?.folio}? Esta acción registrará automáticamente los movimientos financieros de ingresos, egresos y retiros, y no se podrá deshacer.`
      : `¿Estás seguro de que deseas cancelar el presupuesto ${stateChangeTarget?.presupuesto?.folio}? Esta acción no se podrá deshacer.`"
    :confirm-label="stateChangeTarget?.newStatus === 'facturado' ? 'Facturar' : 'Cancelar presupuesto'"
    :variant="stateChangeTarget?.newStatus === 'facturado' ? 'default' : 'danger'"
    @confirm="handleStateChangeConfirm"
    @cancel="handleStateChangeCancel"
  />
</template>
