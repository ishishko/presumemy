<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus } from '@lucide/vue'
import { createTrigger } from '@/shared/lib/createTrigger'
import { useFinanzasStore } from './store'
import { formatMoney } from '@/shared/lib/format'
import MovimientoDrawer from './components/MovimientoDrawer.vue'
import ImprentaDrawer from './components/ImprentaDrawer.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import DataTable from '@/shared/ui/DataTable.vue'
import RowActions from '@/shared/ui/RowActions.vue'
import Pagination from '@/shared/ui/Pagination.vue'
import BaseKpi from '@/shared/ui/BaseKpi.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { useToast } from '@/shared/lib/useToast'
import { usePagination } from '@/shared/lib/usePagination'
import type { Transaccion, OrdenImprenta } from './types'

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
  { id: 'venta_producto', label: 'Venta producto', color: '#2E6F70' },
  { id: 'venta_presupuesto', label: 'Venta presupuesto', color: '#2E6F70' },
  { id: 'cobro_cliente', label: 'Cobro cliente', color: '#2E6F70' },
  { id: 'compra_insumo', label: 'Compra insumo', color: '#EA5F3C' },
  { id: 'pago_servicio', label: 'Pago servicio', color: '#EA5F3C' },
  { id: 'pago_imprenta', label: 'Pago imprenta', color: '#EA5F3C' },
  { id: 'pago_alquiler', label: 'Pago alquiler', color: '#EA5F3C' },
  { id: 'pago_sueldo', label: 'Pago sueldo', color: '#EA5F3C' },
  { id: 'retiro_socio', label: 'Retiro socio', color: '#EA5F3C' },
  { id: 'deposito', label: 'Deposito', color: '#2E6F70' },
  { id: 'ajuste_positivo', label: 'Ajuste positivo', color: '#2E6F70' },
  { id: 'ajuste_negativo', label: 'Ajuste negativo', color: '#EA5F3C' },
]

const cuentas = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'banco', label: 'Banco' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'billetera', label: 'Billetera' },
]

