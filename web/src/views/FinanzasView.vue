<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '@/services/api'
import type { Transaccion, OrdenImprenta, PaginationResult, FinanzasKPIs } from '@/types'

const tab = ref('movimientos')
const tipoFilter = ref('todos')
const cuentaFilter = ref('todas')
const period = ref({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })

const transacciones = ref<Transaccion[]>([])
const ordenes = ref<OrdenImprenta[]>([])
const kpis = ref<FinanzasKPIs>({ ingresos: 0, egresos: 0, utilidad: 0 })
const loading = ref(true)
const error = ref('')

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

const ingresos = computed(() => transacciones.value.filter((t) => {
  const tipo = tipoMovs.find((m) => m.id === t.tipo)
  return tipo && tipo.color === '#2E6F70'
}).reduce((s, t) => s + Number(t.monto), 0))

const egresos = computed(() => transacciones.value.filter((t) => {
  const tipo = tipoMovs.find((m) => m.id === t.tipo)
  return tipo && tipo.color === '#EA5F3C'
}).reduce((s, t) => s + Number(t.monto), 0))

const utilidad = computed(() => ingresos.value - egresos.value)

const filteredMovs = computed(() => {
  return transacciones.value.filter((m) => {
    if (tipoFilter.value !== 'todos' && m.tipo !== tipoFilter.value) return false
    if (cuentaFilter.value !== 'todas' && m.cuenta !== cuentaFilter.value) return false
    return true
  })
})

async function loadData() {
  try {
    const [transRes, ordRes] = await Promise.all([
      get<PaginationResult<Transaccion> & { kpis: FinanzasKPIs }>('/finanzas', {
        page: 1, limit: 100, mes: period.value.month, anio: period.value.year,
      }),
      get<PaginationResult<OrdenImprenta>>('/finanzas/ordenes-imprenta', {
        page: 1, limit: 100, mes: period.value.month, anio: period.value.year,
      }),
    ])
    transacciones.value = transRes.data
    ordenes.value = ordRes.data
    kpis.value = transRes.kpis || { ingresos: ingresos.value, egresos: egresos.value, utilidad: utilidad.value }
  } catch (e: any) {
    error.value = e.message || 'Error al cargar finanzas'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="content">
    <div v-if="loading" class="card"><p>Cargando finanzas...</p></div>
    <div v-else-if="error" class="card"><p class="err">{{ error }}</p></div>

    <template v-else>
      <div class="grid-3" style="margin-bottom: 20px">
        <div class="card">
          <div class="eyebrow">Ingresos</div>
          <div class="kpi" style="margin-top: 6px">
            <div class="value" style="color: #2E6F70">{{ money(ingresos) }}</div>
          </div>
        </div>
        <div class="card">
          <div class="eyebrow">Egresos</div>
          <div class="kpi" style="margin-top: 6px">
            <div class="value" style="color: var(--coral-500)">{{ money(egresos) }}</div>
          </div>
        </div>
        <div class="card highlight">
          <div class="eyebrow">Utilidad</div>
          <div class="kpi" style="margin-top: 6px">
            <div class="value" style="color: var(--violet-700)">{{ money(utilidad) }}</div>
          </div>
        </div>
      </div>

      <div class="fin-tabs">
        <button
          :class="['fin-tab', tab === 'movimientos' && 'active']"
          @click="tab = 'movimientos'"
        >Movimientos <span class="count">{{ transacciones.length }}</span></button>
        <button
          :class="['fin-tab', tab === 'imprenta' && 'active']"
          @click="tab = 'imprenta'"
        >Imprenta <span class="count">{{ ordenes.length }}</span></button>
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
              </tr>
              <tr v-if="filteredMovs.length === 0">
                <td colspan="7" style="text-align: center; color: var(--ink-muted); padding: 24px 0">
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
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in ordenes" :key="o.id">
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
              </tr>
              <tr v-if="ordenes.length === 0">
                <td colspan="8" style="text-align: center; color: var(--ink-muted); padding: 24px 0">
                  Sin órdenes de imprenta en este período.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </div>
</template>
