<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ArrowLeft, Check, Trash2, X, Plus, Lock } from '@lucide/vue'
import { get, post, put, del } from '@/services/api'
import { useToast } from '@/composables/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import type { Insumo, CategoriaInsumo, Proveedor } from '@/types'

const props = defineProps<{
  open: boolean
  insumo?: Insumo | null
}>()

const emit = defineEmits<{
  close: []
  saved: [insumo: Insumo]
  deleted: []
  'update:header': [{ mode: 'editor'; title: string; onSave: () => void; onClose: () => void } | { mode: 'normal' }]
}>()

const { toast } = useToast()

const isEdit = computed(() => !!props.insumo)

const categorias = ref<CategoriaInsumo[]>([])
const proveedoresList = ref<Proveedor[]>([])

const nombre = ref('')
const categoriaId = ref(0)
const unidad = ref('')
const stockActual = ref(0)
const stockMinimo = ref(0)
const activo = ref(true)
const costoPaquete = ref(0)
const cantidadPack = ref(1)
const notas = ref('')

const proveedores = ref<Array<{ proveedorId: number; precio: number; esPrincipal: boolean }>>([])

const showConfirmDelete = ref(false)
const showConfirmExit = ref(false)
const errors = ref<Record<string, string>>({})

const nivel = computed(() => {
  const s = parseFloat(String(stockActual.value)) || 0
  const m = parseFloat(String(stockMinimo.value)) || 0
  if (m <= 0) return s > 0 ? 'ok' : 'critico'
  if (s < m * 0.5) return 'critico'
  if (s < m) return 'bajo'
  return 'ok'
})

const nivelMeta: Record<string, { label: string; color: string; bg: string }> = {
  critico: { label: 'Crítico', color: '#EA5F3C', bg: '#FCEAE4' },
  bajo: { label: 'Bajo', color: '#8A6A00', bg: '#FFF6D6' },
  ok: { label: 'OK', color: '#1F5A3E', bg: '#D0EADD' },
}

const fillPct = computed(() => {
  const s = parseFloat(String(stockActual.value)) || 0
  const m = parseFloat(String(stockMinimo.value)) || 0
  if (m <= 0) return s > 0 ? 100 : 0
  return Math.max(2, Math.min(100, (s / (m * 1.5)) * 100))
})

const costoUnitario = computed(() => {
  const c = parseFloat(String(costoPaquete.value)) || 0
  const q = parseFloat(String(cantidadPack.value)) || 0
  return q > 0 ? c / q : 0
})

const dirty = computed(() => {
  if (!props.insumo) return true
  const i = props.insumo
  return (
    nombre.value !== i.nombre ||
    categoriaId.value !== i.categoriaId ||
    unidad.value !== i.unidad ||
    Number(stockActual.value) !== Number(i.stock) ||
    Number(stockMinimo.value) !== Number(i.stockMinimo) ||
    activo.value !== i.activo ||
    Number(costoPaquete.value) !== Number(i.costoPaquete) ||
    Number(cantidadPack.value) !== Number(i.cantidadPack) ||
    notas.value !== (i.notas || '') ||
    JSON.stringify(proveedores.value) !== JSON.stringify((i.proveedores || []).map(p => ({
      proveedorId: p.proveedorId,
      precio: p.precio,
      esPrincipal: p.esPrincipal,
    })))
  )
})

