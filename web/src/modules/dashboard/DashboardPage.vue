<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Star } from '@lucide/vue'
import { useDashboardStore } from './store'
import { useClientesStore } from '@/modules/clientes/store'
import { useFinanzasStore } from '@/modules/finanzas/store'
import { useInsumosStore } from '@/modules/insumos/store'
import { usePresupuestosStore } from '@/modules/presupuestos/store'
import { useProductosStore } from '@/modules/productos/store'
import { formatMoney } from '@/shared/lib/format'
import { get } from '@/shared/api/client'
import BaseCard from '@/shared/ui/BaseCard.vue'
import StatusBadge from '@/shared/ui/StatusBadge.vue'
import StockBar from '@/modules/insumos/components/StockBar.vue'
import { useToast } from '@/shared/lib/useToast'
import type { ConfiguracionNegocio } from '@/types'

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
  return formatMoney(v, { decimals: 0 })
}

const statusTones: Record<string, { tone: 'ok' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }> = {
  borrador: { tone: 'neutral', label: 'Borrador' },
  enviado: { tone: 'info', label: 'Enviado' },
  en_curso: { tone: 'ok', label: 'En curso' },
  cerrado: { tone: 'ok', label: 'Cerrado' },
  facturado: { tone: 'info', label: 'Facturado' },
  cancelado: { tone: 'danger', label: 'Cancelado' },
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
  <div class="w-full">
    <div v-if="showLoading" class="border border-border rounded-lg bg-surface p-6">
      <p class="text-14 text-ink-muted">Cargando dashboard...</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Columna Izquierda: Finanzas, Entregas y Presupuestos Recientes -->
        <div class="flex flex-col gap-4">
          <!-- Card de Finanzas integrada -->
          <BaseCard class="bg-violet-50/50 border-violet-100!">
            <div class="flex gap-6 items-center">
              <div class="flex-1 flex flex-col gap-1">
                <span class="text-11 uppercase tracking-[0.06em] text-violet-700 font-medium">Ingresos · este mes</span>
                <span class="text-28 font-medium text-violet-700 font-mono tabular-nums leading-none">{{ money(store.stats!.kpis.ingresosMes) }}</span>
              </div>
              <div class="w-px self-stretch bg-violet-200/60"></div>
              <div class="flex-1 flex flex-col gap-1">
                <span class="text-11 uppercase tracking-[0.06em] text-violet-700 font-medium">Por cobrar</span>
                <span class="text-28 font-medium text-violet-700 font-mono tabular-nums leading-none">{{ money(store.stats!.kpis.porCobrar) }}</span>
                <span class="text-12 font-medium text-violet-700/80 mt-0.5">
                  {{ store.stats!.statsPorEstado.filter((s: any) => ['enviado', 'en_curso'].includes(s.estado)).reduce((sum: number, s: any) => sum + s._count.id, 0) }} presupuestos pendientes
                </span>
              </div>
            </div>
          </BaseCard>

          <!-- Panel Próximos a entregar -->
          <BaseCard :padded="false" class="flex flex-col">
            <div class="flex justify-between items-center px-5 py-4 border-b border-border">
              <h3 class="text-15 font-medium text-ink m-0">Próximos a entregar</h3>
              <button
                type="button"
                class="text-13 text-violet-700 hover:text-violet-950 font-medium flex items-center gap-1 bg-transparent border-0 cursor-pointer focus-visible:outline-none focus-visible:underline"
                @click="router.push({ name: 'presupuestos' })"
              >
                Ver todos <ArrowRight :size="14" :stroke-width="2" />
              </button>
            </div>
            
            <div v-if="store.stats!.proximosEntregar.length === 0" class="p-5 text-ink-muted text-13 text-center">
              Sin entregas próximas
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full border-collapse">
                <tbody class="divide-y divide-border">
                  <tr
                    v-for="p in store.stats!.proximosEntregar"
                    :key="p.folio"
                    class="hover:bg-page-bg/40 transition-colors duration-75 cursor-pointer select-none"
                    :class="[isAtrasado(p.fechaEntrega!) ? 'bg-coral-50/40 hover:bg-coral-50/70' : '']"
                    @click="router.push({ name: 'presupuestos', query: { edit: p.folio } })"
                  >
                    <td class="px-5 py-3.5 align-middle text-13 text-ink-muted w-[80px]">
                      {{ p.folio }}
                    </td>
                    <td class="px-5 py-3.5 align-middle text-13">
                      <div class="font-medium text-ink">{{ p.cliente?.nombre || 'Sin cliente' }}</div>
                      <div class="text-12 text-ink-muted mt-0.5">
                        {{ p.tematica || 'Sin temática' }}
                      </div>
                    </td>
                    <td class="px-5 py-3.5 align-middle text-right text-13">
                      <span v-if="isAtrasado(p.fechaEntrega!)" class="inline-flex items-center rounded-pill px-2 py-0.5 text-11 font-medium bg-coral-50 text-coral-700 mr-2 border border-coral-100">
                        Atrasado
                      </span>
                      <span
                        class="font-medium"
                        :class="[isAtrasado(p.fechaEntrega!) ? 'text-coral-600' : 'text-ink-muted']"
                      >
                        {{ formatFechaEntrega(p.fechaEntrega!) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </BaseCard>

          <!-- Panel Presupuestos recientes -->
          <BaseCard :padded="false" class="flex flex-col">
            <div class="flex justify-between items-center px-5 py-4 border-b border-border">
              <h3 class="text-15 font-medium text-ink m-0">Presupuestos recientes</h3>
              <button
                type="button"
                class="text-13 text-violet-700 hover:text-violet-950 font-medium flex items-center gap-1 bg-transparent border-0 cursor-pointer focus-visible:outline-none focus-visible:underline"
                @click="router.push({ name: 'presupuestos' })"
              >
                Ver todos <ArrowRight :size="14" :stroke-width="2" />
              </button>
            </div>
            
            <div v-if="store.stats!.presupuestosRecientes.length === 0" class="p-5 text-ink-muted text-13 text-center">
              Sin presupuestos aún
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full border-collapse">
                <tbody class="divide-y divide-border">
                  <tr
                    v-for="p in store.stats!.presupuestosRecientes"
                    :key="p.folio"
                    class="hover:bg-page-bg/40 transition-colors duration-75 cursor-pointer select-none"
                    @click="router.push({ name: 'presupuestos', query: { edit: p.folio } })"
                  >
                    <td class="px-5 py-3.5 align-middle text-13 text-ink-muted w-[80px]">
                      {{ p.folio }}
                    </td>
                    <td class="px-5 py-3.5 align-middle text-13">
                      <div class="font-medium text-ink">{{ p.cliente?.nombre || 'Sin cliente' }}</div>
                      <div class="text-12 text-ink-muted mt-0.5">
                        {{ p.tematica || 'Sin temática' }}
                      </div>
                    </td>
                    <td class="px-5 py-3.5 align-middle text-13">
                      <StatusBadge
                        :label="statusTones[p.estado]?.label || p.estado"
                        :tone="statusTones[p.estado]?.tone || 'neutral'"
                      />
                    </td>
                    <td class="px-5 py-3.5 align-middle text-13 text-ink font-medium text-right tabular-nums">
                      {{ money(p.total) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </BaseCard>
        </div>

        <!-- Columna Derecha: Capacidad de fabricación e Insumos a reponer -->
        <div class="flex flex-col gap-4">
          <!-- Panel Capacidad de fabricación -->
          <BaseCard :padded="false" class="flex flex-col">
            <div class="flex justify-between items-center px-5 py-4 border-b border-border">
              <h3 class="text-15 font-medium text-ink m-0">Capacidad de fabricación</h3>
              <button
                type="button"
                class="text-13 text-violet-700 hover:text-violet-950 font-medium flex items-center gap-1 bg-transparent border-0 cursor-pointer focus-visible:outline-none focus-visible:underline"
                @click="router.push({ name: 'productos' })"
              >
                Ver catálogo <ArrowRight :size="14" :stroke-width="2" />
              </button>
            </div>
            
            <div v-if="capacidadFabricacion.length === 0" class="p-5 text-ink-muted text-13 text-center">
              Sin productos con receta de insumos
            </div>
            <div v-else class="px-5 pb-5">
              <div
                v-for="p in capacidadFabricacion"
                :key="p.id"
                class="py-3 border-b border-border last:border-0 hover:bg-page-bg/20 transition-colors duration-75 cursor-pointer select-none flex justify-between items-center"
                @click="router.push({ name: 'productos', query: { edit: p.codigo } })"
              >
                <div>
                  <div class="flex items-center gap-1.5">
                    <Star v-if="p.favorito" :size="14" class="fill-yellow text-yellow-ink stroke-yellow" />
                    <span class="text-14 font-medium text-ink">{{ p.nombre }}</span>
                  </div>
                  <div class="text-12 text-ink-muted mt-0.5">
                    {{ p.codigo }} · limitado por: {{ p.insumoLimitante }}
                  </div>
                </div>
                <div class="text-right">
                  <StatusBadge
                    :label="`Capacidad: ${p.capacidad} ${p.capacidad === 1 ? 'unidad' : 'unidades'}`"
                    :tone="p.capacidad === 0 ? 'danger' : p.capacidad <= 5 ? 'warning' : 'neutral'"
                  />
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Panel Insumos a reponer (Top 5) -->
          <BaseCard :padded="false" class="flex flex-col">
            <div class="flex justify-between items-center px-5 py-4 border-b border-border">
              <h3 class="text-15 font-medium text-ink m-0">Insumos a reponer</h3>
              <button
                type="button"
                class="text-13 text-violet-700 hover:text-violet-950 font-medium flex items-center gap-1 bg-transparent border-0 cursor-pointer focus-visible:outline-none focus-visible:underline"
                @click="router.push({ name: 'insumos' })"
              >
                Ver inventario <ArrowRight :size="14" :stroke-width="2" />
              </button>
            </div>
            
            <div v-if="topInsumosAReponer.length === 0" class="p-5 text-ink-muted text-13 text-center">
              Todos los insumos están en nivel óptimo
            </div>
            <div v-else class="px-5 pb-5">
              <div
                v-for="i in topInsumosAReponer"
                :key="i.id"
                class="py-3 border-b border-border last:border-0 hover:bg-page-bg/20 transition-colors duration-75 cursor-pointer select-none"
                @click="router.push({ name: 'insumos', query: { edit: i.codigo } })"
              >
                <div class="flex justify-between mb-2">
                  <div>
                    <div class="text-14 font-medium text-ink">{{ i.nombre }}</div>
                    <div class="text-12 text-ink-muted">{{ i.codigo }}</div>
                  </div>
                  <div class="text-13 tabular-nums text-right">
                    <div class="font-medium text-ink">{{ i.stock }} {{ i.unidad }}</div>
                    <div class="text-12 text-ink-muted">min {{ i.stockMinimo }}</div>
                  </div>
                </div>
                <StockBar :stock="Number(i.stock)" :minimo="Number(i.stockMinimo)" />
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </template>
  </div>
</template>
