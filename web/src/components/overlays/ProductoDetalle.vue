<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ArrowLeft, Check, Trash2, X, Plus, Lock, Image } from '@lucide/vue'
import { get, post, put, del } from '@/services/api'
import { useToast } from '@/composables/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import type { Producto, CategoriaProducto, Insumo, PaginationResult } from '@/types'

const props = defineProps<{
  open: boolean
  producto?: Producto | null
}>()

const emit = defineEmits<{
  close: []
  saved: [producto: Producto]
  deleted: []
  'update:header': [{ mode: 'editor'; title: string; onSave: () => void; onClose: () => void } | { mode: 'normal' }]
}>()

const { toast } = useToast()

const isEdit = computed(() => !!props.producto)

const categorias = ref<CategoriaProducto[]>([])
const insumosList = ref<Insumo[]>([])

const nombre = ref('')
const categoriaId = ref(0)
const medida = ref('')
const descripcion = ref('')
const activo = ref(true)
const tieneBom = ref(false)
const tipoGanancia = ref<'porcentaje' | 'fijo'>('porcentaje')
const ganancia = ref(0)
const precio = ref(0)
const imagenUrl = ref('')

const bomLineas = ref<Array<{
  tipoLinea: 'insumo' | 'cameo' | 'embalaje' | 'extra'
  insumoId?: number
  descripcion: string
  cantidad: number
  costoUnitario: number
}>>([])

const showConfirmDelete = ref(false)
const showConfirmExit = ref(false)

const bomTotal = computed(() =>
  bomLineas.value.reduce((s, l) => s + l.cantidad * l.costoUnitario, 0)
)

const costoProducto = computed(() => tieneBom.value ? bomTotal.value : 0)

const precioCalculado = computed(() => {
  const v = parseFloat(String(ganancia.value)) || 0
  if (tipoGanancia.value === 'porcentaje') return costoProducto.value * (1 + v / 100)
  return costoProducto.value + v
})

const dirty = computed(() => {
  if (!props.producto) return true
  const p = props.producto
  return (
    nombre.value !== p.nombre ||
    categoriaId.value !== p.categoriaId ||
    medida.value !== (p.descripcion || '') ||
    descripcion.value !== (p.descripcion || '') ||
    activo.value !== p.activo ||
    tieneBom.value !== p.tieneBom ||
    tipoGanancia.value !== p.tipoGanancia ||
    Number(ganancia.value) !== Number(p.ganancia) ||
    Number(precio.value) !== Number(p.precio) ||
    imagenUrl.value !== (p.imagenUrl || '')
  )
})

