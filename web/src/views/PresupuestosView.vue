<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Pencil, Trash2 } from '@lucide/vue'
import { del } from '@/services/api'
import { createTrigger } from '@/composables/useCreateTrigger'
import { usePresupuestosStore } from '@/stores/presupuestos'
import PresupuestoEditor from '@/components/editors/PresupuestoEditor.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import type { Presupuesto } from '@/types'

const emit = defineEmits<{
  'set-editor-mode': [active: boolean, title: string, onSave: () => void, onClose: () => void]
}>()

const store = usePresupuestosStore()
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

function money(v: number): string {
  return `$ ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const statusTones: Record<string, { tone: string; label: string }> = {
  borrador: { tone: 'default', label: 'Borrador' },
  enviado: { tone: 'violet', label: 'Enviado' },
  en_curso: { tone: 'teal', label: 'En curso' },
  cerrado: { tone: 'mint', label: 'Cerrado' },
  facturado: { tone: 'lavender', label: 'Facturado' },
  cancelado: { tone: 'coral', label: 'Cancelado' },
}

const filters = [
  { id: 'todos', label: 'Todos' },
  { id: 'borrador', label: 'Borrador' },
  { id: 'enviado', label: 'Enviado' },
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
    await del('/presupuestos', p.id)
    store.remove(p.id)
    toast('Presupuesto eliminado', 'info')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
  deletingPresupuesto.value = null
}

function formatDate(d?: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(loadPresupuestos)

watch(createTrigger, (val) => {
  if (val === 'presupuestos') {
    handleCreate()
    createTrigger.value = null
  }
})
</script>

<template>
  <div class="content" style="position: relative">
    <div v-if="showLoading" class="card"><p>Cargando presupuestos...</p></div>
    <template v-else>
    <div class="table-wrap">
      <div class="table-toolbar">
        <button
          v-for="f in filters"
          :key="f.id"
          :class="['filter-chip', filter === f.id && 'active']"
          @click="filter = f.id"
        >{{ f.label }}</button>
        <div class="spacer" />
        <button class="btn btn-secondary btn-sm">Filtros</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Cliente</th>
            <th>Temática</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th class="num">Total</th>
            <th style="width: 80px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id">
            <td style="color: var(--ink-muted); font-family: var(--font-mono)">{{ p.folio }}</td>
            <td style="font-weight: 500">{{ p.cliente?.nombre || 'Sin cliente' }}</td>
            <td>
              <span class="badge lavender">{{ p.tematica || '—' }}</span>
            </td>
            <td style="color: var(--ink-muted)">{{ formatDate(p.fechaEntrega || p.createdAt) }}</td>
            <td>
              <span :class="['badge', statusTones[p.estado]?.tone || 'default']">
                <span class="dot" />
                {{ statusTones[p.estado]?.label || p.estado }}
              </span>
            </td>
            <td class="num" style="font-weight: 500">{{ money(p.total) }}</td>
            <td>
              <div class="row-actions">
                <button class="row-action-btn" @click="handleEdit(p)" title="Editar">
                  <Pencil :size="14" />
                </button>
                <button class="row-action-btn row-action-danger" @click="handleDeleteClick(p)" title="Eliminar">
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="7" style="text-align: center; color: var(--ink-muted); padding: 24px 0">
              Sin presupuestos con este filtro.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
</style>