function signedMoney(v: number, tipo: string): string {
  return (esEgreso(tipo) ? '− ' : '+ ') + formatMoney(Math.abs(v))
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
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
  totalPages,
  prevPage,
  nextPage,
} = usePagination(filteredMovs, 10)

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
    await store.fetch()
    toast(`${label} eliminado`, 'info')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
  deleteTarget.value = null
}

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
  <div class="p-6">
    <div v-if="showLoading" class="bg-surface border border-border rounded-lg p-5">
      <p class="text-14 text-ink-muted">Cargando finanzas...</p>
    </div>
    <template v-else>
      <!-- KPIs -->
      <div class="grid grid-cols-3 gap-4 mb-5">
        <BaseKpi label="Ingresos" :value="formatMoney(store.kpis.ingresos)" />
        <BaseKpi label="Egresos" :value="formatMoney(store.kpis.egresos)" />
        <BaseKpi label="Utilidad" :value="formatMoney(store.kpis.utilidad)" />
      </div>

      <!-- Tabs -->
      <div class="flex items-center gap-2 mb-4">
        <div class="inline-flex items-center p-0.75 bg-surface border border-border-strong rounded-[10px] gap-0.5">
          <button
            :class="['bg-transparent border-0 font-sans text-13 font-medium py-1.75 px-4 rounded-lg cursor-pointer inline-flex items-center gap-1.75 transition-colors', tab === 'movimientos' ? 'bg-violet-700 text-white' : 'text-ink-muted hover:text-ink']"
            @click="tab = 'movimientos'"
          >Movimientos <span class="tabular-nums text-11 font-medium px-1.75 py-0.25 rounded-pill" :class="tab === 'movimientos' ? 'bg-white/20 text-white' : 'bg-page-bg text-ink-muted'">{{ store.transacciones.length }}</span></button>
          <button
            :class="['bg-transparent border-0 font-sans text-13 font-medium py-1.75 px-4 rounded-lg cursor-pointer inline-flex items-center gap-1.75 transition-colors', tab === 'imprenta' ? 'bg-violet-700 text-white' : 'text-ink-muted hover:text-ink']"
            @click="tab = 'imprenta'"
          >Imprenta <span class="tabular-nums text-11 font-medium px-1.75 py-0.25 rounded-pill" :class="tab === 'imprenta' ? 'bg-white/20 text-white' : 'bg-page-bg text-ink-muted'">{{ store.ordenes.length }}</span></button>
        </div>
        <div class="flex-1" />
        <BaseButton variant="ghost" @click="tab === 'movimientos' ? handleCreateMov() : handleCreateImprenta()">
          <Plus :size="14" /> {{ tab === 'movimientos' ? 'Movimiento' : 'Orden' }}
        </BaseButton>
      </div>

      <!-- Tab Movimientos -->
      <template v-if="tab === 'movimientos'">
        <!-- Filtros tipo -->
        <div class="flex flex-wrap gap-1.5 mb-2">
          <span class="text-11 uppercase tracking-0.06em text-ink-muted font-medium self-center mr-1.5">Tipo</span>
          <button
            :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-12 font-medium border transition-colors cursor-pointer', tipoFilter === 'todos' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-transparent text-ink-muted border-border hover:text-ink hover:border-border-strong']"
            @click="tipoFilter = 'todos'"
          >Todos</button>
          <button
            v-for="t in tipoMovs"
            :key="t.id"
            :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-12 font-medium border transition-colors cursor-pointer', tipoFilter === t.id ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-transparent text-ink-muted border-border hover:text-ink hover:border-border-strong']"
            @click="tipoFilter = t.id"
          >
            <span class="w-1.75 h-1.75 rounded-full" :style="{ background: t.color }" />
            {{ t.label }}
          </button>
        </div>

        <!-- Filtros cuenta -->
        <div class="flex flex-wrap gap-1.5 mb-2">
          <span class="text-11 uppercase tracking-0.06em text-ink-muted font-medium self-center mr-1.5">Cuenta</span>
          <button
            :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-12 font-medium border transition-colors cursor-pointer', cuentaFilter === 'todas' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-transparent text-ink-muted border-border hover:text-ink hover:border-border-strong']"
            @click="cuentaFilter = 'todas'"
          >Todas</button>
          <button
            v-for="c in cuentas"
            :key="c.id"
            :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-12 font-medium border transition-colors cursor-pointer', cuentaFilter === c.id ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-transparent text-ink-muted border-border hover:text-ink hover:border-border-strong']"
            @click="cuentaFilter = c.id"
          >{{ c.label }}</button>
        </div>

        <!-- Tabla -->
        <DataTable
          :columns="movColumns"
          :rows="filteredMovs"
          empty-text="Sin movimientos con los filtros actuales."
        >
          <template #row="{ item: m }">
            <td class="px-4 py-3 align-middle text-13 text-ink-muted tabular-nums">{{ formatDate(m.fecha) }}</td>
            <td class="px-4 py-3 align-middle">
              <span
                class="inline-flex items-center gap-1.5 text-12 font-medium px-2.5 py-0.75 rounded-pill"
                :style="{
                  background: tipoMovs.find(t => t.id === m.tipo)?.color === '#2E6F70' ? '#D6F0F1' : '#FCEBE6',
                  color: tipoMovs.find(t => t.id === m.tipo)?.color || '#6B6270'
                }"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current" /> {{ tipoMovs.find(t => t.id === m.tipo)?.label || m.tipo }}
              </span>
            </td>
            <td class="px-4 py-3 align-middle text-13 text-ink-muted capitalize">{{ m.cuenta }}</td>
            <td class="px-4 py-3 align-middle font-mono text-12 text-violet-700">{{ m.referencia || '—' }}</td>
            <td class="px-4 py-3 align-middle text-13 text-ink">{{ m.detalle }}</td>
            <td class="px-4 py-3 align-middle text-12 text-ink-muted font-mono">{{ m.nroFactura || '—' }}</td>
            <td class="px-4 py-3 align-middle text-13 font-medium text-right tabular-nums" :class="esEgreso(m.tipo) ? 'text-coral-500' : 'text-teal-700'">
              {{ signedMoney(Number(m.monto), m.tipo) }}
            </td>
            <td class="px-4 py-3 align-middle">
              <RowActions
                @edit="handleEditMov(m)"
                @delete="handleDeleteClick('mov', m)"
              />
            </td>
          </template>
        </DataTable>

        <Pagination
          v-if="filteredMovs.length > 0"
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          @prev="prevPage"
          @next="nextPage"
        />
      </template>

      <!-- Tab Imprenta -->
      <template v-else>
        <div class="text-13 text-ink-muted mb-3.5">
          Órdenes de impresión del período.
        </div>

        <DataTable
          :columns="imprentaColumns"
          :rows="store.ordenes"
          empty-text="Sin órdenes de imprenta en este período."
        >
          <template #row="{ item: o }">
            <td class="px-4 py-3 align-middle text-13 text-ink-muted tabular-nums">{{ formatDate(o.fecha) }}</td>
            <td class="px-4 py-3 align-middle font-mono text-12 text-violet-700">{{ o.presupuesto?.folio || '—' }}</td>
            <td class="px-4 py-3 align-middle text-13 text-ink font-medium">{{ o.tematica }}</td>
            <td class="px-4 py-3 align-middle text-13 text-ink text-right tabular-nums">{{ o.hojas }}</td>
            <td class="px-4 py-3 align-middle text-13 text-ink-muted">{{ o.tipoHoja }}</td>
            <td class="px-4 py-3 align-middle text-13 text-ink text-right tabular-nums">{{ formatMoney(o.valorTotal) }}</td>
            <td class="px-4 py-3 align-middle text-13 text-ink-muted capitalize">{{ o.metodoPago }}</td>
            <td class="px-4 py-3 align-middle">
              <span
                class="inline-flex items-center gap-1.5 text-12 font-medium px-2.5 py-0.75 rounded-pill"
                :class="o.pagado ? 'bg-mint text-green-700' : 'bg-coral-50 text-coral-500'"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current" /> {{ o.pagado ? 'Pagado' : 'Pendiente' }}
              </span>
            </td>
            <td class="px-4 py-3 align-middle">
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
