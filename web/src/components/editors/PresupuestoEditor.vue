<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ArrowRight, GripVertical, Plus, Trash2, FileText, Calendar } from '@lucide/vue'
import { get, post, put } from '@/services/api'
import { useToast } from '@/composables/useToast'
import { editorDirty } from '@/composables/useEditorMode'
import type { Presupuesto, Cliente, Producto, PaginationResult } from '@/types'
import { presupuestoSchema } from '@/schemas/presupuestos'

const props = defineProps<{
  open: boolean
  presupuesto?: Presupuesto | null
}>()

const emit = defineEmits<{
  close: []
  saved: [presupuesto: Presupuesto]
  'update:header': [{ mode: 'editor'; title: string; onSave: () => void; onClose: () => void } | { mode: 'normal' }]
}>()

const { toast } = useToast()

const isNew = computed(() => !props.presupuesto)
const docFolio = computed(() => props.presupuesto?.folio || 'P-...')

const clientes = ref<Cliente[]>([])
const productos = ref<Producto[]>([])

const cliente = ref('')
const clienteId = ref<number>(0)
const tematica = ref('')
const fechaFiesta = ref('')
const fechaEntrega = ref('')
const tipoEntrega = ref<'retira' | 'envio'>('retira')
const direccionEntrega = ref('')
const metodoPago = ref('')
const sena = ref('')
const notas = ref('')
const includeNotes = ref(true)

const lineas = ref<Array<{ id: number; producto: string; productoId: number; qty: string; price: string }>>([])
const activeRow = ref<number | null>(null)
const editing = ref(false)
const dragId = ref<number | null>(null)
const dragOverId = ref<number | null>(null)
const idRef = ref(1)

const mkId = () => ++idRef.value

const snapshot = ref<any>(null)
const savedAt = ref('')
const errors = ref<Record<string, string>>({})

