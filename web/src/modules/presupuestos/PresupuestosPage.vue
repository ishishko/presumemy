<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { patch } from '@/shared/api/client'
import { createTrigger } from '@/shared/lib/createTrigger'
import { usePresupuestosStore } from './store'
import { formatMoney, formatDate } from '@/shared/lib/format'
import PresupuestoEditor from './components/PresupuestoEditor.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import DataTable from '@/shared/ui/DataTable.vue'
import RowActions from '@/shared/ui/RowActions.vue'
import FilterChips from '@/shared/ui/FilterChips.vue'
import Pagination from '@/shared/ui/Pagination.vue'
import { useToast } from '@/shared/lib/useToast'
import { usePagination } from '@/shared/lib/usePagination'
import type { Presupuesto } from '@/types'

type Tone = 'default' | 'violet' | 'teal' | 'mint' | 'lavender' | 'coral'

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
  totalPages,
  prevPage,
  nextPage,
} = usePagination(filtered, 10)

const statusTones: Record<string, { tone: Tone; label: string }> = {
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

const stateChips = computed(() => [
  { id: 'todos', label: 'Todos', count: store.data.length },
  { id: 'borrador', label: 'Borrador', count: store.data.filter(p => p.estado === 'borrador').length },
  { id: 'en_curso', label: 'En curso', count: store.data.filter(p => p.estado === 'en_curso').length },
  { id: 'cerrado', label: 'Cerrado', count: store.data.filter(p => p.estado === 'cerrado').length },
  { id: 'facturado', label: 'Facturado', count: store.data.filter(p => p.estado === 'facturado').length },
  { id: 'cancelado', label: 'Cancelado', count: store.data.filter(p => p.estado === 'cancelado').length },
])

const columns = [
  { key: 'folio', label: 'Folio' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'tematica', label: 'Temática' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'estado', label: 'Estado' },
  { key: 'total', label: 'Total', align: 'right' as const },
  { key: 'acciones', label: '', width: '80px' }
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
  <div class="p-6 relative">
    <div v-if="showLoading" class="bg-surface border border-border rounded-lg p-5">
      <p class="text-14 text-ink-muted">Cargando presupuestos...</p>
    </div>
    <template v-else>
      <div class="mb-4">
        <FilterChips
          :model-value="filter"
          :chips="stateChips"
          @update:model-value="filter = $event || 'todos'"
        />
      </div>

      <DataTable
        :columns="columns"
        :rows="filtered"
        empty-text="Sin presupuestos con este filtro."
      >
        <template #row="{ item: p }">
          <td class="px-4 py-3 align-middle font-mono text-12 text-ink-muted" @dblclick="handleEdit(p)">{{ p.folio }}</td>
          <td class="px-4 py-3 align-middle text-14 text-ink font-medium" @dblclick="handleEdit(p)">{{ p.cliente?.nombre || 'Sin cliente' }}</td>
          <td class="px-4 py-3 align-middle" @dblclick="handleEdit(p)">
            <span class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-pill text-12 font-medium bg-violet-100 text-violet-700">
              {{ p.tematica || '—' }}
            </span>
          </td>
          <td class="px-4 py-3 align-middle text-13 text-ink-muted" @dblclick="handleEdit(p)">{{ formatDate(p.fechaEntrega || p.createdAt) }}</td>
          <td class="px-4 py-3 align-middle" @dblclick.stop>
            <div class="relative" @click.stop>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-pill text-12 font-medium border-0 cursor-pointer transition-all"
                :class="[
                  statusTones[p.estado]?.tone === 'default' ? 'bg-page-bg text-ink border border-border' :
                  statusTones[p.estado]?.tone === 'violet' ? 'bg-violet-100 text-violet-700' :
                  statusTones[p.estado]?.tone === 'teal' ? 'bg-teal-100 text-teal-700' :
                  statusTones[p.estado]?.tone === 'mint' ? 'bg-mint text-ink' :
                  statusTones[p.estado]?.tone === 'lavender' ? 'bg-lavender text-ink' :
                  statusTones[p.estado]?.tone === 'coral' ? 'bg-coral-50 text-coral-500' :
                  'bg-page-bg text-ink',
                  getAvailableTransitions(p.estado).length > 0 ? 'pr-5 relative' : ''
                ]"
                @click="toggleDropdown(p.id)"
                :disabled="getAvailableTransitions(p.estado).length === 0"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{{ statusTones[p.estado]?.label || p.estado }}</span>
                <span v-if="getAvailableTransitions(p.estado).length > 0" class="absolute right-2 w-1 h-1 border-r-[1.5px] border-b-[1.5px] border-current rotate-45 opacity-65" />
              </button>
              <div v-if="activeDropdownId === p.id" class="absolute top-full left-0 mt-1.5 bg-surface border border-border rounded-md shadow-pop z-100 w-36 py-1">
                <button
                  v-for="t in getAvailableTransitions(p.estado)"
                  :key="t"
                  type="button"
                  class="w-full text-left px-3 py-1.5 text-12 font-medium bg-transparent border-0 cursor-pointer flex items-center gap-1.5 text-ink hover:bg-page-bg transition-colors"
                  :class="[
                    statusTones[t]?.tone === 'default' ? 'text-ink' :
                    statusTones[t]?.tone === 'violet' ? 'text-violet-700' :
                    statusTones[t]?.tone === 'teal' ? 'text-teal-700' :
                    statusTones[t]?.tone === 'mint' ? 'text-green-700' :
                    statusTones[t]?.tone === 'lavender' ? 'text-violet-700' :
                    statusTones[t]?.tone === 'coral' ? 'text-coral-700' :
                    'text-ink'
                  ]"
                  @click="handleStatusChange(p, t); activeDropdownId = null"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{{ statusTones[t]?.label || t }}</span>
                </button>
              </div>
            </div>
          </td>
          <td class="px-4 py-3 align-middle text-14 text-ink font-medium text-right tabular-nums" @dblclick="handleEdit(p)">{{ formatMoney(p.total) }}</td>
          <td class="px-4 py-3 align-middle">
            <RowActions
              @edit="handleEdit(p)"
              @delete="handleDeleteClick(p)"
            />
          </td>
        </template>
      </DataTable>

      <Pagination
        v-if="filtered.length > 0"
        v-model:current-page="currentPage"
        :total-pages="totalPages"
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
