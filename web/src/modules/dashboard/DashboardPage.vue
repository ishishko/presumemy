<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ArrowRight, Star } from '@lucide/vue'
import { useDashboardStore } from '@/modules/dashboard/store'
import { useToast } from '@/shared/lib/useToast'
import { useClientesStore } from '@/modules/clientes/store'
import { useFinanzasStore } from '@/modules/finanzas/store'
import { useInsumosStore } from '@/modules/insumos/store'
import { usePresupuestosStore } from '@/modules/presupuestos/store'
import { useProductosStore } from '@/modules/productos/store'
import { formatMoney } from '@/shared/lib/format'
import StatusBadge from '@/shared/ui/StatusBadge.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { useAjustesStore } from '@/modules/ajustes'

const store = useDashboardStore()
const router = useRouter()
const { toast } = useToast()

const clientesStore = useClientesStore()
const finanzasStore = useFinanzasStore()
const insumosStore = useInsumosStore()
const presupuestosStore = usePresupuestosStore()
const productosStore = useProductosStore()

const ajustesStore = useAjustesStore()
const { config } = storeToRefs(ajustesStore)

const showLoading = computed(() => !store.stats || !productosStore.hasFetched || !insumosStore.hasFetched || !config.value)

const statusTones: Record<string, { tone: 'default' | 'violet' | 'teal' | 'mint' | 'lavender' | 'coral'; label: string }> = {
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
    await Promise.all([
      ajustesStore.fetchConfig(),
      store.fetch(),
      productosStore.hasFetched ? Promise.resolve() : productosStore.fetch(),
      insumosStore.hasFetched ? Promise.resolve() : insumosStore.fetch(),
    ])

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
  <div class="p-6">
    <div v-if="showLoading" class="bg-surface border border-border rounded-lg p-5">
      <p class="text-14 text-ink-muted">Cargando dashboard...</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Columna Izquierda -->
        <div class="flex flex-col gap-4">
          <!-- Card de Finanzas -->
          <div class="bg-violet-50 border border-violet-100 rounded-lg p-5">
            <div class="flex gap-6 items-center">
              <div class="flex-1">
                <div class="text-11 uppercase tracking-0.06em font-medium text-violet-700">Ingresos · este mes</div>
                <div class="mt-1.5">
                  <div class="text-22 font-medium text-violet-700 tabular-nums">{{ formatMoney(store.stats!.kpis.ingresosMes, { decimals: 0 }) }}</div>
                </div>
              </div>
              <div class="w-px self-stretch bg-border-strong"></div>
              <div class="flex-1">
                <div class="text-11 uppercase tracking-0.06em font-medium text-violet-700">Por cobrar</div>
                <div class="mt-1.5">
                  <div class="text-22 font-medium text-violet-700 tabular-nums">{{ formatMoney(store.stats!.kpis.porCobrar, { decimals: 0 }) }}</div>
                  <div class="text-12 text-violet-700 opacity-85 tabular-nums">
                    {{ store.stats!.statsPorEstado.filter(s => ['enviado', 'en_curso'].includes(s.estado)).reduce((sum, s) => sum + s._count.id, 0) }} presupuestos pendientes
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel Próximos a entregar -->
          <div class="bg-surface border border-border rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-5 pt-4.5 pb-3.5">
              <h3 class="text-16 font-medium m-0">Próximos a entregar</h3>
              <BaseButton variant="ghost" @click="router.push({ name: 'presupuestos' })">
                Ver todos <ArrowRight :size="14" :stroke-width="2" />
              </BaseButton>
            </div>
            <div v-if="store.stats!.proximosEntregar.length === 0" class="p-5 text-13 text-ink-muted text-center">
              Sin entregas próximas
            </div>
            <table v-else class="w-full">
              <tbody>
                <tr
                  v-for="p in store.stats!.proximosEntregar"
                  :key="p.folio"
                  class="border-t border-border cursor-pointer hover:bg-page-bg transition-colors"
                  :class="isAtrasado(p.fechaEntrega!) ? 'bg-coral-50' : ''"
                  @click="router.push({ name: 'presupuestos', query: { edit: p.folio } })"
                >
                  <td class="px-4 py-3 w-20 text-13 text-ink-muted">{{ p.folio }}</td>
                  <td class="px-4 py-3">
                    <div class="font-medium text-14">{{ p.cliente?.nombre || 'Sin cliente' }}</div>
                    <div class="text-12 text-ink-muted mt-0.5">{{ p.tematica || 'Sin temática' }}</div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span v-if="isAtrasado(p.fechaEntrega!)" class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-pill text-12 font-medium bg-coral-50 text-coral-500 mr-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                      Atrasado
                    </span>
                    <span :class="isAtrasado(p.fechaEntrega!) ? 'text-coral-500 font-medium' : 'text-ink-muted font-medium'" class="text-13">
                      {{ formatFechaEntrega(p.fechaEntrega!) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Panel Presupuestos recientes -->
          <div class="bg-surface border border-border rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-5 pt-4.5 pb-3.5">
              <h3 class="text-16 font-medium m-0">Presupuestos recientes</h3>
              <BaseButton variant="ghost" @click="router.push({ name: 'presupuestos' })">
                Ver todos <ArrowRight :size="14" :stroke-width="2" />
              </BaseButton>
            </div>
            <div v-if="store.stats!.presupuestosRecientes.length === 0" class="p-5 text-13 text-ink-muted text-center">
              Sin presupuestos aún
            </div>
            <table v-else class="w-full">
              <tbody>
                <tr
                  v-for="p in store.stats!.presupuestosRecientes"
                  :key="p.folio"
                  class="border-t border-border cursor-pointer hover:bg-page-bg transition-colors"
                  @click="router.push({ name: 'presupuestos', query: { edit: p.folio } })"
                >
                  <td class="px-4 py-3 w-20 text-13 text-ink-muted">{{ p.folio }}</td>
                  <td class="px-4 py-3">
                    <div class="font-medium text-14">{{ p.cliente?.nombre || 'Sin cliente' }}</div>
                    <div class="text-12 text-ink-muted mt-0.5">{{ p.tematica || 'Sin temática' }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <StatusBadge
                      :label="statusTones[p.estado]?.label || p.estado"
                      :tone="statusTones[p.estado]?.tone || 'default'"
                      dot
                    />
                  </td>
                  <td class="px-4 py-3 text-right font-medium text-14 tabular-nums">{{ formatMoney(p.total, { decimals: 0 }) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Columna Derecha -->
        <div class="flex flex-col gap-4">
          <!-- Panel Capacidad de fabricación -->
          <div class="bg-surface border border-border rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-5 pt-4.5 pb-3.5">
              <h3 class="text-16 font-medium m-0">Capacidad de fabricación</h3>
              <BaseButton variant="ghost" @click="router.push({ name: 'productos' })">
                Ver catálogo <ArrowRight :size="14" :stroke-width="2" />
              </BaseButton>
            </div>
            <div v-if="capacidadFabricacion.length === 0" class="p-5 text-13 text-ink-muted text-center">
              Sin productos con receta de insumos
            </div>
            <div v-else class="px-5 pb-5">
              <div
                v-for="p in capacidadFabricacion"
                :key="p.id"
                class="py-3 border-b border-border cursor-pointer flex justify-between items-center hover:bg-page-bg/50 transition-colors"
                @click="router.push({ name: 'productos', query: { edit: p.codigo } })"
              >
                <div>
                  <div class="flex items-center gap-1.5">
                    <Star v-if="p.favorito" :size="14" fill="var(--color-yellow)" stroke="var(--color-yellow-ink)" />
                    <span class="text-14 font-medium">{{ p.nombre }}</span>
                  </div>
                  <div class="text-12 text-ink-muted">{{ p.codigo }} · limitado por: {{ p.insumoLimitante }}</div>
                </div>
                <div class="text-right">
                  <StatusBadge
                    :label="`Capacidad: ${p.capacidad} ${p.capacidad === 1 ? 'unidad' : 'unidades'}`"
                    :tone="p.capacidad === 0 ? 'coral' : p.capacidad <= 5 ? 'yellow' : 'default'"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Panel Insumos a reponer -->
          <div class="bg-surface border border-border rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-5 pt-4.5 pb-3.5">
              <h3 class="text-16 font-medium m-0">Insumos a reponer</h3>
              <BaseButton variant="ghost" @click="router.push({ name: 'insumos' })">
                Ver inventario <ArrowRight :size="14" :stroke-width="2" />
              </BaseButton>
            </div>
            <div v-if="topInsumosAReponer.length === 0" class="p-5 text-13 text-ink-muted text-center">
              Todos los insumos están en nivel óptimo
            </div>
            <div v-else class="px-5 pb-5">
              <div
                v-for="i in topInsumosAReponer"
                :key="i.id"
                class="py-3 border-b border-border cursor-pointer hover:bg-page-bg/50 transition-colors"
                @click="router.push({ name: 'insumos', query: { edit: i.codigo } })"
              >
                <div class="flex justify-between mb-1.5">
                  <div>
                    <div class="text-14 font-medium">{{ i.nombre }}</div>
                    <div class="text-12 text-ink-muted">{{ i.codigo }}</div>
                  </div>
                  <div class="text-13 tabular-nums text-right">
                    <div class="font-medium">{{ i.stock }} {{ i.unidad }}</div>
                    <div class="text-12 text-ink-muted">min {{ i.stockMinimo }}</div>
                  </div>
                </div>
                <div class="h-1.5 bg-page-bg rounded-pill overflow-hidden">
                  <div
                    class="h-full rounded-pill transition-all"
                    :class="Number(i.stock) < Number(i.stockMinimo) * 0.5 ? 'bg-coral-500' : 'bg-yellow'"
                    :style="{ width: Math.min(100, (Number(i.stock) / Number(i.stockMinimo)) * 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