function money(n: number): string {
  return `$ ${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function niceDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })
}

const subtotal = computed(() =>
  lineas.value.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0), 0)
)

const total = computed(() => subtotal.value)

const restoCalc = computed(() => {
  const senaVal = parseFloat(sena.value) || 0
  return Math.max(0, total.value - senaVal)
})

function getFormSnapshot() {
  return JSON.stringify({
    clienteId: clienteId.value,
    cliente: cliente.value,
    tematica: tematica.value,
    fechaFiesta: fechaFiesta.value,
    fechaEntrega: fechaEntrega.value,
    tipoEntrega: tipoEntrega.value,
    direccionEntrega: direccionEntrega.value,
    metodoPago: metodoPago.value,
    sena: parseFloat(sena.value) || 0,
    notas: notas.value,
    includeNotes: includeNotes.value,
    lines: lineas.value
      .filter(l => l.producto || l.qty || l.price)
      .map(l => ({
        producto: l.producto,
        productoId: l.productoId,
        qty: parseFloat(l.qty) || 0,
        price: parseFloat(l.price) || 0
      }))
  })
}

const originalFormSnapshot = ref('')
const isDirty = computed(() => {
  return getFormSnapshot() !== originalFormSnapshot.value
})

function reset() {
  cliente.value = ''
  clienteId.value = 0
  tematica.value = ''
  fechaFiesta.value = ''
  fechaEntrega.value = ''
  tipoEntrega.value = 'retira'
  direccionEntrega.value = ''
  metodoPago.value = ''
  sena.value = ''
  notas.value = ''
  includeNotes.value = true
  lineas.value = [{ id: mkId(), producto: '', productoId: 0, qty: '', price: '' }]
  activeRow.value = null
  editing.value = false
  dragId.value = null
  dragOverId.value = null
  snapshot.value = null
  savedAt.value = ''
  errors.value = {}
}

async function loadPresupuesto() {
  reset()
  if (props.presupuesto) {
    let p = props.presupuesto
    if (!p.detalles) {
      try {
        const res = await get<{ data: Presupuesto }>(`/presupuestos/${p.id}`)
        p = res.data
      } catch (e: any) {
        toast('Error al cargar detalles del presupuesto', 'error')
      }
    }
    cliente.value = p.cliente?.nombre || ''
    clienteId.value = p.clienteId
    tematica.value = p.tematica || ''
    fechaFiesta.value = p.fechaFiesta ? p.fechaFiesta.slice(0, 10) : ''
    fechaEntrega.value = p.fechaEntrega ? p.fechaEntrega.slice(0, 10) : ''
    tipoEntrega.value = p.tipoEntrega
    direccionEntrega.value = p.direccionEntrega || ''
    metodoPago.value = p.metodoPago || ''
    sena.value = p.sena ? p.sena.toString() : '0'
    notas.value = p.notas || ''
    lineas.value = (p.detalles || []).map((d) => ({
      id: mkId(),
      producto: d.producto?.nombre || d.descripcion,
      productoId: d.productoId,
      qty: d.cantidad.toString(),
      price: d.precioUnitario.toString(),
    }))
    if (lineas.value.length === 0) {
      lineas.value = [{ id: mkId(), producto: '', productoId: 0, qty: '', price: '' }]
    }
  }
  originalFormSnapshot.value = getFormSnapshot()
}

function updateLine(id: number, patch: Partial<{ producto: string; productoId: number; qty: string; price: string }>) {
  lineas.value = lineas.value.map(l => l.id === id ? { ...l, ...patch } : l)
  if (editing.value) {
    const last = lineas.value[lineas.value.length - 1]
    const lastEmpty = !last.producto && !last.qty && !last.price
    if (!lastEmpty) {
      lineas.value.push({ id: mkId(), producto: '', productoId: 0, qty: '', price: '' })
    }
  }
}

function removeLine(id: number) {
  lineas.value = lineas.value.filter(l => l.id !== id)
  if (lineas.value.length === 0) {
    lineas.value = [{ id: mkId(), producto: '', productoId: 0, qty: '', price: '' }]
  }
}

function handleProductChange(id: number, val: string) {
  const p = productos.value.find(p => p.nombre === val)
  const patch: any = { producto: val }
  if (p) {
    patch.productoId = p.id
    patch.price = p.precio.toString()
  } else {
    patch.productoId = 0
  }
  updateLine(id, patch)
}

function handleTableFocus() {
  if (!editing.value) {
    editing.value = true
    const last = lineas.value[lineas.value.length - 1]
    const lastEmpty = !last.producto && !last.qty && !last.price
    if (!lastEmpty) {
      lineas.value.push({ id: mkId(), producto: '', productoId: 0, qty: '', price: '' })
    }
  }
}

function handleTableBlur(e: FocusEvent) {
  const target = e.relatedTarget as HTMLElement | null
  const table = document.querySelector('.lines-spreadsheet')
  if (table && target && table.contains(target)) return
  editing.value = false
  activeRow.value = null
  if (lineas.value.length > 1) {
    const last = lineas.value[lineas.value.length - 1]
    const lastEmpty = !last.producto && !last.qty && !last.price
    if (lastEmpty) {
      lineas.value = lineas.value.slice(0, -1)
    }
  }
}

function onDrop(id: number) {
  if (dragId.value == null || dragId.value === id) {
    dragId.value = null
    dragOverId.value = null
    return
  }
  const from = lineas.value.findIndex(l => l.id === dragId.value)
  const to = lineas.value.findIndex(l => l.id === id)
  if (from < 0 || to < 0) return
  const next = [...lineas.value]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  lineas.value = next
  dragId.value = null
  dragOverId.value = null
}

function handleAddLine() {
  lineas.value.push({ id: mkId(), producto: '', productoId: 0, qty: '', price: '' })
  editing.value = true
  nextTick(() => {
    const table = document.querySelector('.lines-spreadsheet') as HTMLElement | null
    const inputs = table?.querySelectorAll('tbody tr:last-child .cell-input') as NodeListOf<HTMLInputElement> | undefined
    inputs?.[0]?.focus()
  })
}

function validate(): boolean {
  const detalles = lineas.value
    .filter(l => l.producto && parseFloat(l.qty) > 0)
    .map(l => ({
      productoId: l.productoId || 0,
      descripcion: l.producto,
      cantidad: parseFloat(l.qty),
      precioUnitario: parseFloat(l.price),
    }))

  const result = presupuestoSchema.safeParse({
    clienteId: clienteId.value,
    tematica: tematica.value,
    tipoEntrega: tipoEntrega.value,
    direccionEntrega: direccionEntrega.value,
    fechaFiesta: fechaFiesta.value ? new Date(fechaFiesta.value).toISOString() : undefined,
    fechaEntrega: fechaEntrega.value ? new Date(fechaEntrega.value).toISOString() : undefined,
    metodoPago: metodoPago.value,
    sena: parseFloat(sena.value) || 0,
    notas: notas.value,
    detalles,
  })
  if (!result.success) {
    errors.value = {}
    result.error.issues.forEach((e: any) => {
      errors.value[e.path.join('.')] = e.message
    })
    const firstError = result.error.issues[0]?.message || 'Datos de presupuesto inválidos'
    toast(firstError, 'error')
    return false
  }
  errors.value = {}
  return true
}

function captureSnapshot(status: string) {
  const now = new Date()
  return {
    folio: docFolio.value,
    cliente: cliente.value,
    tematica: tematica.value,
    fFiesta: fechaFiesta.value,
    fEntrega: fechaEntrega.value,
    envio: tipoEntrega.value,
    lugar: direccionEntrega.value,
    pago: metodoPago.value,
    sena: parseFloat(sena.value) || 0,
    resto: restoCalc.value,
    lines: lineas.value.filter(l => l.producto && parseFloat(l.qty) > 0),
    subtotal: subtotal.value,
    total: total.value,
    notes: notas.value,
    includeNotes: includeNotes.value,
    status,
    savedAt: now.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }
}

async function handleSave(action: 'borrador' | 'enviado') {
  if (!validate()) return

  const detalles = lineas.value
    .filter(l => l.producto && parseFloat(l.qty) > 0)
    .map(l => ({
      productoId: l.productoId,
      descripcion: l.producto,
      cantidad: parseFloat(l.qty),
      precioUnitario: parseFloat(l.price),
    }))

  const payload: any = {
    clienteId: clienteId.value,
    tematica: tematica.value,
    tipoEntrega: tipoEntrega.value,
    direccionEntrega: direccionEntrega.value,
    fechaFiesta: fechaFiesta.value ? new Date(fechaFiesta.value).toISOString() : undefined,
    fechaEntrega: fechaEntrega.value ? new Date(fechaEntrega.value).toISOString() : undefined,
    metodoPago: metodoPago.value,
    sena: parseFloat(sena.value) || 0,
    notas: notas.value,
    detalles,
  }

  try {
    let res: Presupuesto
    if (!isNew.value && props.presupuesto) {
      res = await put<Presupuesto>('/presupuestos', props.presupuesto.id, payload)
      toast('Presupuesto actualizado')
    } else {
      res = await post<Presupuesto>('/presupuestos', payload)
      toast(action === 'enviado' ? 'Presupuesto enviado' : 'Borrador guardado')
    }

    if (action === 'enviado' && isNew.value) {
      await put<Presupuesto>('/presupuestos/estado', res.id, { estado: 'enviado' })
    }

    snapshot.value = captureSnapshot(action === 'enviado' ? 'enviado' : 'borrador')
    const now = new Date()
    savedAt.value = now.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

    originalFormSnapshot.value = getFormSnapshot()
    emit('saved', res)
  } catch (e: any) {
    toast(e.message || 'Error al guardar', 'error')
  }
}

function openEditor() {
  emit('update:header', {
    mode: 'editor',
    title: isNew.value ? 'Nuevo' : (props.presupuesto?.folio || ''),
    onSave: () => handleSave('borrador'),
    onClose: () => emit('close'),
  })
}

function closeEditor() {
  emit('update:header', { mode: 'normal' })
  emit('close')
}

onMounted(async () => {
  try {
    const [clientesRes, productosRes] = await Promise.all([
      get<PaginationResult<Cliente>>('/clientes', { page: 1, limit: 100 }),
      get<PaginationResult<Producto>>('/productos', { page: 1, limit: 100 }),
    ])
    clientes.value = clientesRes.data
    productos.value = productosRes.data
  } catch (e: any) {
    toast('Error al cargar datos', 'error')
  }

  if (props.open) {
    await loadPresupuesto()
    openEditor()
    originalFormSnapshot.value = getFormSnapshot()
    editorDirty.value = isDirty.value
  }
})

watch(cliente, (newVal) => {
  if (props.presupuesto && newVal === props.presupuesto.cliente?.nombre) {
    clienteId.value = props.presupuesto.clienteId
    return
  }
  const match = clientes.value.find(c => c.nombre.toLowerCase() === newVal.toLowerCase())
  if (match) {
    clienteId.value = match.id
  } else {
    clienteId.value = 0
  }
})

watch(isDirty, (val) => {
  editorDirty.value = val
})

watch(
  [() => props.open, () => props.presupuesto],
  async ([open]) => {
    if (open) {
      await loadPresupuesto()
      openEditor()
      originalFormSnapshot.value = getFormSnapshot()
      editorDirty.value = isDirty.value
    } else {
      closeEditor()
      editorDirty.value = false
    }
  }
)

defineExpose({ loadPresupuesto })
</script>

<template>
  <Transition name="editor-slide">
    <div v-if="open" class="editor-overlay">


      <div class="editor-split">
        <div class="editor-form">
          <section class="form-section">
            <header class="form-section-head">
              <span class="step-pill">1</span>
              <h4>Cliente y evento</h4>
            </header>
            <div class="form-section-body">
              <div class="form-row">
                <div class="field">
                  <label>Cliente</label>
                  <input
                    class="input"
                    :value="cliente"
                    @input="cliente = ($event.target as HTMLInputElement).value"
                    placeholder="Buscar o agregar cliente..."
                    list="ed-clients"
                  />
                  <datalist id="ed-clients">
                    <option v-for="c in clientes" :key="c.id" :value="c.nombre" />
                  </datalist>
                </div>
                <div class="field">
                  <label>Temática</label>
                  <input
                    class="input"
                    v-model="tematica"
                    placeholder="Ej. Jardín pastel, dinosaurios, neón..."
                  />
                </div>
              </div>
              <div class="form-row">
                <div class="field">
                  <label>Fecha de fiesta</label>
                  <div class="date-wrap">
                    <Calendar :size="16" />
                    <input type="date" class="input date-input" v-model="fechaFiesta" />
                  </div>
                </div>
                <div class="field">
                  <label>Fecha de entrega</label>
                  <div class="date-wrap">
                    <Calendar :size="16" />
                    <input type="date" class="input date-input" v-model="fechaEntrega" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <header class="form-section-head">
              <span class="step-pill">2</span>
              <h4>Entrega</h4>
            </header>
            <div class="form-section-body">
              <div class="form-row form-row-envio">
                <div class="field">
                  <label>Método de envío</label>
                  <div class="segmented" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      :aria-selected="tipoEntrega === 'retira'"
                      :class="['seg-btn', tipoEntrega === 'retira' && 'active']"
                      @click="tipoEntrega = 'retira'"
                    >Retira</button>
                    <button
                      type="button"
                      role="tab"
                      :aria-selected="tipoEntrega === 'envio'"
                      :class="['seg-btn', tipoEntrega === 'envio' && 'active']"
                      @click="tipoEntrega = 'envio'"
                    >Envío</button>
                  </div>
                </div>
                <div v-if="tipoEntrega === 'envio'" class="field">
                  <label>Lugar de envío</label>
                  <input
                    class="input"
                    v-model="direccionEntrega"
                    placeholder="Calle, número, colonia, CP"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <header class="form-section-head">
              <span class="step-pill">3</span>
              <h4>Pago</h4>
            </header>
            <div class="form-section-body">
              <div class="form-row form-row-3">
                <div class="field">
                  <label>Método de pago</label>
                  <input
                    class="input"
                    v-model="metodoPago"
                    placeholder="Transferencia, MP, efectivo..."
                  />
                </div>
                <div class="field">
                  <label>Seña</label>
                  <div class="money-wrap">
                    <span class="money-prefix">$</span>
                    <input
                      class="input money-input"
                      type="number"
                      min="0"
                      step="0.01"
                      v-model="sena"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div class="field">
                  <label>Resto</label>
                  <div class="money-wrap">
                    <span class="money-prefix">$</span>
                    <input
                      class="input money-input"
                      type="text"
                      readonly
                      :value="money(restoCalc)"
                      placeholder="0.00"
                      style="background: var(--page-bg)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <header class="form-section-head">
              <span class="step-pill">4</span>
              <h4>Productos</h4>
            </header>
            <div class="form-section-body">
              <div
                class="lines-spreadsheet"
                tabindex="-1"
                @focus="handleTableFocus"
                @blur="handleTableBlur"
              >
                <table>
                  <colgroup>
                    <col style="width: 22px" />
                    <col />
                    <col style="width: 58px" />
                    <col style="width: 86px" />
                    <col style="width: 92px" />
                    <col style="width: 30px" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Producto / descripción</th>
                      <th class="num">Cant.</th>
                      <th class="num">Precio</th>
                      <th class="num">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="l in lineas"
                      :key="l.id"
                      :class="[
                        'ln-row',
                        activeRow === l.id && 'active',
                        (l.producto && (!parseFloat(l.qty) || parseFloat(l.qty) <= 0)) && 'error',
                        dragId === l.id && 'dragging',
                        dragOverId === l.id && dragId !== l.id && 'drag-over',
                      ].filter(Boolean).join(' ')"
                      draggable
                      @dragstart="dragId = l.id"
                      @dragover.prevent="dragOverId = l.id"
                      @drop="onDrop(l.id)"
                      @dragend="dragId = null; dragOverId = null"
                      @mousedown="activeRow = l.id"
                    >
                      <td class="grip" title="Arrastrar para reordenar">
                        <GripVertical :size="14" />
                      </td>
                      <td>
                        <input
                          class="cell-input"
                          :value="l.producto"
                          @input="handleProductChange(l.id, ($event.target as HTMLInputElement).value)"
                          @focus="activeRow = l.id"
                          :placeholder="l.id === lineas[0]?.id ? 'Producto, descripción o catálogo...' : ''"
                          list="ed-products"
                        />
                      </td>
                      <td>
                        <input
                          class="cell-input num-input"
                          type="number"
                          min="0"
                          step="1"
                          :value="l.qty"
                          @input="updateLine(l.id, { qty: ($event.target as HTMLInputElement).value })"
                          @focus="activeRow = l.id"
                        />
                      </td>
                      <td>
                        <input
                          class="cell-input num-input"
                          type="number"
                          min="0"
                          step="0.5"
                          :value="l.price"
                          @input="updateLine(l.id, { price: ($event.target as HTMLInputElement).value })"
                          @focus="activeRow = l.id"
                        />
                      </td>
                      <td class="num cell-subtotal">
                        {{ money((parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0)) }}
                      </td>
                      <td>
                        <button
                          class="del-btn"
                          @click="removeLine(l.id)"
                          title="Eliminar línea"
                        >
                          <Trash2 :size="14" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <datalist id="ed-products">
                  <option v-for="p in productos" :key="p.id" :value="p.nombre" />
                </datalist>

                <button
                  v-if="!editing"
                  type="button"
                  class="add-line-btn"
                  @mousedown.prevent
                  @click="handleAddLine"
                >
                  <Plus :size="14" /> Agregar línea
                </button>
                <div v-else class="lines-hint text-hint">
                  <GripVertical :size="12" /> arrastrá para reordenar &nbsp;·&nbsp; Tab para avanzar &nbsp;·&nbsp; click fuera para cerrar
                </div>
              </div>

              <div class="ed-totals">
                <div class="r"><span>Subtotal</span><span class="num">{{ money(subtotal) }}</span></div>
                <div class="r grand">
                  <span>Total</span><span class="num v">{{ money(total) }}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <header class="form-section-head">
              <span class="step-pill">5</span>
              <h4>Notas</h4>
            </header>
            <div class="form-section-body">
              <div class="field">
                <textarea
                  class="textarea"
                  v-model="notas"
                  placeholder="Detalles para el cliente: incluye montaje, instrucciones de retiro, alergenos, etc."
                />
              </div>
              <label class="check-row">
                <input type="checkbox" v-model="includeNotes" />
                <span>Incluir en impresión / vista web</span>
              </label>
            </div>
          </section>

          <div class="form-tailspace"></div>
        </div>

        <div class="editor-preview">
          <div v-if="!snapshot" class="preview-empty">
            <FileText :size="44" />
            <p>El presupuesto aparecerá aquí al guardar.</p>
            <small>Vista del documento como lo recibe el cliente.</small>
          </div>
          <div v-else class="preview-doc">
            <header class="doc-head">
              <img src="/memydeni-logo.png" alt="MemyDeni" />
              <div class="doc-meta">
                <div class="folio">{{ snapshot.folio }}</div>
                <div class="text-hint">{{ new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) }}</div>
              </div>
            </header>

            <div class="doc-customer">
              <div class="who-block">
                <small>Para</small>
                <div class="who">{{ snapshot.cliente || '—' }}</div>
                <div v-if="snapshot.tematica" class="text-hint">Temática · {{ snapshot.tematica }}</div>
              </div>
              <div class="doc-dates">
                <div v-if="snapshot.fFiesta">
                  <small>Fiesta</small>
                  <span>{{ niceDate(snapshot.fFiesta) }}</span>
                </div>
                <div v-if="snapshot.fEntrega">
                  <small>Entrega</small>
                  <span>{{ niceDate(snapshot.fEntrega) }}</span>
                </div>
              </div>
            </div>

            <table v-if="snapshot.lines.length > 0" class="doc-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="num">Cant.</th>
                  <th class="num">Precio</th>
                  <th class="num">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="l in snapshot.lines" :key="l.id">
                  <td>{{ l.producto }}</td>
                  <td class="num">{{ l.qty }}</td>
                  <td class="num">{{ money(parseFloat(l.price)) }}</td>
                  <td class="num">{{ money((parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0)) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="doc-empty-rows">Sin productos aún.</div>

            <div class="doc-totals">
              <div class="r"><span>Subtotal</span><span class="num">{{ money(snapshot.subtotal) }}</span></div>
              <div class="r big"><span>Total</span><span class="num">{{ money(snapshot.total) }}</span></div>
              <div v-if="snapshot.sena > 0" class="doc-pay">
                <div class="r small">
                  <span>Seña{{ snapshot.pago ? ` (${snapshot.pago})` : '' }}</span>
                  <span class="num">{{ money(snapshot.sena) }}</span>
                </div>
                <div class="r small">
                  <span>Resto a pagar</span>
                  <span class="num">{{ money(snapshot.resto) }}</span>
                </div>
              </div>
            </div>

            <div class="doc-grid">
              <div class="doc-block">
                <small>Entrega</small>
                <div class="block-body">
                  <template v-if="snapshot.envio === 'envio'">
                    Envío a domicilio<br />
                    <span class="text-hint">{{ snapshot.lugar || '—' }}</span>
                  </template>
                  <template v-else>Retira en tienda</template>
                </div>
              </div>
              <div class="doc-block">
                <small>Contacto</small>
                <div class="block-body">
                  MemyDeni · Papelería para fiestas<br />
                  <span class="text-hint">hola@memydeni.mx · +52 55 1234 5678</span>
                </div>
              </div>
            </div>

            <div v-if="snapshot.includeNotes && snapshot.notes" class="doc-notes">
              <small>Notas</small>
              <p>{{ snapshot.notes }}</p>
            </div>

            <footer class="doc-foot text-hint">
              Precios en MXN. Vigencia 14 días. Gracias por confiar en MemyDeni
            </footer>
          </div>
        </div>
      </div>

      <div class="editor-foot">
        <button class="btn btn-ghost" @click="closeEditor">Cancelar</button>
        <div class="spacer"></div>
        <button class="btn btn-secondary" @click="handleSave('borrador')" :disabled="!isDirty" :style="{ opacity: isDirty ? 1 : 0.5, pointerEvents: isDirty ? 'auto' : 'none' }">Guardar borrador</button>
        <button class="btn btn-primary" @click="handleSave('enviado')" :disabled="!isDirty" :style="{ opacity: isDirty ? 1 : 0.5, pointerEvents: isDirty ? 'auto' : 'none' }">
          Enviar <ArrowRight :size="16" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.editor-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--page-bg);
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
}



.editor-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.editor-title .eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  font-weight: 500;
}

.editor-title .eyebrow .folio {
  color: var(--violet-700);
  font-variant-numeric: tabular-nums;
}

.editor-title h2 {
  font-size: 22px;
  line-height: 1.1;
  margin: 0;
  color: var(--violet-700);
}

.save-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 6px 12px;
  background: var(--mint);
  color: #1F5A3E;
  border-radius: 999px;
}

.save-chip .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1F8A5B;
}

.editor-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 0;
  overflow: hidden;
}

.editor-form {
  overflow-y: auto;
  padding: 28px 28px 24px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 26px;
  background: var(--page-bg);
}

.editor-preview {
  overflow-y: auto;
  padding: 28px 32px;
  background: radial-gradient(circle at 50% 0%, rgba(139, 37, 112, 0.04), transparent 240px), var(--page-bg);
}

.form-tailspace { height: 4px; }

.form-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-section-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-section-head h4 {
  font-size: 16px;
  color: var(--ink);
  font-weight: 500;
  letter-spacing: -0.005em;
}

.step-pill {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--violet-50);
  color: var(--violet-700);
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.form-section-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  align-items: end;
}

.form-row-3 { grid-template-columns: 2fr 1fr 1fr; }
.form-row-envio { grid-template-columns: 240px 1fr; }

.date-wrap { position: relative; }
.date-wrap > svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--ink-muted);
  pointer-events: none;
}

.date-input { padding-left: 36px; }

.segmented {
  display: inline-flex;
  padding: 3px;
  background: var(--page-bg);
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  height: 40px;
  width: 100%;
}

.seg-btn {
  flex: 1;
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 0 18px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-muted);
  border-radius: 999px;
  transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
}

.seg-btn:hover { color: var(--ink); }
.seg-btn.active {
  background: var(--surface);
  color: var(--violet-700);
  box-shadow: var(--shadow-1);
}

.money-wrap { position: relative; }
.money-prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-muted);
  font-size: 13px;
  pointer-events: none;
}

.money-input {
  padding-left: 22px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.lines-spreadsheet {
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  outline: none;
  overflow: hidden;
}

.lines-spreadsheet table {
  width: 100%;
  border-collapse: collapse;
}

.lines-spreadsheet th {
  text-align: left;
  padding: 10px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--page-bg);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.lines-spreadsheet th:first-child { padding-left: 4px; padding-right: 4px; }
.lines-spreadsheet th:nth-child(2) { white-space: normal; }
.lines-spreadsheet th.num { text-align: right; }

.lines-spreadsheet tbody tr.ln-row {
  position: relative;
  border-bottom: 1px solid var(--border);
  transition: background 120ms ease;
}

.lines-spreadsheet tbody tr.active td {
  box-shadow: inset 0 1.5px 0 var(--violet-700), inset 0 -1.5px 0 var(--violet-700);
}
.lines-spreadsheet tbody tr.active td:first-child {
  box-shadow: inset 1.5px 0 0 var(--violet-700), inset 0 1.5px 0 var(--violet-700), inset 0 -1.5px 0 var(--violet-700);
}
.lines-spreadsheet tbody tr.active td:last-child {
  box-shadow: inset -1.5px 0 0 var(--violet-700), inset 0 1.5px 0 var(--violet-700), inset 0 -1.5px 0 var(--violet-700);
}

.lines-spreadsheet tbody tr.error td {
  box-shadow: inset 0 1.5px 0 var(--coral-500), inset 0 -1.5px 0 var(--coral-500);
}
.lines-spreadsheet tbody tr.error td:first-child {
  box-shadow: inset 1.5px 0 0 var(--coral-500), inset 0 1.5px 0 var(--coral-500), inset 0 -1.5px 0 var(--coral-500);
}
.lines-spreadsheet tbody tr.error td:last-child {
  box-shadow: inset -1.5px 0 0 var(--coral-500), inset 0 1.5px 0 var(--coral-500), inset 0 -1.5px 0 var(--coral-500);
}

.lines-spreadsheet tbody tr:hover { background: rgba(139, 37, 112, 0.025); }
.lines-spreadsheet tbody tr.dragging { opacity: 0.35; }
.lines-spreadsheet tbody tr.drag-over td { box-shadow: inset 0 2px 0 var(--violet-700); }
.lines-spreadsheet tbody tr:last-child { border-bottom: 0; }

.lines-spreadsheet td { padding: 0; vertical-align: middle; }

.lines-spreadsheet td.grip {
  width: 28px;
  padding: 8px 4px 8px 8px;
  color: var(--ink-muted);
  cursor: grab;
  opacity: 0.28;
  transition: opacity 120ms ease;
  user-select: none;
}
.lines-spreadsheet td.grip:active { cursor: grabbing; }
.lines-spreadsheet tbody tr:hover td.grip { opacity: 0.85; }
.lines-spreadsheet td.grip svg { width: 14px; height: 14px; }

.lines-spreadsheet .cell-input {
  border: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--ink);
  width: 100%;
  padding: 11px 8px;
  outline: none;
  min-width: 0;
}
.lines-spreadsheet .cell-input::placeholder { color: var(--ink-muted); }
.lines-spreadsheet .cell-input:focus { background: var(--teal-100); }
.lines-spreadsheet .num-input { text-align: right; font-variant-numeric: tabular-nums; }
.lines-spreadsheet .cell-subtotal {
  padding: 11px 8px;
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.lines-spreadsheet .del-btn {
  background: transparent;
  border: 0;
  cursor: pointer;
  color: var(--ink-muted);
  padding: 8px;
  opacity: 0;
  transition: opacity 120ms ease, color 120ms ease;
}
.lines-spreadsheet .del-btn svg { width: 14px; height: 14px; }
.lines-spreadsheet tbody tr:hover .del-btn { opacity: 1; }
.lines-spreadsheet .del-btn:hover { color: var(--coral-500); }

.lines-spreadsheet .cell-input[type="number"]::-webkit-outer-spin-button,
.lines-spreadsheet .cell-input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.lines-spreadsheet .cell-input[type="number"] { -moz-appearance: textfield; }

.add-line-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: var(--surface);
  border: 0;
  border-top: 1px dashed var(--border-strong);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--violet-700);
  cursor: pointer;
  text-align: left;
}
.add-line-btn:hover { background: var(--violet-50); }
.add-line-btn svg { width: 14px; height: 14px; }

.lines-hint {
  padding: 9px 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  background: var(--page-bg);
  color: var(--ink-muted);
}
.lines-hint svg { width: 12px; height: 12px; opacity: 0.75; }

.ed-totals {
  margin-top: 14px;
  padding: 0 4px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  font-variant-numeric: tabular-nums;
  margin-left: auto;
  max-width: 320px;
  width: 100%;
  align-self: flex-end;
}

.ed-totals .r {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 0;
  font-size: 14px;
  color: var(--ink-muted);
}

.ed-totals .r.grand {
  border-top: 1px solid var(--border-strong);
  margin-top: 8px;
  padding-top: 12px;
  font-size: 24px;
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.ed-totals .r.grand .v { color: var(--violet-700); }

.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 400;
  color: var(--ink);
  cursor: pointer;
}

.check-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--teal-500);
  cursor: pointer;
}

.editor-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  position: relative;
  z-index: 5;
}

.preview-empty {
  height: 100%;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-lg);
  background: var(--surface);
  color: var(--ink-muted);
  text-align: center;
}

.preview-empty svg {
  width: 44px;
  height: 44px;
  opacity: 0.45;
  margin-bottom: 6px;
  color: var(--violet-700);
}

.preview-empty p {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  margin: 0;
}

.preview-empty small { font-size: 12px; color: var(--ink-muted); }

.preview-doc {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 36px 40px 30px;
  box-shadow: var(--shadow-2);
  max-width: 620px;
  margin: 0 auto;
  opacity: 1;
  animation: doc-pop 260ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

@keyframes doc-pop {
  from { transform: translateY(10px) scale(0.985); }
  to { transform: translateY(0) scale(1); }
}

.preview-doc .doc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.preview-doc .doc-head img { width: 130px; height: auto; display: block; }
.preview-doc .doc-meta { text-align: right; }
.preview-doc .doc-meta .folio {
  font-size: 18px;
  font-weight: 500;
  color: var(--violet-700);
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}
.preview-doc .doc-meta .text-hint { margin-top: 2px; }

.preview-doc .doc-customer {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 0;
  border-bottom: 1px solid var(--border);
}

.preview-doc .doc-customer small,
.preview-doc .doc-block small,
.preview-doc .doc-notes small {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--ink-muted);
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.preview-doc .doc-customer .who {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.005em;
  margin-bottom: 4px;
}

.preview-doc .doc-dates {
  display: flex;
  gap: 28px;
  text-align: right;
  flex-shrink: 0;
}

.preview-doc .doc-dates > div span {
  font-size: 14px;
  color: var(--ink);
  display: block;
  text-transform: capitalize;
}

.preview-doc .doc-table {
  width: 100%;
  margin: 22px 0 0;
  border-collapse: collapse;
}

.preview-doc .doc-table th {
  text-align: left;
  padding: 10px 0;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--ink-muted);
  font-weight: 500;
  border-bottom: 1px solid var(--border);
}
.preview-doc .doc-table th.num { text-align: right; }

.preview-doc .doc-table td {
  padding: 14px 0;
  font-size: 13px;
  color: var(--ink);
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
.preview-doc .doc-table td.num { font-variant-numeric: tabular-nums; }

.preview-doc .doc-empty-rows {
  padding: 22px 0;
  color: var(--ink-muted);
  font-size: 13px;
  border-bottom: 1px solid var(--border);
}

.preview-doc .doc-totals {
  padding: 14px 0;
  font-variant-numeric: tabular-nums;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.preview-doc .doc-totals .r {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 14px;
  min-width: 240px;
}

.preview-doc .doc-totals .r.big {
  font-size: 22px;
  font-weight: 500;
  color: var(--violet-700);
  border-top: 1px solid var(--border-strong);
  padding-top: 12px;
  margin-top: 8px;
  letter-spacing: -0.01em;
}

.preview-doc .doc-totals .r.small {
  font-size: 12px;
  color: var(--ink-muted);
}

.preview-doc .doc-pay {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.preview-doc .doc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 18px 0;
  border-top: 1px solid var(--border);
}

.preview-doc .doc-block .block-body {
  font-size: 13px;
  color: var(--ink);
  line-height: 1.5;
}

.preview-doc .doc-notes {
  padding: 18px 0;
  border-top: 1px solid var(--border);
}

.preview-doc .doc-notes p {
  font-size: 13px;
  color: var(--ink);
  line-height: 1.55;
  white-space: pre-wrap;
}

.preview-doc .doc-foot {
  text-align: center;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  margin-top: 4px;
}

.editor-slide-enter-active,
.editor-slide-leave-active {
  transition: opacity 220ms ease;
}

.editor-slide-enter-from,
.editor-slide-leave-to {
  opacity: 0;
}

.editor-slide-enter-active .editor-overlay,
.editor-slide-leave-active .editor-overlay {
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.editor-slide-enter-from .editor-overlay,
.editor-slide-leave-to .editor-overlay {
  transform: translateX(30px);
}
</style>
