<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Pencil, Trash2 } from '@lucide/vue'
import { del } from '@/services/api'
import { createTrigger } from '@/composables/useCreateTrigger'
import { useFinanzasStore } from '@/stores/finanzas'
import MovimientoDrawer from '@/components/drawers/MovimientoDrawer.vue'
import ImprentaDrawer from '@/components/drawers/ImprentaDrawer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
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

function money(v: number): string {
  return `$ ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function signedMoney(v: number): string {
  return (v >= 0 ? '+ ' : '− ') + money(Math.abs(v))
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const filteredMovs = computed(() => {
  return store.transacciones.filter((m) => {
    if (tipoFilter.value !== 'todos' && m.tipo !== tipoFilter.value) return false
    if (cuentaFilter.value !== 'todas' && m.cuenta !== cuentaFilter.value) return false
    return true
  })
})

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
}

function handleSavedOrden(orden: OrdenImprenta) {
  store.upsertOrden(orden)
}

function handleDeleteClick(type: 'mov' | 'imprenta', item: Transaccion | OrdenImprenta) {
  deleteTarget.value = { type, item }
  showConfirmDelete.value = true
}

async function handleDeleteConfirm() {
  if (!deleteTarget.value) return
  const { type, item } = deleteTarget.value
    const endpoint = type === 'mov' ? '/finanzas' : '/finanzas/ordenes-imprenta'
  const label = type === 'mov' ? 'Movimiento' : 'Orden'
  try {
    await del(endpoint, item.id)
    if (type === 'mov') store.removeTransaccion(item.id)
    else store.removeOrden(item.id)
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
  <div class="content">
    <div v-if="showLoading" class="card"><p>Cargando finanzas...</p></div>
    <template v-else>
    <div class="grid-3" style="margin-bottom: 20px">
      <div class="card">
        <div class="eyebrow">Ingresos</div>
        <div class="kpi" style="margin-top: 6px">
          <div class="value" style="color: #2E6F70">{{ money(store.kpis.ingresos) }}</div>
        </div>
      </div>
      <div class="card">
        <div class="eyebrow">Egresos</div>
        <div class="kpi" style="margin-top: 6px">
          <div class="value" style="color: var(--coral-500)">{{ money(store.kpis.egresos) }}</div>
        </div>
      </div>
      <div class="card highlight">
        <div class="eyebrow">Utilidad</div>
        <div class="kpi" style="margin-top: 6px">
          <div class="value" style="color: var(--violet-700)">{{ money(store.kpis.utilidad) }}</div>
        </div>
      </div>
    </div>

    <div class="fin-tabs">
      <button
        :class="['fin-tab', tab === 'movimientos' && 'active']"
        @click="tab = 'movimientos'"
      >Movimientos <span class="count">{{ store.transacciones.length }}</span></button>
      <button
        :class="['fin-tab', tab === 'imprenta' && 'active']"
        @click="tab = 'imprenta'"
      >Imprenta <span class="count">{{ store.ordenes.length }}</span></button>
      <div class="spacer" />
      <button
        class="btn btn-ghost btn-sm"
        @click="tab === 'movimientos' ? handleCreateMov() : handleCreateImprenta()"
      >
        <Plus :size="14" /> {{ tab === 'movimientos' ? 'Movimiento' : 'Orden' }}
      </button>
    </div>

    <template v-if="tab === 'movimientos'">
      <div class="fin-filter-row">
        <span class="lbl">Tipo</span>
        <button
          :class="['fin-pill', tipoFilter === 'todos' && 'active']"
          @click="tipoFilter = 'todos'"
        >Todos</button>
        <button
          v-for="t in tipoMovs"
          :key="t.id"
          :class="['fin-pill', tipoFilter === t.id && 'active']"
          @click="tipoFilter = t.id"
        >
          <span class="dot" :style="{ background: t.color }" />
          {{ t.label }}
        </button>
      </div>

      <div class="fin-filter-row last">
        <span class="lbl">Cuenta</span>
        <button
          :class="['fin-pill', cuentaFilter === 'todas' && 'active']"
          @click="cuentaFilter = 'todas'"
        >Todas</button>
        <button
          v-for="c in cuentas"
          :key="c.id"
          :class="['fin-pill', cuentaFilter === c.id && 'active']"
          @click="cuentaFilter = c.id"
        >{{ c.label }}</button>
      </div>

      <div class="table-wrap">
        <table class="data-table fin-table">
          <thead>
            <tr>
              <th style="width: 90px">Fecha</th>
              <th style="width: 130px">Tipo</th>
              <th style="width: 130px">Cuenta</th>
              <th style="width: 110px">Referencia</th>
              <th>Detalle</th>
              <th style="width: 140px">Nro. factura</th>
              <th class="num" style="width: 130px">Monto</th>
              <th style="width: 80px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in filteredMovs" :key="m.id">
              <td style="color: var(--ink-muted); font-variant-numeric: tabular-nums">{{ formatDate(m.fecha) }}</td>
              <td>
                <span
                  class="fin-tipo-badge"
                  :style="{
                    background: tipoMovs.find(t => t.id === m.tipo)?.color === '#2E6F70' ? 'var(--teal-100)' : 'var(--coral-50)',
                    color: tipoMovs.find(t => t.id === m.tipo)?.color || 'var(--ink-muted)'
                  }"
                >
                  <span class="dot" /> {{ tipoMovs.find(t => t.id === m.tipo)?.label || m.tipo }}
                </span>
              </td>
              <td class="fin-cuenta-cell">{{ m.cuenta }}</td>
              <td class="fin-ref-cell">{{ m.referencia || '—' }}</td>
              <td>{{ m.detalle }}</td>
              <td style="color: var(--ink-muted); font-family: var(--font-mono); font-size: 12px">
                {{ m.nroFactura || '—' }}
              </td>
              <td :class="['num', Number(m.monto) >= 0 ? 'fin-monto-pos' : 'fin-monto-neg']">
                {{ signedMoney(Number(m.monto)) }}
              </td>
              <td>
                <div class="row-actions">
                  <button class="row-action-btn" @click="handleEditMov(m)" title="Editar">
                    <Pencil :size="14" />
                  </button>
                  <button class="row-action-btn row-action-danger" @click="handleDeleteClick('mov', m)" title="Eliminar">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredMovs.length === 0">
              <td colspan="8" style="text-align: center; color: var(--ink-muted); padding: 24px 0">
                Sin movimientos con los filtros actuales.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px">
        <div style="font-size: 13px; color: var(--ink-muted)">
          Órdenes de impresión del período.
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table fin-table">
          <thead>
            <tr>
              <th style="width: 90px">Fecha</th>
              <th style="width: 110px">Presupuesto</th>
              <th>Temática</th>
              <th class="num" style="width: 70px">Hojas</th>
              <th style="width: 160px">Tipo hoja</th>
              <th class="num" style="width: 110px">Valor total</th>
              <th style="width: 130px">Método pago</th>
              <th style="width: 110px">Pagado</th>
              <th style="width: 80px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in store.ordenes" :key="o.id">
              <td style="color: var(--ink-muted); font-variant-numeric: tabular-nums">{{ formatDate(o.fecha) }}</td>
              <td class="fin-ref-cell">{{ o.presupuesto?.folio || '—' }}</td>
              <td style="font-weight: 500">{{ o.tematica }}</td>
              <td class="num" style="font-variant-numeric: tabular-nums">{{ o.hojas }}</td>
              <td style="color: var(--ink-muted)">{{ o.tipoHoja }}</td>
              <td class="num" style="font-variant-numeric: tabular-nums">{{ money(o.valorTotal) }}</td>
              <td style="color: var(--ink-muted); text-transform: capitalize">{{ o.metodoPago }}</td>
              <td>
                <span :class="['fin-pagado-badge', o.pagado ? 'si' : 'no']">
                  <span class="dot" /> {{ o.pagado ? 'Pagado' : 'Pendiente' }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="row-action-btn" @click="handleEditOrden(o)" title="Editar">
                    <Pencil :size="14" />
                  </button>
                  <button class="row-action-btn row-action-danger" @click="handleDeleteClick('imprenta', o)" title="Eliminar">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="store.ordenes.length === 0">
              <td colspan="9" style="text-align: center; color: var(--ink-muted); padding: 24px 0">
                Sin órdenes de imprenta en este período.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
