<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '@/services/api'
import type { Presupuesto, PaginationResult } from '@/types'

const presupuestos = ref<Presupuesto[]>([])
const loading = ref(true)
const error = ref('')

const filter = ref('todos')

const filtered = computed(() => {
  if (filter.value === 'todos') return presupuestos.value
  return presupuestos.value.filter((p) => p.estado === filter.value)
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

onMounted(async () => {
  try {
    const res = await get<PaginationResult<Presupuesto>>('/presupuestos', { page: 1, limit: 100 })
    presupuestos.value = res.data
  } catch (e: any) {
    error.value = e.message || 'Error al cargar presupuestos'
  } finally {
    loading.value = false
  }
})

function formatDate(d?: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="content">
    <div v-if="loading" class="card"><p>Cargando presupuestos...</p></div>
    <div v-else-if="error" class="card"><p class="err">{{ error }}</p></div>

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
              <th style="width: 40px"></th>
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
                <button class="icon-btn" style="width: 28px; height: 28px; border: 0; background: transparent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; color: var(--ink-muted)">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
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
    </template>
  </div>
</template>