function money(n: number): string {
  return `$ ${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function reset() {
  nombre.value = ''
  categoriaId.value = 0
  medida.value = ''
  descripcion.value = ''
  activo.value = true
  tieneBom.value = false
  tipoGanancia.value = 'porcentaje'
  ganancia.value = 0
  precio.value = 0
  imagenUrl.value = ''
  bomLineas.value = []
}

function loadProducto() {
  reset()
  if (props.producto) {
    const p = props.producto
    nombre.value = p.nombre
    categoriaId.value = p.categoriaId
    medida.value = ''
    descripcion.value = p.descripcion || ''
    activo.value = p.activo
    tieneBom.value = p.tieneBom
    tipoGanancia.value = p.tipoGanancia
    ganancia.value = p.ganancia
    precio.value = p.precio
    imagenUrl.value = p.imagenUrl || ''
    bomLineas.value = (p.bomLineas || []).map(b => ({
      tipoLinea: b.tipoLinea,
      insumoId: b.insumoId,
      descripcion: b.descripcion || '',
      cantidad: b.cantidad,
      costoUnitario: b.costoUnitario,
    }))
  }
  if (tieneBom.value && bomLineas.value.length === 0) {
    addBomLinea()
  }
}

function addBomLinea() {
  bomLineas.value.push({
    tipoLinea: 'insumo',
    descripcion: '',
    cantidad: 0,
    costoUnitario: 0,
  })
}

function removeBomLinea(idx: number) {
  bomLineas.value.splice(idx, 1)
  if (bomLineas.value.length === 0) addBomLinea()
}

function onInsumoChange(idx: number, insumoId: number) {
  const ins = insumosList.value.find(i => i.id === insumoId)
  if (ins) {
    bomLineas.value[idx].insumoId = ins.id
    bomLineas.value[idx].descripcion = ins.nombre
    bomLineas.value[idx].costoUnitario = ins.costoUnitario
  }
}

async function handleSave() {
  const payload: any = {
    nombre: nombre.value,
    categoriaId: categoriaId.value,
    descripcion: descripcion.value || undefined,
    imagenUrl: imagenUrl.value || undefined,
    tieneBom: tieneBom.value,
    tipoGanancia: tipoGanancia.value,
    ganancia: parseFloat(String(ganancia.value)) || 0,
    precio: parseFloat(String(precio.value)) || 0,
  }

  if (tieneBom.value) {
    payload.bomLineas = bomLineas.value
      .filter(l => l.descripcion && l.cantidad > 0)
      .map(l => ({
        tipoLinea: l.tipoLinea,
        insumoId: l.insumoId,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        costoUnitario: l.costoUnitario,
      }))
  }

  try {
    let res: Producto
    if (isEdit.value && props.producto) {
      res = await put<Producto>('/productos', props.producto.id, payload)
      toast('Producto actualizado')
    } else {
      res = await post<Producto>('/productos', payload)
      toast('Producto creado')
    }
    emit('saved', res)
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al guardar', 'error')
  }
}

async function handleDelete() {
  if (!props.producto) return
  try {
    await del('/productos', props.producto.id)
    toast('Producto eliminado', 'info')
    emit('deleted')
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
}

function handleBack() {
  if (dirty.value) {
    showConfirmExit.value = true
  } else {
    handleClose()
  }
}

function openOverlay() {
  emit('update:header', {
    mode: 'editor',
    title: isEdit.value ? (props.producto?.codigo || '') : 'Nuevo',
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

watch(() => props.open, (open) => {
  if (open) {
    loadProducto()
    openOverlay()
  } else {
    closeOverlay()
  }
})

watch(() => props.open, async (open) => {
  if (open && categorias.value.length === 0) {
    try {
      const [catsRes, insumosRes] = await Promise.all([
        get<{ data: CategoriaProducto[] }>('/productos/categorias'),
        get<PaginationResult<Insumo>>('/insumos', { page: 1, limit: 100 }),
      ])
      categorias.value = catsRes.data
      insumosList.value = insumosRes.data
    } catch (e: any) {
      toast('Error al cargar datos', 'error')
    }
  }
})

defineExpose({ loadProducto })
</script>

<template>
  <Transition name="overlay">
    <div v-if="open" class="pd-overlay">
        <div class="pd-body">
          <div class="pd-top">
            <section class="pd-card">
              <div class="pd-card-head">
                <h4>Fotos</h4>
              </div>

              <div class="pd-photo-main">
                <img v-if="imagenUrl" :src="imagenUrl" alt="" />
                <Image v-else :size="40" />
              </div>

              <div class="id-field">
                <label>URL de imagen</label>
                <input
                  class="input"
                  v-model="imagenUrl"
                  placeholder="https://..."
                />
              </div>
            </section>

            <section class="pd-card">
              <div class="pd-card-head">
                <h4>Identidad</h4>
                <span v-if="isEdit" class="pd-code-badge" title="Código autogenerado">
                  <Lock :size="10" /> {{ producto!.codigo }}
                </span>
              </div>

              <div class="pd-field">
                <label>Nombre</label>
                <input
                  class="pd-inline-name"
                  v-model="nombre"
                  placeholder="Nombre del producto"
                />
              </div>

              <div class="pd-id-grid">
                <div class="pd-field">
                  <label>Categoría</label>
                  <select class="select" v-model.number="categoriaId">
                    <option :value="0" disabled>Seleccionar</option>
                    <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                  </select>
                </div>
                <div class="pd-field">
                  <label>Medida</label>
                  <input class="input" v-model="medida" placeholder="Ej. 15×15 cm" />
                </div>
              </div>

              <div class="pd-field">
                <label>Descripción</label>
                <textarea
                  class="textarea"
                  v-model="descripcion"
                  placeholder="Detalles, terminaciones, materiales destacados"
                  rows="3"
                />
              </div>

              <div class="pd-toggle-row">
                <div class="lbl">
                  <span class="t">Producto activo</span>
                  <span class="h">Visible en el catálogo y en presupuestos</span>
                </div>
                <div
                  role="switch"
                  :aria-checked="activo"
                  tabindex="0"
                  :class="['pd-switch', { on: activo }]"
                  @click="activo = !activo"
                />
              </div>

              <div class="pd-toggle-row">
                <div class="lbl">
                  <span class="t">{{ tieneBom ? 'Costo por receta' : 'Costo manual' }}</span>
                  <span class="h">
                    {{ tieneBom ? 'El costo se calcula desde el BOM de insumos.' : 'Ingresá el costo directamente.' }}
                  </span>
                </div>
                <div
                  role="switch"
                  :aria-checked="tieneBom"
                  tabindex="0"
                  :class="['pd-switch', { on: tieneBom }]"
                  @click="tieneBom = !tieneBom"
                />
              </div>
            </section>

            <section class="pd-card">
              <div class="pd-card-head">
                <h4>Precios</h4>
              </div>

              <div class="pd-price-grid">
                <div class="pd-field pd-field-wide">
                  <label>Tipo de ganancia</label>
                  <div class="segmented">
                    <button
                      type="button"
                      :class="['seg-btn', { active: tipoGanancia === 'porcentaje' }]"
                      @click="tipoGanancia = 'porcentaje'"
                    >Porcentaje</button>
                    <button
                      type="button"
                      :class="['seg-btn', { active: tipoGanancia === 'fijo' }]"
                      @click="tipoGanancia = 'fijo'"
                    >Monto fijo</button>
                  </div>
                </div>
                <div class="pd-field pd-field-wide">
                  <label>{{ tipoGanancia === 'porcentaje' ? 'Margen (%)' : 'Monto sobre costo' }}</label>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    step="1"
                    v-model.number="ganancia"
                    style="font-variant-numeric: tabular-nums; text-align: right"
                  />
                </div>
              </div>

              <div v-if="tieneBom" class="pd-price-row">
                <span class="pd-price-label">Costo del producto <span style="margin-left: 6px; font-size: 10px; color: var(--ink-muted)">(desde BOM)</span></span>
                <input class="pd-money-input readonly" :value="money(costoProducto)" readonly />
              </div>

              <div class="pd-price-row">
                <span class="pd-price-label">Precio calculado</span>
                <input
                  class="pd-money-input readonly"
                  :value="tieneBom ? money(precioCalculado) : '—'"
                  readonly
                  tabindex="-1"
                />
              </div>

              <div class="pd-price-row grand">
                <span class="pd-price-label">Precio final</span>
                <input
                  class="pd-money-input"
                  type="number"
                  min="0"
                  step="1"
                  v-model.number="precio"
                  style="font-size: 18px; font-weight: 500; color: var(--violet-700); width: 150px"
                />
              </div>
            </section>
          </div>

          <section v-if="tieneBom" class="pd-bom">
            <div class="pd-bom-head">
              <h4>Receta · BOM</h4>
              <span class="text-hint" style="font-size: 12px">
                Costos aislados — editar el costo unitario acá no afecta a otros productos.
              </span>
            </div>

            <div class="pd-bom-table">
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Insumo / descripción</th>
                    <th class="num">Cantidad</th>
                    <th class="num">Costo unitario</th>
                    <th class="num">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(l, idx) in bomLineas" :key="idx">
                    <td>
                      <select class="cell-select" v-model="l.tipoLinea">
                        <option value="insumo">Insumo</option>
                        <option value="cameo">Cameo</option>
                        <option value="embalaje">Embalaje</option>
                        <option value="extra">Extra</option>
                      </select>
                    </td>
                    <td>
                      <select
                        class="cell-input"
                        :value="l.insumoId || 0"
                        @change="onInsumoChange(idx, +($event.target as HTMLSelectElement).value)"
                      >
                        <option :value="0">Texto libre</option>
                        <option v-for="ins in insumosList" :key="ins.id" :value="ins.id">{{ ins.nombre }}</option>
                      </select>
                    </td>
                    <td>
                      <input
                        class="cell-input num-input"
                        type="number"
                        min="0"
                        step="0.01"
                        v-model.number="l.cantidad"
                      />
                    </td>
                    <td>
                      <input
                        class="cell-input num-input"
                        type="number"
                        min="0"
                        step="0.5"
                        v-model.number="l.costoUnitario"
                      />
                    </td>
                    <td class="num cell-subtotal">{{ money(l.cantidad * l.costoUnitario) }}</td>
                    <td>
                      <button class="del-btn" @click="removeBomLinea(idx)" title="Eliminar línea">
                        <X :size="14" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button class="add-line-btn" @click="addBomLinea">
              <Plus :size="14" /> Agregar línea
            </button>

            <div class="pd-bom-total">
              <span class="lbl">Total BOM</span>
              <span class="val">{{ money(bomTotal) }}</span>
            </div>
          </section>
        </div>

        <div class="pd-foot">
          <button class="pd-back-btn" @click="handleBack">
            <ArrowLeft :size="16" /> Volver a productos
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
            <Check :size="16" /> {{ isEdit ? 'Guardar cambios' : 'Crear producto' }}
          </button>
        </div>

        <ConfirmDialog
          :open="showConfirmExit"
          title="¿Salir sin guardar?"
          :message="`Tenés cambios pendientes en ${nombre}. Si salís ahora, vas a perderlos.`"
          confirm-label="Salir sin guardar"
          cancel-label="Seguir editando"
          variant="danger"
          @confirm="handleClose(); showConfirmExit = false"
          @cancel="showConfirmExit = false"
        />

        <ConfirmDialog
          :open="showConfirmDelete"
          title="Eliminar producto"
          :message="`Vas a eliminar ${producto?.codigo} · ${nombre}. Esta acción no se puede deshacer.`"
          confirm-label="Eliminar"
          variant="danger"
          @confirm="handleDelete"
          @cancel="showConfirmDelete = false"
        />
      </div>
  </Transition>
</template>

<style scoped>
.pd-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--page-bg);
  display: grid;
  grid-template-rows: 1fr auto;
  overflow: hidden;
}

.pd-body {
  overflow-y: auto;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pd-top {
  display: grid;
  grid-template-columns: 320px 1fr 360px;
  gap: 20px;
  align-items: start;
}

.pd-top {
  display: grid;
  grid-template-columns: 320px 1fr 360px;
  gap: 20px;
  align-items: start;
}

.pd-top {
  display: grid;
  grid-template-columns: 320px 1fr 360px;
  gap: 20px;
  align-items: start;
}

.pd-top {
  display: grid;
  grid-template-columns: 320px 1fr 360px;
  gap: 20px;
  align-items: start;
}

.pd-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px;
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pd-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pd-card-head h4 {
  font-size: 11px;
  color: var(--ink-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.pd-photo-main {
  aspect-ratio: 4 / 3;
  width: 100%;
  background: #F0EEF4;
  border-radius: var(--r-md);
  display: grid;
  place-items: center;
  color: rgba(28, 26, 30, 0.30);
  overflow: hidden;
}

.pd-photo-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pd-code-badge {
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

.pd-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pd-field > label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
}

.pd-inline-name {
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

.pd-inline-name:hover { background: var(--violet-50); }
.pd-inline-name:focus {
  outline: none;
  background: var(--surface);
  box-shadow: var(--focus-ring);
}

.pd-id-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.pd-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  gap: 12px;
  border-top: 1px solid var(--border);
}

.pd-toggle-row .lbl { display: flex; flex-direction: column; gap: 2px; }
.pd-toggle-row .lbl .t { font-size: 13px; font-weight: 500; color: var(--ink); }
.pd-toggle-row .lbl .h { font-size: 12px; color: var(--ink-muted); }

.pd-switch {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: var(--border-strong);
  cursor: pointer;
  transition: background 120ms ease;
  flex-shrink: 0;
}

.pd-switch::after {
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

.pd-switch.on { background: var(--teal-500); }
.pd-switch.on::after { transform: translateX(16px); }

.pd-price-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pd-price-grid .pd-field-wide { grid-column: 1 / -1; }

.segmented {
  display: flex;
  gap: 2px;
  background: var(--page-bg);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 3px;
  height: 36px;
}

.seg-btn {
  flex: 1;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}

.seg-btn.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pd-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid var(--border);
  font-size: 13px;
}

.pd-price-row.grand {
  border-top: 1px solid var(--border-strong);
  margin-top: 6px;
  padding-top: 14px;
}

.pd-price-label {
  font-size: 12px;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pd-money-input {
  width: 130px;
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

.pd-money-input:focus {
  outline: none;
  border-color: var(--teal-500);
  box-shadow: var(--focus-ring);
}

.pd-money-input.readonly {
  background: var(--page-bg);
  color: var(--ink-muted);
  border-color: var(--border);
}

.pd-bom {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pd-bom .pd-bom-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pd-bom .pd-bom-head h4 { font-size: 16px; color: var(--ink); font-weight: 500; }

.pd-bom-table {
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
}

.pd-bom-table table { width: 100%; border-collapse: collapse; }

.pd-bom-table thead th {
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

.pd-bom-table thead th.num { text-align: right; }

.pd-bom-table tbody td {
  padding: 0;
  border-bottom: 1px solid var(--border);
}

.pd-bom-table tbody tr:last-child td { border-bottom: 0; }

.cell-select {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--ink);
  padding: 11px 8px;
  outline: none;
  cursor: pointer;
}

.cell-select:focus { background: var(--teal-100); }

.cell-input {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--ink);
  padding: 11px 12px;
  outline: none;
}

.cell-input:focus { background: var(--teal-100); }
.cell-input.num-input { text-align: right; font-variant-numeric: tabular-nums; }

.cell-subtotal {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  padding: 11px 12px !important;
}

.del-btn {
  background: transparent;
  border: 0;
  color: var(--ink-muted);
  cursor: pointer;
  padding: 8px;
  display: grid;
  place-items: center;
}

.del-btn:hover { color: var(--coral-500); }

.add-line-btn {
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

.add-line-btn:hover { background: var(--violet-50); border-color: var(--violet-700); }

.pd-bom-total {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 16px;
  padding-top: 8px;
}

.pd-bom-total .lbl { font-size: 12px; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.pd-bom-total .val {
  font-size: 18px;
  font-weight: 500;
  color: var(--violet-700);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.pd-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.pd-back-btn {
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

.pd-back-btn:hover { background: var(--violet-50); }

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
