<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Pencil, Trash2 } from '@lucide/vue'
import { get, del } from '@/services/api'
import { createTrigger } from '@/composables/useCreateTrigger'
import InsumoDetalle from '@/components/overlays/InsumoDetalle.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import type { Insumo, CategoriaInsumo, PaginationResult } from '@/types'

const insumos = ref<Insumo[]>([])
const categorias = ref<CategoriaInsumo[]>([])
const loading = ref(true)
const error = ref('')

const stateFilter = ref('todos')
const catFilter = ref('todas')

const showOverlay = ref(false)
const editingInsumo = ref<Insumo | null>(null)
const showConfirmDelete = ref(false)
const deletingInsumo = ref<Insumo | null>(null)

const { toast } = useToast()

type Nivel = 'critico' | 'bajo' | 'ok'

function getNivel(i: Insumo): Nivel {
  const stock = Number(i.stock)
  const min = Number(i.stockMinimo)
  if (stock < min * 0.5) return 'critico'
  if (stock < min) return 'bajo'
  return 'ok'
}

const counts = computed(() => {
  const c = { critico: 0, bajo: 0, ok: 0 }
  insumos.value.forEach((i) => { c[getNivel(i)]++ })
  return c
})

const filtered = computed(() => {
  return insumos.value.filter((i) => {
    if (stateFilter.value !== 'todos' && getNivel(i) !== stateFilter.value) return false
    if (catFilter.value !== 'todas' && i.categoria?.nombre !== catFilter.value) return false
    return true
  })
})

