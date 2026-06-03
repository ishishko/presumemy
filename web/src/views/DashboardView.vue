<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowDown, ArrowRight } from '@lucide/vue'
import { getDashboardStats } from '@/services/dashboard'
import type { DashboardStats } from '@/types'

const loading = ref(true)
const stats = ref<DashboardStats | null>(null)
const error = ref('')

function money(v: number): string {
  return `$ ${v.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function moneyShort(v: number): string {
  if (v >= 1000) {
    return `$ ${(v / 1000).toFixed(1)}k`
  }
  return `$ ${v}`
}

const statusTones: Record<string, { tone: string; label: string }> = {
  borrador: { tone: 'default', label: 'Borrador' },
  enviado: { tone: 'violet', label: 'Enviado' },
  en_curso: { tone: 'teal', label: 'En curso' },
  cerrado: { tone: 'mint', label: 'Cerrado' },
  facturado: { tone: 'lavender', label: 'Facturado' },
  cancelado: { tone: 'coral', label: 'Cancelado' },
}

const chartData = [3200, 4100, 2900, 5400, 4800, 6200, 5800, 7100]
const chartMax = Math.max(...chartData)

onMounted(async () => {
  try {
    const res = await getDashboardStats()
    stats.value = res.data
  } catch (e: any) {
    error.value = e.message || 'Error al cargar datos'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="content">
    <div v-if="loading" class="card">
      <p>Cargando dashboard...</p>
    </div>

    <div v-else-if="error" class="card">
      <p class="field err">{{ error }}</p>
    </div>

    <template v-else-if="stats">
      <div class="grid-3" style="margin-bottom: 16px">
        <div class="card">
          <div class="eyebrow">Ingresos · este mes</div>
          <div class="kpi" style="margin-top: 6px">
            <div class="value">{{ money(stats.kpis.ingresosMes) }}</div>
          </div>
        </div>
        <div class="card highlight">
          <div class="eyebrow">Por cobrar</div>
          <div class="kpi" style="margin-top: 6px">
            <div class="value" style="color: var(--violet-700)">{{ money(stats.kpis.porCobrar) }}</div>
            <div class="delta" style="color: var(--violet-700); opacity: 0.85">
              {{ stats.statsPorEstado.filter(s => ['enviado', 'en_curso'].includes(s.estado)).length }} presupuestos pendientes
            </div>
          </div>
        </div>
        <div class="card">
          <div class="eyebrow">Insumos bajos</div>
          <div class="kpi" style="margin-top: 6px">
            <div class="value">{{ stats.kpis.insumosBajosCount }}</div>
            <div class="delta down">
              <ArrowDown :size="12" :stroke-width="2" />
              Revisar inventario
            </div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card" style="padding: 0">
          <div class="card-head" style="padding: 18px 20px 14px; margin: 0">
            <h3>Presupuestos recientes</h3>
            <button class="btn btn-ghost btn-sm">
              Ver todos <ArrowRight :size="14" :stroke-width="2" />
            </button>
          </div>
          <div v-if="stats.presupuestosRecientes.length === 0" style="padding: 20px; color: var(--ink-muted); font-size: 13px; text-align: center">
            Sin presupuestos aun
          </div>
          <table v-else class="data-table">
            <tbody>
              <tr v-for="p in stats.presupuestosRecientes" :key="p.folio">
                <td style="width: 80; color: var(--ink-muted)">{{ p.folio }}</td>
                <td>
                  <div style="font-weight: 500">{{ p.cliente?.nombre || 'Sin cliente' }}</div>
                  <div style="font-size: 12px; color: var(--ink-muted); margin-top: 2px">
                    {{ p.tematica || 'Sin tematica' }}
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

        <div class="card" style="padding: 0">
          <div class="card-head" style="padding: 18px 20px 14px; margin: 0">
            <h3>Insumos bajos</h3>
            <button class="btn btn-ghost btn-sm">
              Ver inventario <ArrowRight :size="14" :stroke-width="2" />
            </button>
          </div>
          <div v-if="stats.insumosBajos.length === 0" style="padding: 20px; color: var(--ink-muted); font-size: 13px; text-align: center">
            Todos los insumos estan bien
          </div>
          <div v-else style="padding: 0 20px 20px">
            <div
              v-for="i in stats.insumosBajos"
              :key="i.id"
              style="padding: 12px 0; border-bottom: 1px solid var(--border)"
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
              <div :class="['stock-bar', i.stock < i.stockMinimo * 0.5 ? 'low' : 'warn']">
                <div :style="{ width: Math.min(100, (i.stock / i.stockMinimo) * 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 16px">
        <div class="card-head">
          <h3>Ingresos por semana · ultimas 8</h3>
          <span class="badge violet">Mayo 2026</span>
        </div>
        <div style="display: flex; align-items: flex-end; gap: 14px; height: 160px; padding: 8px 4px 0">
          <div
            v-for="(v, i) in chartData"
            :key="i"
            style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px"
          >
            <div style="font-size: 11px; color: var(--ink-muted); font-variant-numeric: tabular-nums">
              {{ moneyShort(v) }}
            </div>
            <div
              :style="{
                width: '100%',
                height: (v / chartMax) * 140 + 'px',
                borderRadius: '6px 6px 0 0',
                background: i === chartData.length - 1 ? 'var(--violet-700)' : 'var(--lavender)',
              }"
            />
            <div style="font-size: 11px; color: var(--ink-muted)">S{{ i + 1 }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
