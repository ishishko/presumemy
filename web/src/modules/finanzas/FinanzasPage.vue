<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus } from '@lucide/vue'
import { createTrigger } from '@/shared/lib/createTrigger'
import { useFinanzasStore } from './store'
import { formatMoney, formatDate } from '@/shared/lib/format'
import MovimientoDrawer from './components/MovimientoDrawer.vue'
import ImprentaDrawer from './components/ImprentaDrawer.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FilterChips from '@/shared/ui/FilterChips.vue'
import SegmentedControl from '@/shared/ui/SegmentedControl.vue'
import DataTable from '@/shared/ui/DataTable.vue'
import RowActions from '@/shared/ui/RowActions.vue'
import StatusBadge from '@/shared/ui/StatusBadge.vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import Pagination from '@/shared/ui/Pagination.vue'
import { usePagination } from '@/shared/lib/usePagination'
import { useToast } from '@/shared/lib/useToast'
import type { Transaccion, OrdenImprenta } from '@/types'

const store = useFinanzasStore()
const { toast } = useToast()

const tab = ref('movimientos')
const tipoFilter = ref('todos')
const cuentaFilter = ref('todas')
const showMovDrawer = ref(false)
const showImprentaDrawer = ref(false)
const editingTransaccion = ref<Transaccion | null>(null)
const editingOrden = ref<OrdenImprenta | null>(null)
const showConfirmDelete = ref(false)
const deleteTarget = ref<{ type: 'mov' | 'imprenta'; item: Transaccion | OrdenImprenta } | null>(null)

const showLoading = computed(() => !store.hasFetched)

const TIPOS_EGRESO = [
  'compra_insumo', 'pago_servicio', 'pago_imprenta',
  'pago_alquiler', 'pago_sueldo', 'retiro_socio', 'ajuste_negativo'
]

function esEgreso(t: string): boolean {
  return TIPOS_EGRESO.includes(t)
}

const tipoMovs = [
  { id: 'venta_producto', label: 'Venta producto', color: 'var(--teal-ink)' },
  { id: 'venta_presupuesto', label: 'Venta presupuesto', color: 'var(--teal-ink)' },
  { id: 'cobro_cliente', label: 'Cobro cliente', color: 'var(--teal-ink)' },
  { id: 'compra_insumo', label: 'Compra insumo', color: 'var(--coral-500)' },
  { id: 'pago_servicio', label: 'Pago servicio', color: 'var(--coral-500)' },
  { id: 'pago_imprenta', label: 'Pago imprenta', color: 'var(--coral-500)' },
  { id: 'pago_alquiler', label: 'Pago alquiler', color: 'var(--coral-500)' },
  { id: 'pago_sueldo', label: 'Pago sueldo', color: 'var(--coral-500)' },
  { id: 'retiro_socio', label: 'Retiro socio', color: 'var(--coral-500)' },
  { id: 'deposito', label: 'Depósito', color: 'var(--teal-ink)' },
  { id: 'ajuste_positivo', label: 'Ajuste positivo', color: 'var(--teal-ink)' },
  { id: 'ajuste_negativo', label: 'Ajuste negativo', color: 'var(--coral-500)' },
]

const cuentas = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'banco', label: 'Banco' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'billetera', label: 'Billetera' },
]

const tabOptions = computed(() => [
  { value: 'movimientos', label: `Movimientos (${store.transacciones.length})` },
  { value: 'imprenta', label: `Imprenta (${store.ordenes.length})` }
])

const tipoChips = computed(() => [
  { id: 'todos', label: 'Todos' },
  ...tipoMovs.map(t => ({
    id: t.id,
    label: t.label,
    dotTone: (t.color === 'var(--teal-ink)' ? 'ok' : 'danger') as 'ok' | 'danger'
  }))
])

const cuentaChips = computed(() => [
  { id: 'todas', label: 'Todas' },
  ...cuentas.map(c => ({
    id: c.id,
    label: c.label
  }))
])

function money(v: number): string {
  return formatMoney(v)
}

