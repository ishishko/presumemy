<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Star } from '@lucide/vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useToast } from '@/composables/useToast'
import { useClientesStore } from '@/stores/clientes'
import { useFinanzasStore } from '@/stores/finanzas'
import { useInsumosStore } from '@/stores/insumos'
import { usePresupuestosStore } from '@/stores/presupuestos'
import { useProductosStore } from '@/stores/productos'
import type { ConfiguracionNegocio } from '@/types'
import { get } from '@/services/api'

const store = useDashboardStore()
const router = useRouter()
const { toast } = useToast()

const clientesStore = useClientesStore()
const finanzasStore = useFinanzasStore()
const insumosStore = useInsumosStore()
const presupuestosStore = usePresupuestosStore()
const productosStore = useProductosStore()

const config = ref<ConfiguracionNegocio | null>(null)

const showLoading = computed(() => !store.stats || !productosStore.hasFetched || !insumosStore.hasFetched || !config.value)

function money(v: number): string {
  return `$ ${v.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const statusTones: Record<string, { tone: string; label: string }> = {
  borrador: { tone: 'default', label: 'Borrador' },
  enviado: { tone: 'violet', label: 'Enviado' },
  en_curso: { tone: 'teal', label: 'En curso' },
  cerrado: { tone: 'mint', label: 'Cerrado' },
  facturado: { tone: 'lavender', label: 'Facturado' },
  cancelado: { tone: 'coral', label: 'Cancelado' },
}

const topInsumosAReponer = computed(() => {
  return insumosStore.data
    .filter(i => Number(i.stock) < Number(i.stockMinimo))
    .sort((a, b) => {
      const ratioA = Number(a.stockMinimo) > 0 ? Number(a.stock) / Number(a.stockMinimo) : 0
      const ratioB = Number(b.stockMinimo) > 0 ? Number(b.stock) / Number(b.stockMinimo) : 0
      return ratioA - ratioB
    })
    .slice(0, 5)
})

const capacidadFabricacion = computed(() => {
  return productosStore.data
    .filter(p => p.tieneBom && p.activo)
    .map(p => {
      const consumo = new Map<number, { nombre: string; stock: number; cantidad: number }>()
      for (const l of p.bomLineas ?? []) {
        if (l.insumoId == null) continue
        const cantidad = Number(l.cantidad)
        if (cantidad <= 0) continue
        
        const liveInsumo = insumosStore.data.find(i => i.id === l.insumoId)
        if (!liveInsumo) continue
        
        const prev = consumo.get(l.insumoId)
        if (prev) {
          prev.cantidad += cantidad
        } else {
          consumo.set(l.insumoId, {
            nombre: liveInsumo.nombre,
            stock: Number(liveInsumo.stock),
            cantidad
          })
        }
      }
      if (consumo.size === 0) return null
      
      let capacidad = Infinity
      let insumoLimitante = ''
      for (const ins of consumo.values()) {
        const u = Math.floor(ins.stock / ins.cantidad)
        if (u < capacidad) {
          capacidad = u
          insumoLimitante = ins.nombre
        }
      }
      return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        favorito: p.favorito,
        capacidad,
        insumoLimitante
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => (Number(b.favorito) - Number(a.favorito)) || (a.capacidad - b.capacidad))
    .slice(0, 10)
})

function isAtrasado(fechaStr: string): boolean {
  const targetDate = new Date(fechaStr)
  const target = new Date(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate())
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return target < today
}

function formatFechaEntrega(fechaStr: string): string {
  if (!config.value) return ''
  if (config.value.formatoFechaDashboard === 'absoluto') {
    const date = new Date(fechaStr)
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    const day = utcDate.getDate().toString().padStart(2, '0')
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const month = months[utcDate.getMonth()]
    const year = utcDate.getFullYear()
    return `${day} ${month} ${year}`
  } else {
    const targetDate = new Date(fechaStr)
    const target = new Date(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate())
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Entrega hoy'
    } else if (diffDays === 1) {
      return 'Entrega mañana'
    } else if (diffDays === -1) {
      return 'Atrasado hace 1 día'
    } else if (diffDays < -1) {
      return `Atrasado hace ${Math.abs(diffDays)} días`
    } else {
      return `En ${diffDays} días`
    }
  }
}

async function loadDashboard() {
  try {
    const [configRes] = await Promise.all([
      get<{ data: ConfiguracionNegocio }>('/ajustes/configuracion'),
      store.fetch(),
      productosStore.hasFetched ? Promise.resolve() : productosStore.fetch(),
      insumosStore.hasFetched ? Promise.resolve() : insumosStore.fetch(),
    ])
    config.value = configRes.data
    
    // Precargar otros almacenes/stores en segundo plano
    if (!clientesStore.hasFetched) clientesStore.fetch().catch(() => {})
    if (!finanzasStore.hasFetched) finanzasStore.fetch().catch(() => {})
    if (!presupuestosStore.hasFetched) presupuestosStore.fetch().catch(() => {})
  } catch (e: any) {
    if (!store.stats) {
      toast(e.message || 'Error al cargar datos', 'error')
    }
  }
}

onMounted(loadDashboard)
</script>

<template>
  <div class="content">
    <div v-if="showLoading" class="card">
      <p>Cargando dashboard...</p>
    </div>

    <template v-else>
      <div class="grid-2">
        <!-- Columna Izquierda: Finanzas, Entregas y Presupuestos Recientes -->
        <div style="display: flex; flex-direction: column; gap: var(--s-4)">
          <!-- Card de Finanzas integrada -->
          <div class="card highlight">
            <div style="display: flex; gap: var(--s-6); align-items: center">
              <div style="flex: 1">
                <div class="eyebrow" style="color: var(--violet-700)">Ingresos · este mes</div>
                <div class="kpi" style="margin-top: 6px">
                  <div class="value" style="color: var(--violet-700)">{{ money(store.stats!.kpis.ingresosMes) }}</div>
                </div>
              </div>
              <div style="width: 1px; align-self: stretch; background: var(--border-strong)"></div>
              <div style="flex: 1">
                <div class="eyebrow" style="color: var(--violet-700)">Por cobrar</div>
                <div class="kpi" style="margin-top: 6px">
                  <div class="value" style="color: var(--violet-700)">{{ money(store.stats!.kpis.porCobrar) }}</div>
                  <div class="delta" style="color: var(--violet-700); opacity: 0.85">
                    {{ store.stats!.statsPorEstado.filter(s => ['enviado', 'en_curso'].includes(s.estado)).reduce((sum, s) => sum + s._count.id, 0) }} presupuestos pendientes
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel Próximos a entregar -->
          <div class="card" style="padding: 0">
            <div class="card-head" style="padding: 18px 20px 14px; margin: 0">
              <h3>Próximos a entregar</h3>
              <button class="btn btn-ghost btn-sm" @click="router.push({ name: 'presupuestos' })">
                Ver todos <ArrowRight :size="14" :stroke-width="2" />
              </button>
            </div>
            <div v-if="store.stats!.proximosEntregar.length === 0" style="padding: 20px; color: var(--ink-muted); font-size: 13px; text-align: center">
              Sin entregas próximas
            </div>
            <table v-else class="data-table">
              <tbody>
                <tr
                  v-for="p in store.stats!.proximosEntregar"
                  :key="p.folio"
                  @click="router.push({ name: 'presupuestos', query: { edit: p.folio } })"
                  style="cursor: pointer"
                  :style="isAtrasado(p.fechaEntrega!) ? 'background-color: var(--coral-50);' : ''"
                >
                  <td style="width: 80px; color: var(--ink-muted)">{{ p.folio }}</td>
                  <td>
                    <div style="font-weight: 500">{{ p.cliente?.nombre || 'Sin cliente' }}</div>
                    <div style="font-size: 12px; color: var(--ink-muted); margin-top: 2px">
                      {{ p.tematica || 'Sin temática' }}
                    </div>
                  </td>
                  <td style="text-align: right">
                    <span v-if="isAtrasado(p.fechaEntrega!)" class="badge coral" style="margin-right: 8px">
                      Atrasado
                    </span>
                    <span :style="isAtrasado(p.fechaEntrega!) ? 'color: var(--coral-500); font-weight: 500;' : 'color: var(--ink-muted); font-weight: 500;'">
                      {{ formatFechaEntrega(p.fechaEntrega!) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Panel Presupuestos recientes -->
          <div class="card" style="padding: 0">
            <div class="card-head" style="padding: 18px 20px 14px; margin: 0">
              <h3>Presupuestos recientes</h3>
              <button class="btn btn-ghost btn-sm" @click="router.push({ name: 'presupuestos' })">
                Ver todos <ArrowRight :size="14" :stroke-width="2" />
              </button>
            </div>
            <div v-if="store.stats!.presupuestosRecientes.length === 0" style="padding: 20px; color: var(--ink-muted); font-size: 13px; text-align: center">
              Sin presupuestos aún
            </div>
            <table v-else class="data-table">
              <tbody>
                <tr
                  v-for="p in store.stats!.presupuestosRecientes"
                  :key="p.folio"
                  @click="router.push({ name: 'presupuestos', query: { edit: p.folio } })"
                  style="cursor: pointer"
                >
                  <td style="width: 80px; color: var(--ink-muted)">{{ p.folio }}</td>
                  <td>
                    <div style="font-weight: 500">{{ p.cliente?.nombre || 'Sin cliente' }}</div>
                    <div style="font-size: 12px; color: var(--ink-muted); margin-top: 2px">
                      {{ p.tematica || 'Sin temática' }}
                    </div>
                  </td>
                  <td>
                    <span :class="['badge', statusTones[p.estado]?.tone || 'default']">
                      <span class="dot" />
                      {{ statusTones[p.estado]?.label || p.estado }}
                    </span>
                  </td>
                  <td class="num" style="font-weight: 500">{{ money(p.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Columna Derecha: Capacidad de fabricación e Insumos a reponer -->
        <div style="display: flex; flex-direction: column; gap: var(--s-4)">
          <!-- Panel Capacidad de fabricación -->
          <div class="card" style="padding: 0">
            <div class="card-head" style="padding: 18px 20px 14px; margin: 0">
              <h3>Capacidad de fabricación</h3>
              <button class="btn btn-ghost btn-sm" @click="router.push({ name: 'productos' })">
                Ver catálogo <ArrowRight :size="14" :stroke-width="2" />
              </button>
            </div>
            <div v-if="capacidadFabricacion.length === 0" style="padding: 20px; color: var(--ink-muted); font-size: 13px; text-align: center">
              Sin productos con receta de insumos
            </div>
            <div v-else style="padding: 0 20px 20px">
              <div
                v-for="p in capacidadFabricacion"
                :key="p.id"
                @click="router.push({ name: 'productos', query: { edit: p.codigo } })"
                style="padding: 12px 0; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; justify-content: space-between; align-items: center"
              >
                <div>
                  <div style="display: flex; align-items: center; gap: 6px">
                    <Star v-if="p.favorito" :size="14" fill="var(--yellow)" stroke="var(--yellow-ink)" />
                    <span style="font-size: 14px; font-weight: 500">{{ p.nombre }}</span>
                  </div>
                  <div style="font-size: 12px; color: var(--ink-muted)">
                    {{ p.codigo }} · limitado por: {{ p.insumoLimitante }}
                  </div>
                </div>
                <div style="text-align: right">
                  <span
                    :class="[
                      'badge',
                      p.capacidad === 0 ? 'coral' : p.capacidad <= 5 ? 'yellow' : 'default'
                    ]"
                  >
                    Capacidad: {{ p.capacidad }} {{ p.capacidad === 1 ? 'unidad' : 'unidades' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel Insumos a reponer (Top 5) -->
          <div class="card" style="padding: 0">
            <div class="card-head" style="padding: 18px 20px 14px; margin: 0">
              <h3>Insumos a reponer</h3>
              <button class="btn btn-ghost btn-sm" @click="router.push({ name: 'insumos' })">
                Ver inventario <ArrowRight :size="14" :stroke-width="2" />
              </button>
            </div>
            <div v-if="topInsumosAReponer.length === 0" style="padding: 20px; color: var(--ink-muted); font-size: 13px; text-align: center">
              Todos los insumos están en nivel óptimo
            </div>
            <div v-else style="padding: 0 20px 20px">
              <div
                v-for="i in topInsumosAReponer"
                :key="i.id"
                @click="router.push({ name: 'insumos', query: { edit: i.codigo } })"
                style="padding: 12px 0; border-bottom: 1px solid var(--border); cursor: pointer"
              >
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px">
                  <div>
                    <div style="font-size: 14px; font-weight: 500">{{ i.nombre }}</div>
                    <div style="font-size: 12px; color: var(--ink-muted)">{{ i.codigo }}</div>
                  </div>
                  <div style="font-size: 13px; font-variant-numeric: tabular-nums; text-align: right">
                    <div style="font-weight: 500">{{ i.stock }} {{ i.unidad }}</div>
                    <div style="font-size: 12px; color: var(--ink-muted)">min {{ i.stockMinimo }}</div>
                  </div>
                </div>
                <div :class="['stock-bar', Number(i.stock) < Number(i.stockMinimo) * 0.5 ? 'low' : 'warn']">
                  <div :style="{ width: Math.min(100, (Number(i.stock) / Number(i.stockMinimo)) * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