function money(n: number): string {
  return `$ ${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function reset() {
  nombre.value = ''
  categoriaId.value = 0
  unidad.value = ''
  stockActual.value = 0
  stockMinimo.value = 0
  activo.value = true
  costoPaquete.value = 0
  cantidadPack.value = 1
  notas.value = ''
  proveedores.value = []
  errors.value = {}
}

function loadInsumo() {
  reset()
  if (props.insumo) {
    const i = props.insumo
    nombre.value = i.nombre
    categoriaId.value = i.categoriaId
    unidad.value = i.unidad
    stockActual.value = Number(i.stock)
    stockMinimo.value = Number(i.stockMinimo)
    activo.value = i.activo
    costoPaquete.value = Number(i.costoPaquete)
    cantidadPack.value = Number(i.cantidadPack)
    notas.value = i.notas || ''
    proveedores.value = (i.proveedores || []).map(p => ({
      proveedorId: p.proveedorId,
      precio: p.precio,
      esPrincipal: p.esPrincipal,
    }))
  }
  if (proveedores.value.length === 0) {
    proveedores.value.push({ proveedorId: 0, precio: 0, esPrincipal: true })
  }
}

function addProveedor() {
  if (proveedores.value.length >= 3) return
  proveedores.value.push({ proveedorId: 0, precio: 0, esPrincipal: false })
}

function removeProveedor(idx: number) {
  proveedores.value.splice(idx, 1)
  if (proveedores.value.length === 0) {
    proveedores.value.push({ proveedorId: 0, precio: 0, esPrincipal: true })
  }
  if (!proveedores.value.some(p => p.esPrincipal)) {
    proveedores.value[0].esPrincipal = true
  }
}

function setPrincipal(idx: number) {
  proveedores.value.forEach((p, i) => p.esPrincipal = i === idx)
}

async function handleSave() {
  const payload: any = {
    nombre: nombre.value,
    categoriaId: categoriaId.value,
    unidad: unidad.value,
    stock: parseFloat(String(stockActual.value)) || 0,
    stockMinimo: parseFloat(String(stockMinimo.value)) || 0,
    costoPaquete: parseFloat(String(costoPaquete.value)) || 0,
    cantidadPack: parseFloat(String(cantidadPack.value)) || 1,
    notas: notas.value || undefined,
    proveedores: proveedores.value
      .filter((p) => p.proveedorId > 0)
      .map((p) => ({
        proveedorId: p.proveedorId,
        precio: parseFloat(String(p.precio)) || 0,
        esPrincipal: p.esPrincipal,
      })),
  }

  try {
    let res: Insumo
    if (isEdit.value && props.insumo) {
      res = await put<Insumo>('/insumos', props.insumo.id, payload)
      toast('Insumo actualizado')
    } else {
      res = await post<Insumo>('/insumos', payload)
      toast('Insumo creado')
    }
    emit('saved', res)
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al guardar', 'error')
  }
}

async function handleDelete() {
  if (!props.insumo) return
  try {
    await del('/insumos', props.insumo.id)
    toast('Insumo eliminado', 'info')
    emit('deleted')
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
}

import { editorDirty } from '@/composables/useEditorMode'

function openOverlay() {
  emit('update:header', {
    mode: 'editor',
    title: isEdit.value ? (props.insumo?.codigo || '') : 'Nuevo',
    onSave: handleSave,
    onClose: handleClose,
  })
}

function closeOverlay() {
  emit('update:header', { mode: 'normal' })
  emit('close')
}

function handleClose() {
  closeOverlay()
}

function handleBack() {
  if (dirty.value) {
    showConfirmExit.value = true
  } else {
    handleClose()
  }
}

watch(dirty, (val) => {
  editorDirty.value = val
})

watch(
  [() => props.open, () => props.insumo],
  ([open]) => {
    if (open) {
      loadInsumo()
      openOverlay()
      editorDirty.value = dirty.value
    } else {
      closeOverlay()
      editorDirty.value = false
    }
  }
)

watch(() => props.open, async (open) => {
  if (open && (categorias.value.length === 0 || proveedoresList.value.length === 0)) {
    try {
      const [catsRes, provsRes] = await Promise.all([
        get<{ data: CategoriaInsumo[] }>('/insumos/categorias'),
        get<{ data: Proveedor[] }>('/insumos/proveedores'),
      ])
      categorias.value = catsRes.data
      proveedoresList.value = provsRes.data
    } catch (e: any) {
      toast('Error al cargar datos', 'error')
    }
  }
})

onMounted(async () => {
  if (props.open) {
    if (categorias.value.length === 0 || proveedoresList.value.length === 0) {
      try {
        const [catsRes, provsRes] = await Promise.all([
          get<{ data: CategoriaInsumo[] }>('/insumos/categorias'),
          get<{ data: Proveedor[] }>('/insumos/proveedores'),
        ])
        categorias.value = catsRes.data
        proveedoresList.value = provsRes.data
      } catch (e: any) {
        toast('Error al cargar datos', 'error')
      }
    }
    loadInsumo()
    openOverlay()
    editorDirty.value = dirty.value
  }
})

defineExpose({ loadInsumo })
</script>

<template>
    <Transition name="overlay">
      <div v-if="open" class="id-overlay">
        <div class="id-body">
          <div class="id-top">
            <section class="id-card">
              <div class="id-card-head">
                <h4>Identidad &amp; stock</h4>
                <span v-if="isEdit" class="id-code-badge" title="Código autogenerado">
                  <Lock :size="10" /> {{ insumo!.codigo }}
                </span>
              </div>

              <div class="id-field">
                <label>Nombre</label>
                <input
                  class="id-inline-name"
                  v-model="nombre"
                  placeholder="Nombre del insumo"
                />
              </div>

              <div class="id-grid-2">
                <div class="id-field">
                  <label>Categoría</label>
                  <select class="select" v-model.number="categoriaId">
                    <option :value="0" disabled>Seleccionar</option>
                    <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                  </select>
                </div>
                <div class="id-field">
                  <label>Unidad de medida</label>
                  <input class="input" v-model="unidad" placeholder="Ej. pliego, m, rollo" />
                </div>
              </div>

              <div class="id-grid-2">
                <div class="id-field">
                  <label>Stock actual</label>
                  <div class="id-num-with-unit">
                    <input class="input" type="number" min="0" step="1" v-model.number="stockActual" />
                    <span class="id-unit-pill">{{ unidad || 'u' }}</span>
                  </div>
                </div>
                <div class="id-field">
                  <label>Stock mínimo</label>
                  <div class="id-num-with-unit">
                    <input class="input" type="number" min="0" step="1" v-model.number="stockMinimo" />
                    <span class="id-unit-pill">{{ unidad || 'u' }}</span>
                  </div>
                </div>
              </div>

              <div class="id-toggle-row">
                <div class="lbl">
                  <span class="t">Insumo activo</span>
                  <span class="h">Visible en autocompletados y reportes.</span>
                </div>
                <div
                  role="switch"
                  :aria-checked="activo"
                  tabindex="0"
                  :class="['id-switch', { on: activo }]"
                  @click="activo = !activo"
                />
              </div>

              <div class="id-level-block">
                <div class="row">
                  <span class="lbl">Nivel</span>
                  <span
                    class="id-level-badge"
                    :style="{ background: nivelMeta[nivel].bg, color: nivelMeta[nivel].color }"
                  >
                    <span class="dot" /> {{ nivelMeta[nivel].label }}
                  </span>
                </div>
                <div class="id-level-bar">
                  <div
                    class="fill"
                    :style="{ width: fillPct + '%', background: nivelMeta[nivel].color }"
                  />
                </div>
                <div class="id-level-stats">
                  <span>
                    <span class="strong">{{ stockActual || 0 }}</span> de mínimo <span class="strong">{{ stockMinimo || 0 }}</span> {{ unidad }}
                  </span>
                  <span>
                    {{ stockMinimo > 0 ? Math.round((stockActual / stockMinimo) * 100) + '% del mínimo' : 'sin mínimo configurado' }}
                  </span>
                </div>
              </div>
            </section>

            <section class="id-card">
              <div class="id-card-head">
                <h4>Compra &amp; costos</h4>
              </div>

              <div class="id-grid-2">
                <div class="id-field">
                  <label>Costo del paquete</label>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    step="0.01"
                    v-model.number="costoPaquete"
                    style="text-align: right; font-variant-numeric: tabular-nums"
                  />
                </div>
                <div class="id-field">
                  <label>Cantidad por pack</label>
                  <div class="id-num-with-unit">
                    <input
                      class="input"
                      type="number"
                      min="0"
                      step="0.01"
                      v-model.number="cantidadPack"
                      style="text-align: right; font-variant-numeric: tabular-nums"
                    />
                    <span class="id-unit-pill">{{ unidad || 'u' }}</span>
                  </div>
                </div>
              </div>

              <div class="id-cost-row grand">
                <span class="id-cost-label">Costo unitario</span>
                <input
                  class="id-cost-input readonly"
                  :value="money(costoUnitario)"
                  readonly
                  tabindex="-1"
                />
              </div>

              <div class="id-cost-row">
                <span class="id-cost-label">Costo de referencia / unidad</span>
                <span class="id-cost-fecha" style="color: var(--ink); font-weight: 500">
                  {{ money(costoUnitario) }} <span style="color: var(--ink-muted); font-weight: 400">/ {{ unidad }}</span>
                </span>
              </div>
            </section>
          </div>

          <section class="id-prov-card">
            <div class="head">
              <h4>Proveedores</h4>
              <span class="hint">Hasta 3 · marcá uno como principal</span>
            </div>

            <div class="id-prov-table">
              <table>
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th class="num">Precio referencia</th>
                    <th class="center">Principal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, idx) in proveedores" :key="idx">
                    <td>
                      <select
                        class="prov-input"
                        v-model.number="p.proveedorId"
                      >
                        <option :value="0">Seleccionar</option>
                        <option v-for="pr in proveedoresList" :key="pr.id" :value="pr.id">{{ pr.nombre }}</option>
                      </select>
                    </td>
                    <td>
                      <input
                        class="prov-input num"
                        type="number"
                        min="0"
                        step="0.01"
                        v-model.number="p.precio"
                      />
                    </td>
                    <td class="center">
                      <button
                        type="button"
                        :class="['id-radio', { checked: p.esPrincipal }]"
                        @click="setPrincipal(idx)"
                        :title="p.esPrincipal ? 'Proveedor principal' : 'Marcar como principal'"
                      />
                    </td>
                    <td>
                      <button
                        class="id-prov-del"
                        @click="removeProveedor(idx)"
                        :disabled="proveedores.length <= 1"
                        title="Eliminar proveedor"
                      >
                        <X :size="14" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              class="id-prov-add"
              @click="addProveedor"
              :disabled="proveedores.length >= 3"
            >
              <Plus :size="14" /> Agregar proveedor
            </button>
          </section>

          <section class="id-prov-card id-notes">
            <div class="head">
              <h4>Notas</h4>
              <span class="hint">Información interna · solo visible para tu equipo</span>
            </div>
            <textarea
              class="textarea"
              v-model="notas"
              placeholder="Anotá variaciones de proveedor, tiempos de entrega, observaciones de calidad"
              rows="3"
            />
          </section>
        </div>

        <div class="id-foot">
          <button class="id-back-btn" @click="handleBack">
            <ArrowLeft :size="16" /> Volver a insumos
          </button>
          <div class="spacer" />
          <button
            v-if="isEdit"
            class="btn btn-danger"
            @click="showConfirmDelete = true"
          >
            <Trash2 :size="16" /> Eliminar
          </button>
          <button
            class="btn btn-primary"
            @click="handleSave"
            :disabled="!dirty"
            :style="{ opacity: dirty ? 1 : 0.5, pointerEvents: dirty ? 'auto' : 'none' }"
          >
            <Check :size="16" /> {{ isEdit ? 'Guardar cambios' : 'Crear insumo' }}
          </button>
        </div>

        <ConfirmDialog
          :open="showConfirmExit"
          title="¿Salir sin guardar?"
          :message="`Tenés cambios pendientes en ${nombre}. Si salís ahora, vas a perderlos.`"
          confirm-label="Salir sin guardar"
          cancel-label="Seguir editando"
          variant="danger"
          @confirm="emit('close'); showConfirmExit = false"
          @cancel="showConfirmExit = false"
        />

        <ConfirmDialog
          :open="showConfirmDelete"
          title="Eliminar insumo"
          :message="`Vas a eliminar ${insumo?.codigo} · ${nombre}. Esta acción no se puede deshacer.`"
          confirm-label="Eliminar"
          variant="danger"
          @confirm="handleDelete"
          @cancel="showConfirmDelete = false"
        />
      </div>
    </Transition>
</template>

<style scoped>
.id-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--page-bg);
  display: grid;
  grid-template-rows: 1fr auto;
  overflow: hidden;
}

.id-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 28px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.id-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.id-title .eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.id-title .eyebrow .code {
  color: var(--violet-700);
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono);
}

.id-title h2 {
  font-size: 22px;
  line-height: 1.1;
  margin: 0;
}

.dirty-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 6px 12px;
  background: var(--yellow);
  color: var(--yellow-ink);
  border-radius: 999px;
}

.dirty-chip .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--yellow-ink);
}

.id-body {
  overflow-y: auto;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.id-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.id-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px;
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.id-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.id-card-head h4 {
  font-size: 11px;
  color: var(--ink-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.id-code-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding: 3px 10px;
  background: var(--violet-100);
  color: var(--violet-700);
  border-radius: 999px;
}

.id-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.id-field > label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
}

.id-inline-name {
  font-family: var(--font-sans);
  font-size: 22px;
  font-weight: 500;
  color: var(--violet-700);
  letter-spacing: -0.015em;
  background: transparent;
  border: 0;
  padding: 4px 6px;
  margin: -4px -6px;
  border-radius: 6px;
  transition: background 120ms ease, box-shadow 120ms ease;
  width: 100%;
}

.id-inline-name:hover { background: var(--violet-50); }
.id-inline-name:focus {
  outline: none;
  background: var(--surface);
  box-shadow: var(--focus-ring);
}

.id-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.id-num-with-unit {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.id-num-with-unit .input { flex: 1; text-align: right; font-variant-numeric: tabular-nums; }

.id-unit-pill {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  color: var(--ink-muted);
  background: var(--page-bg);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  min-width: 64px;
  justify-content: center;
  white-space: nowrap;
}

.id-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  gap: 12px;
  border-top: 1px solid var(--border);
}

.id-toggle-row .lbl { display: flex; flex-direction: column; gap: 2px; }
.id-toggle-row .lbl .t { font-size: 13px; font-weight: 500; color: var(--ink); }
.id-toggle-row .lbl .h { font-size: 12px; color: var(--ink-muted); }

.id-switch {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: var(--border-strong);
  cursor: pointer;
  transition: background 120ms ease;
  flex-shrink: 0;
}

.id-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: var(--surface);
  border-radius: 50%;
  transition: transform 140ms cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
}

.id-switch.on { background: var(--teal-500); }
.id-switch.on::after { transform: translateX(16px); }

.id-level-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.id-level-block .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.id-level-block .lbl {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  font-weight: 500;
}

.id-level-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 999px;
}

.id-level-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.id-level-bar {
  height: 8px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.id-level-bar > .fill {
  height: 100%;
  border-radius: 999px;
  transition: width 220ms cubic-bezier(0.2, 0.8, 0.2, 1), background 160ms ease;
}

.id-level-stats {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  color: var(--ink-muted);
}

.id-level-stats .strong { color: var(--ink); font-weight: 500; font-variant-numeric: tabular-nums; }

.id-cost-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid var(--border);
  font-size: 13px;
}

.id-cost-row.grand {
  border-top: 1px solid var(--border-strong);
  margin-top: 6px;
  padding-top: 14px;
}

.id-cost-label {
  font-size: 12px;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.id-cost-input {
  width: 140px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  padding: 8px 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--ink);
}

.id-cost-input.readonly {
  background: var(--page-bg);
  color: var(--ink-muted);
  border-color: var(--border);
}

.id-cost-row.grand .id-cost-input {
  font-size: 18px;
  font-weight: 500;
  color: var(--violet-700);
  width: 160px;
}

.id-cost-fecha {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}

.id-prov-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.id-prov-card .head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.id-prov-card .head h4 { font-size: 16px; color: var(--ink); font-weight: 500; }
.id-prov-card .head .hint { font-size: 12px; color: var(--ink-muted); }

.id-prov-table {
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
}

.id-prov-table table { width: 100%; border-collapse: collapse; }

.id-prov-table thead th {
  text-align: left;
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  background: var(--page-bg);
  border-bottom: 1px solid var(--border);
}

.id-prov-table thead th.num { text-align: right; }
.id-prov-table thead th.center { text-align: center; }

.id-prov-table tbody td {
  padding: 0;
  border-bottom: 1px solid var(--border);
}

.id-prov-table tbody tr:last-child td { border-bottom: 0; }
.id-prov-table tbody td.center { text-align: center; padding: 8px; }

.prov-input {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--ink);
  padding: 11px 12px;
  outline: none;
}

.prov-input.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.prov-input:focus { background: var(--teal-100); }

.id-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  background: var(--surface);
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  transition: border-color 120ms ease;
}

.id-radio:hover { border-color: var(--violet-700); }
.id-radio.checked { border-color: var(--violet-700); }

.id-radio.checked::after {
  content: "";
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--violet-700);
}

.id-prov-del {
  background: transparent;
  border: 0;
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border-radius: 6px;
  color: var(--ink-muted);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.id-prov-del:hover { color: var(--coral-500); background: var(--coral-50); }
.id-prov-del:disabled { opacity: 0.3; pointer-events: none; }

.id-prov-add {
  align-self: flex-start;
  background: transparent;
  border: 1px dashed var(--border-strong);
  color: var(--violet-700);
  font-size: 12px;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 120ms ease, border-color 120ms ease;
}

.id-prov-add:hover { background: var(--violet-50); border-color: var(--violet-700); }
.id-prov-add:disabled { opacity: 0.5; pointer-events: none; }

.id-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.id-back-btn {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  padding: 9px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: var(--violet-700);
  transition: background 120ms ease;
}

.id-back-btn:hover { background: var(--violet-50); }

/* Transitions */
.overlay-enter-active {
  animation: overlay-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.overlay-leave-active {
  animation: overlay-out 200ms cubic-bezier(0.4, 0, 1, 1) both;
}

@keyframes overlay-in {
  from { transform: translateY(6px); opacity: 0.6; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes overlay-out {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(4px); opacity: 0.6; }
}
</style>