function money(v: number): string {
  return `$ ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const stateChips = computed(() => [
  { id: 'todos', label: 'Todos', count: insumos.value.length },
  { id: 'critico', label: 'Crítico', count: counts.value.critico, dot: '#EA5F3C' },
  { id: 'bajo', label: 'Bajo', count: counts.value.bajo, dot: '#F8D132' },
  { id: 'ok', label: 'OK', count: counts.value.ok, dot: '#75CCCE' },
])

const nivelMeta: Record<Nivel, { label: string; color: string; bg: string; barClass: string }> = {
  critico: { label: 'Crítico', color: '#EA5F3C', bg: 'var(--coral-50)', barClass: 'low' },
  bajo: { label: 'Bajo', color: '#7A5D00', bg: 'var(--yellow)', barClass: 'warn' },
  ok: { label: 'OK', color: '#2E6F70', bg: 'var(--teal-100)', barClass: 'ok' },
}

async function loadInsumos() {
  try {
    const [insumosRes, catsRes] = await Promise.all([
      get<PaginationResult<Insumo>>('/insumos', { page: 1, limit: 100 }),
      get<{ data: CategoriaInsumo[] }>('/insumos/categorias'),
    ])
    insumos.value = insumosRes.data
    categorias.value = catsRes.data
  } catch (e: any) {
    error.value = e.message || 'Error al cargar insumos'
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  editingInsumo.value = null
  showOverlay.value = true
}

function handleEdit(i: Insumo) {
  editingInsumo.value = i
  showOverlay.value = true
}

function handleSaved() {
  loadInsumos()
}

function handleDeleteClick(i: Insumo) {
  deletingInsumo.value = i
  showConfirmDelete.value = true
}

async function handleDeleteConfirm() {
  if (!deletingInsumo.value) return
  const i = deletingInsumo.value
  try {
    await del('/insumos', i.id)
    toast('Insumo eliminado', 'info')
    insumos.value = insumos.value.filter(x => x.id !== i.id)
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
  deletingInsumo.value = null
}

function proveedorPrincipal(i: Insumo): string {
  const principal = i.proveedores?.find((p) => p.esPrincipal)
  return principal?.proveedor?.nombre || ''
}

onMounted(loadInsumos)

watch(createTrigger, (val) => {
  if (val === 'insumos') {
    handleCreate()
    createTrigger.value = null
  }
})
</script>

<template>
  <div class="content">
    <div v-if="loading" class="card"><p>Cargando insumos...</p></div>
    <div v-else-if="error" class="card"><p class="err">{{ error }}</p></div>

    <template v-else>
      <div class="insumos-filter-row">
        <button
          v-for="s in stateChips"
          :key="s.id"
          :class="['insumos-state-pill', stateFilter === s.id && 'active']"
          @click="stateFilter = s.id"
        >
          <span v-if="s.dot" class="d" :style="{ background: s.dot }" />
          {{ s.label }}
          <span class="k">{{ s.count }}</span>
        </button>
      </div>

      <div class="insumos-cat-row">
        <button
          :class="['insumos-cat-pill', catFilter === 'todas' && 'active']"
          @click="catFilter = 'todas'"
        >Todas</button>
        <button
          v-for="c in categorias"
          :key="c.id"
          :class="['insumos-cat-pill', catFilter === c.nombre && 'active']"
          @click="catFilter = c.nombre"
        >{{ c.nombre }}</button>
      </div>

      <div class="table-wrap">
        <table class="data-table insumos-table">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Categoría</th>
              <th class="num">Stock</th>
              <th class="num">Mínimo</th>
              <th class="num">Costo unitario</th>
              <th>Proveedor principal</th>
              <th style="width: 160px">Nivel</th>
              <th>Estado</th>
              <th style="width: 80px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in filtered" :key="i.id">
              <td style="font-weight: 500">
                <div style="display: flex; flex-direction: column; gap: 2px">
                  <span>{{ i.nombre }}</span>
                  <span style="font-size: 11px; color: var(--ink-muted); font-family: var(--font-mono)">{{ i.codigo }}</span>
                </div>
              </td>
              <td style="color: var(--ink-muted)">{{ i.categoria?.nombre }}</td>
              <td class="num" style="font-weight: 500">
                {{ i.stock }} <span style="color: var(--ink-muted); font-size: 12px; font-weight: 400">{{ i.unidad }}</span>
              </td>
              <td class="num" style="color: var(--ink-muted)">
                {{ i.stockMinimo }} <span style="font-size: 12px">{{ i.unidad }}</span>
              </td>
              <td class="num" style="font-variant-numeric: tabular-nums">
                {{ i.costoUnitario ? money(i.costoUnitario) : '—' }}
              </td>
              <td style="color: var(--ink-muted)">
                {{ proveedorPrincipal(i) || '—' }}
              </td>
              <td>
                <div :class="['stock-bar', nivelMeta[getNivel(i)].barClass]">
                  <div :style="{ width: Math.min(100, (Number(i.stock) / Math.max(Number(i.stockMinimo), 1)) * 100) + '%' }"></div>
                </div>
              </td>
              <td>
                <span
                  class="insumos-state-badge"
                  :style="{ background: nivelMeta[getNivel(i)].bg, color: nivelMeta[getNivel(i)].color }"
                >
                  <span class="d" /> {{ nivelMeta[getNivel(i)].label }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="row-action-btn" @click="handleEdit(i)" title="Editar">
                    <Pencil :size="14" />
                  </button>
                  <button class="row-action-btn row-action-danger" @click="handleDeleteClick(i)" title="Eliminar">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="9" style="text-align: center; color: var(--ink-muted); padding: 24px 0">
                Sin resultados con los filtros actuales.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>

  <InsumoDetalle
    :open="showOverlay"
    :insumo="editingInsumo"
    @close="showOverlay = false"
    @saved="handleSaved"
  />

  <ConfirmDialog
    :open="showConfirmDelete"
    title="Eliminar insumo"
    :message="`Vas a eliminar ${deletingInsumo?.codigo} · ${deletingInsumo?.nombre}. Esta acción no se puede deshacer.`"
    confirm-label="Eliminar"
    variant="danger"
    @confirm="handleDeleteConfirm"
    @cancel="showConfirmDelete = false; deletingInsumo = null"
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