function signedMoney(v: number, tipo: string): string {
  return (esEgreso(tipo) ? '− ' : '+ ') + money(Math.abs(v))
}

function formatFecha(d: string): string {
  return formatDate(d, 'short')
}

const filteredMovs = computed(() => {
  return store.transacciones.filter((m) => {
    if (tipoFilter.value !== 'todos' && m.tipo !== tipoFilter.value) return false
    if (cuentaFilter.value !== 'todas' && m.cuenta !== cuentaFilter.value) return false
    return true
  })
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
} = usePagination(filteredMovs, 10)

async function loadData() {
  try {
    await store.fetch({ year: store.currentPeriod.year, month: store.currentPeriod.month })
  } catch (e: any) {
    if (store.transacciones.length === 0) {
      toast(e.message || 'Error al cargar finanzas', 'error')
    }
  }
}

function handleCreateMov() {
  editingTransaccion.value = null
  showMovDrawer.value = true
}

function handleCreateImprenta() {
  editingOrden.value = null
  showImprentaDrawer.value = true
}

function handleEditMov(t: Transaccion) {
  editingTransaccion.value = t
  showMovDrawer.value = true
}

function handleEditOrden(o: OrdenImprenta) {
  editingOrden.value = o
  showImprentaDrawer.value = true
}

function handleSavedMov(transaccion: Transaccion) {
  store.upsertTransaccion(transaccion)
  store.fetch()
}

function handleSavedOrden(orden: OrdenImprenta) {
  store.upsertOrden(orden)
  store.fetch()
}

function handleDeleteClick(type: 'mov' | 'imprenta', item: Transaccion | OrdenImprenta) {
  deleteTarget.value = { type, item }
  showConfirmDelete.value = true
}

async function handleDeleteConfirm() {
  if (!deleteTarget.value) return
  const { type, item } = deleteTarget.value
  const label = type === 'mov' ? 'Movimiento' : 'Orden'
  try {
    if (type === 'mov') {
      await store.removeTransaccion(item.id)
    } else {
      await store.removeOrden(item.id)
    }
    toast(`${label} eliminado`, 'info')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
  deleteTarget.value = null
}

const movColumns = [
  { key: 'fecha', label: 'Fecha', width: '90px' },
  { key: 'tipo', label: 'Tipo', width: '130px' },
  { key: 'cuenta', label: 'Cuenta', width: '130px' },
  { key: 'referencia', label: 'Referencia', width: '110px' },
  { key: 'detalle', label: 'Detalle' },
  { key: 'nroFactura', label: 'Nro. factura', width: '140px' },
  { key: 'monto', label: 'Monto', align: 'right' as const, width: '130px' },
  { key: 'acciones', label: '', width: '80px' }
]

const imprentaColumns = [
  { key: 'fecha', label: 'Fecha', width: '90px' },
  { key: 'presupuesto', label: 'Presupuesto', width: '110px' },
  { key: 'tematica', label: 'Temática' },
  { key: 'hojas', label: 'Hojas', align: 'right' as const, width: '70px' },
  { key: 'tipoHoja', label: 'Tipo hoja', width: '160px' },
  { key: 'valorTotal', label: 'Valor total', align: 'right' as const, width: '110px' },
  { key: 'metodoPago', label: 'Método pago', width: '130px' },
  { key: 'pagado', label: 'Pagado', width: '110px' },
  { key: 'acciones', label: '', width: '80px' }
]

onMounted(loadData)

watch(createTrigger, (val) => {
  if (val === 'finanzas') {
    if (tab.value === 'movimientos') handleCreateMov()
    else handleCreateImprenta()
    createTrigger.value = null
  }
})
</script>

<template>
  <div class="w-full">
    <div v-if="showLoading" class="border border-border rounded-lg bg-surface p-6">
      <p class="text-14 text-ink-muted">Cargando finanzas...</p>
    </div>
    <template v-else>
      <!-- KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <BaseCard class="bg-teal-50/20 border-teal-100/50">
          <div class="flex flex-col gap-1">
            <span class="text-11 uppercase tracking-[0.06em] text-teal-700 font-medium">Ingresos</span>
            <span class="text-28 font-medium text-teal-700 font-mono tabular-nums leading-none">{{ money(store.kpis.ingresos) }}</span>
          </div>
        </BaseCard>
        <BaseCard class="bg-coral-50/20 border-coral-100/50">
          <div class="flex flex-col gap-1">
            <span class="text-11 uppercase tracking-[0.06em] text-coral-700 font-medium">Egresos</span>
            <span class="text-28 font-medium text-coral-600 font-mono tabular-nums leading-none">{{ money(store.kpis.egresos) }}</span>
          </div>
        </BaseCard>
        <BaseCard class="bg-violet-50/20 border-violet-100/50">
          <div class="flex flex-col gap-1">
            <span class="text-11 uppercase tracking-[0.06em] text-violet-700 font-medium">Utilidad</span>
            <span class="text-28 font-medium text-violet-700 font-mono tabular-nums leading-none">{{ money(store.kpis.utilidad) }}</span>
          </div>
        </BaseCard>
      </div>

      <!-- Toolbar / Segmented Control Tabs -->
      <div class="flex justify-between items-center mb-5 border-b border-border pb-4 gap-4 flex-wrap">
        <SegmentedControl
          v-model="tab"
          :options="tabOptions"
        />
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-13 font-medium bg-violet-50 text-violet-700 hover:bg-violet-100/60 rounded-md transition-colors cursor-pointer border border-transparent focus-visible:outline-none focus-visible:shadow-focus-ring"
          @click="tab === 'movimientos' ? handleCreateMov() : handleCreateImprenta()"
        >
          <Plus :size="14" /> {{ tab === 'movimientos' ? 'Movimiento' : 'Orden' }}
        </button>
      </div>

      <!-- Tab Movimientos -->
      <template v-if="tab === 'movimientos'">
        <div class="flex flex-col gap-3.5 mb-5 bg-page-bg/40 p-4 border border-border rounded-lg">
          <div class="flex items-center gap-4 flex-wrap">
            <span class="text-12 font-medium text-ink-muted w-14 shrink-0 uppercase tracking-wider select-none">Tipo</span>
            <FilterChips
              v-model="tipoFilter"
              :chips="tipoChips"
            />
          </div>

          <div class="flex items-center gap-4 flex-wrap">
            <span class="text-12 font-medium text-ink-muted w-14 shrink-0 uppercase tracking-wider select-none">Cuenta</span>
            <FilterChips
              v-model="cuentaFilter"
              :chips="cuentaChips"
            />
          </div>
        </div>

        <DataTable
          :columns="movColumns"
          :rows="paginatedItems"
          empty-text="Sin movimientos con los filtros actuales."
        >
          <template #row="{ item: m }">
            <td class="px-4 py-3.5 align-middle text-13 text-ink-muted tabular-nums select-none" @dblclick="handleEditMov(m)">
              {{ formatFecha(m.fecha) }}
            </td>
            <td class="px-4 py-3.5 align-middle select-none" @dblclick="handleEditMov(m)">
              <StatusBadge
                :label="tipoMovs.find(t => t.id === m.tipo)?.label || m.tipo"
                :tone="esEgreso(m.tipo) ? 'danger' : 'ok'"
              />
            </td>
            <td class="px-4 py-3.5 align-middle text-13 text-ink select-none" @dblclick="handleEditMov(m)">
              {{ m.cuenta }}
            </td>
            <td class="px-4 py-3.5 align-middle text-13 text-ink-muted font-mono select-none" @dblclick="handleEditMov(m)">
              {{ m.referencia || '—' }}
            </td>
            <td class="px-4 py-3.5 align-middle text-13 text-ink" @dblclick="handleEditMov(m)">
              {{ m.detalle }}
            </td>
            <td class="px-4 py-3.5 align-middle text-12 text-ink-muted font-mono select-none" @dblclick="handleEditMov(m)">
              {{ m.nroFactura || '—' }}
            </td>
            <td
              class="px-4 py-3.5 align-middle text-13 font-semibold text-right tabular-nums select-none"
              :class="[esEgreso(m.tipo) ? 'text-coral-600' : 'text-teal-650']"
              @dblclick="handleEditMov(m)"
            >
              {{ signedMoney(Number(m.monto), m.tipo) }}
            </td>
            <td class="px-4 py-3.5 align-middle w-[80px]">
              <RowActions
                @edit="handleEditMov(m)"
                @delete="handleDeleteClick('mov', m)"
              />
            </td>
          </template>
        </DataTable>

        <Pagination
          v-if="filteredMovs.length > 0"
          v-model:currentPage="currentPage"
          v-model:pageSize="pageSize"
          :totalPages="totalPages"
          :totalItems="totalItems"
          :startIndex="startIndex"
          :endIndex="endIndex"
          @prev="prevPage"
          @next="nextPage"
        />
      </template>

      <!-- Tab Imprenta -->
      <template v-else>
        <div class="mb-4 text-13 text-ink-muted select-none">
          Órdenes de impresión del período.
        </div>

        <DataTable
          :columns="imprentaColumns"
          :rows="store.ordenes"
          empty-text="Sin órdenes de imprenta en este período."
        >
          <template #row="{ item: o }">
            <td class="px-4 py-3.5 align-middle text-13 text-ink-muted tabular-nums select-none" @dblclick="handleEditOrden(o)">
              {{ formatFecha(o.fecha) }}
            </td>
            <td class="px-4 py-3.5 align-middle text-13 text-ink-muted font-mono select-none" @dblclick="handleEditOrden(o)">
              {{ o.presupuesto?.folio || '—' }}
            </td>
            <td class="px-4 py-3.5 align-middle text-13 text-ink font-medium" @dblclick="handleEditOrden(o)">
              {{ o.tematica }}
            </td>
            <td class="px-4 py-3.5 align-middle text-13 text-ink text-right tabular-nums select-none" @dblclick="handleEditOrden(o)">
              {{ o.hojas }}
            </td>
            <td class="px-4 py-3.5 align-middle text-13 text-ink-muted select-none" @dblclick="handleEditOrden(o)">
              {{ o.tipoHoja }}
            </td>
            <td class="px-4 py-3.5 align-middle text-13 text-ink text-right tabular-nums select-none" @dblclick="handleEditOrden(o)">
              {{ money(o.valorTotal) }}
            </td>
            <td class="px-4 py-3.5 align-middle text-13 text-ink-muted capitalize select-none" @dblclick="handleEditOrden(o)">
              {{ o.metodoPago }}
            </td>
            <td class="px-4 py-3.5 align-middle select-none" @dblclick="handleEditOrden(o)">
              <StatusBadge
                :label="o.pagado ? 'Pagado' : 'Pendiente'"
                :tone="o.pagado ? 'ok' : 'danger'"
              />
            </td>
            <td class="px-4 py-3.5 align-middle w-[80px]">
              <RowActions
                @edit="handleEditOrden(o)"
                @delete="handleDeleteClick('imprenta', o)"
              />
            </td>
          </template>
        </DataTable>
      </template>
    </template>

    <MovimientoDrawer
      :open="showMovDrawer"
      :transaccion="editingTransaccion"
      @close="showMovDrawer = false"
      @saved="handleSavedMov"
    />

    <ImprentaDrawer
      :open="showImprentaDrawer"
      :orden="editingOrden"
      @close="showImprentaDrawer = false"
      @saved="handleSavedOrden"
    />

    <ConfirmDialog
      :open="showConfirmDelete"
      :title="deleteTarget?.type === 'mov' ? 'Eliminar movimiento' : 'Eliminar orden'"
      :message="`Vas a eliminar este registro. Esta acción no se puede deshacer.`"
      confirm-label="Eliminar"
      variant="danger"
      @confirm="handleDeleteConfirm"
      @cancel="showConfirmDelete = false; deleteTarget = null"
    />
  </div>
</template>
