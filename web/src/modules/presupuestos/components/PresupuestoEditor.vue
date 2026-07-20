<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { FileText, Download, Link2 } from '@lucide/vue'
import { get } from '@/shared/api/client'
import { useToast } from '@/shared/lib/useToast'
import { usePresupuestosStore } from '../store'
import { editorDirty } from '@/shared/lib/editorMode'
import type { Presupuesto, Cliente, Producto, PaginationResult, ConfiguracionNegocio } from '@/types'
import { presupuestoSchema } from '@/schemas/presupuestos'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FloatingField from '@/shared/ui/FloatingField.vue'
import PresupuestoDoc from './PresupuestoDoc.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'

import LinesSpreadsheet from './LinesSpreadsheet.vue'
import EditorTotals from './EditorTotals.vue'

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
const store = usePresupuestosStore()

const isNew = computed(() => !props.presupuesto)
const docFolio = computed(() => props.presupuesto?.folio || 'P-...')
const estado = ref('borrador')

const isEditable = computed(() => {
  return isNew.value || estado.value === 'borrador' || estado.value === 'en_curso'
})

const statusTones: Record<string, { tone: string; label: string }> = {
  borrador: { tone: 'default', label: 'Borrador' },
  en_curso: { tone: 'teal', label: 'En curso' },
  cerrado: { tone: 'mint', label: 'Cerrado' },
  facturado: { tone: 'lavender', label: 'Facturado' },
  cancelado: { tone: 'coral', label: 'Cancelado' },
  enviado: { tone: 'violet', label: 'Enviado' }, // Legacy fallback
}

const TRANSITIONS: Record<string, string[]> = {
  borrador: ['en_curso', 'cancelado'],
  en_curso: ['cerrado', 'cancelado'],
  cerrado: ['facturado', 'en_curso'],
  facturado: [],
  cancelado: [],
  enviado: ['en_curso', 'cancelado'], // Legacy fallback
}

function getAvailableTransitions(state: string): string[] {
  return TRANSITIONS[state] || []
}

const dropdownOpen = ref(false)

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function closeDropdown() {
  dropdownOpen.value = false
}

const showConfirmReopen = ref(false)

function handleStatusChange(newStatus: string) {
  if (props.presupuesto?.estado === 'cerrado' && newStatus === 'en_curso') {
    showConfirmReopen.value = true
    return
  }
  estado.value = newStatus
  toast(`Estado cambiado localmente a ${statusTones[newStatus]?.label || newStatus}. Guardá para persistir.`, 'info')
}

async function confirmReopen() {
  showConfirmReopen.value = false
  if (!props.presupuesto) return
  try {
    const updated = await store.updateStatus(props.presupuesto.id, 'en_curso')
    estado.value = updated.estado
    originalFormSnapshot.value = getFormSnapshot()
    emit('saved', updated)
    await loadPresupuesto()
    toast('Presupuesto reabierto. Ahora podés editar los campos.')
  } catch (e: any) {
    toast(e.message || 'Error al reabrir el presupuesto', 'error')
  }
}

const clientes = ref<Cliente[]>([])
const productos = ref<Producto[]>([])
const config = ref<ConfiguracionNegocio | null>(null)

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

const showConfirmExit = ref(false)


const lineas = ref<Array<{ id: number; producto: string; productoId: number; qty: string; price: string }>>([])
const idRef = ref(1)

const mkId = () => ++idRef.value

const snapshot = ref<any>(null)
const savedAt = ref('')
const errors = ref<Record<string, string>>({})

// validez por campo para las sombras de estado del FloatingField
const clienteInvalid = computed(() =>
  !!errors.value.clienteId || (cliente.value.trim().length > 0 && clienteId.value === 0)
)
const senaInvalid = computed(() => {
  const v = sena.value
  if (v === '' || v == null) return false
  const n = parseFloat(v)
  return isNaN(n) || n < 0
})

// --- Accesibilidad: focus-trap del dialog ---
const overlayEl = ref<HTMLElement | null>(null)
let prevFocused: HTMLElement | null = null

function getFocusable(): HTMLElement[] {
  if (!overlayEl.value) return []
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(overlayEl.value.querySelectorAll<HTMLElement>(sel))
    .filter(el => el.offsetParent !== null)
}

function onOverlayKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    triggerClose()
    return
  }
  if (e.key === 'Tab') {
    const f = getFocusable()
    if (f.length === 0) return
    const first = f[0]
    const last = f[f.length - 1]
    const active = document.activeElement as HTMLElement
    if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

async function focusFirstField() {
  prevFocused = document.activeElement as HTMLElement | null
  await nextTick()
  getFocusable()[0]?.focus()
}

function restoreFocus() {
  prevFocused?.focus?.()
  prevFocused = null
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
    estado: estado.value,
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
  snapshot.value = null
  savedAt.value = ''
  errors.value = {}
  estado.value = 'borrador'
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
    includeNotes.value = p.notasPublicas ?? true
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
    estado.value = p.estado
    // presupuesto ya guardado: mostrar el documento de entrada en el panel derecho
    snapshot.value = captureSnapshot(p.estado)
  }
  originalFormSnapshot.value = getFormSnapshot()
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
    savedAt: now.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }
}

async function handleSave() {
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
    notasPublicas: includeNotes.value,
    detalles,
  }

  try {
    let res: Presupuesto
    if (!isNew.value && props.presupuesto) {
      res = await store.update(props.presupuesto.id, payload)
      if (estado.value !== props.presupuesto.estado) {
        res = await store.updateStatus(props.presupuesto.id, estado.value)
      }
      toast('Presupuesto actualizado')
    } else {
      res = await store.create(payload)
      if (estado.value !== 'borrador') {
        res = await store.updateStatus(res.id, estado.value)
      }
      toast('Borrador guardado')
    }

    snapshot.value = captureSnapshot(estado.value)
    const now = new Date()
    savedAt.value = now.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

    originalFormSnapshot.value = getFormSnapshot()
    emit('saved', res)
    await loadPresupuesto()
  } catch (e: any) {
    toast(e.message || 'Error al guardar', 'error')
  }
}


// --- Documento: descarga de PDF y link público ---
// el documento existe solo con el estado persistido más allá de borrador
const canShareDoc = computed(() => {
  const persistido = props.presupuesto?.estado
  return !isNew.value && !!persistido && persistido !== 'borrador' && persistido !== 'cancelado'
})

const pdfLoading = ref(false)

async function handleDownloadPdf() {
  if (!props.presupuesto || pdfLoading.value) return
  pdfLoading.value = true
  try {
    const res = await get<{ data: { url: string } }>(`/presupuestos/${props.presupuesto.id}/pdf`)
    window.open(res.data.url, '_blank')
  } catch (e: any) {
    toast(e.data?.error || 'Error al generar el PDF', 'error')
  } finally {
    pdfLoading.value = false
  }
}

async function handleCopyLink() {
  if (!props.presupuesto) return
  let token = props.presupuesto.publicToken
  if (!token) {
    try {
      const res = await get<{ data: Presupuesto }>(`/presupuestos/${props.presupuesto.id}`)
      token = res.data.publicToken
    } catch {
      // se reporta abajo si sigue faltando
    }
  }
  if (!token) {
    toast('No se pudo obtener el link del presupuesto', 'error')
    return
  }
  try {
    await navigator.clipboard.writeText(`${location.origin}/p/${token}`)
    toast('Link copiado al portapapeles')
  } catch {
    toast('No se pudo copiar el link', 'error')
  }
}

function triggerClose() {
  if (isDirty.value) {
    showConfirmExit.value = true
  } else {
    closeEditor()
  }
}

function openEditor() {
  emit('update:header', {
    mode: 'editor',
    title: isNew.value ? 'Nuevo' : (props.presupuesto?.folio || ''),
    onSave: () => handleSave(),
    onClose: triggerClose,
  })
}

function closeEditor() {
  emit('update:header', { mode: 'normal' })
  emit('close')
  restoreFocus()
}

onMounted(async () => {
  window.addEventListener('click', closeDropdown)
  try {
    const [clientesRes, productosRes, configRes] = await Promise.all([
      get<PaginationResult<Cliente>>('/clientes', { page: 1, limit: 100 }),
      get<PaginationResult<Producto>>('/productos', { page: 1, limit: 100 }),
      get<{ data: ConfiguracionNegocio }>('/ajustes/configuracion'),
    ])
    clientes.value = clientesRes.data
    productos.value = productosRes.data
    config.value = configRes.data
  } catch (e: any) {
    toast('Error al cargar datos', 'error')
  }

  if (props.open) {
    await loadPresupuesto()
    openEditor()
    originalFormSnapshot.value = getFormSnapshot()
    editorDirty.value = isDirty.value
    focusFirstField()
  }
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdown)
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
      focusFirstField()
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
    <div
      v-if="open"
      ref="overlayEl"
      class="fixed top-[56px] right-0 bottom-0 left-[240px] z-30 bg-page-bg flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      :aria-label="isNew ? 'Nuevo presupuesto' : `Presupuesto ${docFolio}`"
      @keydown="onOverlayKeydown"
    >
      <div class="editor-split">
        <div class="editor-form">
          <Teleport to="#editor-header-status">
            <div v-if="!isNew" class="custom-status-dropdown" @click.stop>
              <button
                type="button"
                class="status-badge-wrap"
                :class="[statusTones[estado]?.tone || 'default', getAvailableTransitions(estado).length > 0 && 'interactive']"
                @click="toggleDropdown"
                :disabled="getAvailableTransitions(estado).length === 0"
                :aria-haspopup="getAvailableTransitions(estado).length > 0 ? 'menu' : undefined"
                :aria-expanded="getAvailableTransitions(estado).length > 0 ? dropdownOpen : undefined"
                :aria-label="`Estado: ${statusTones[estado]?.label || estado}${getAvailableTransitions(estado).length > 0 ? ', cambiar estado' : ''}`"
              >
                <span class="dot" aria-hidden="true" />
                <span>{{ statusTones[estado]?.label || estado }}</span>
                <span v-if="getAvailableTransitions(estado).length > 0" class="chevron-arrow" aria-hidden="true"></span>
              </button>
              <div v-if="dropdownOpen" class="status-dropdown-menu" role="menu">
                <button
                  v-for="t in getAvailableTransitions(estado)"
                  :key="t"
                  type="button"
                  role="menuitem"
                  class="status-dropdown-item"
                  :class="statusTones[t]?.tone || 'default'"
                  @click="handleStatusChange(t); dropdownOpen = false"
                >
                  <span class="dot" aria-hidden="true" />
                  <span>{{ statusTones[t]?.label || t }}</span>
                </button>
              </div>
            </div>
          </Teleport>

          <section class="form-section">
            <div class="form-section-body">
              <div class="form-row">
                <div class="field">
                  <FloatingField
                    id="ed-cliente"
                    label="Cliente"
                    float-size="16px"
                    required
                    v-model="cliente"
                    placeholder="Buscar o agregar cliente..."
                    list="ed-clients"
                    :disabled="!isEditable"
                    :invalid="clienteInvalid"
                    :describedby="errors.clienteId ? 'ed-cliente-err' : undefined"
                  />
                  <datalist id="ed-clients">
                    <option v-for="c in clientes" :key="c.id" :value="c.nombre" />
                  </datalist>
                  <p v-if="errors.clienteId" id="ed-cliente-err" class="err" role="alert">{{ errors.clienteId }}</p>
                </div>
                <div class="field">
                  <FloatingField
                    id="ed-tematica"
                    label="Evento"
                    v-model="tematica"
                    placeholder="Ej. Jardín pastel, dinosaurios, neón..."
                    :disabled="!isEditable"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-body">
              <div class="form-row">
                <div class="field">
                  <FloatingField
                    id="ed-fecha-fiesta"
                    label="Fecha de fiesta"
                    type="date"
                    always-float
                    v-model="fechaFiesta"
                    :disabled="!isEditable"
                  />
                </div>
                <div class="field">
                  <FloatingField
                    id="ed-fecha-entrega"
                    label="Fecha de entrega"
                    type="date"
                    always-float
                    v-model="fechaEntrega"
                    :disabled="!isEditable"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-body">
              <div class="form-row form-row-3">
                <div class="field">
                  <FloatingField
                    id="ed-metodo-pago"
                    label="Método de pago"
                    v-model="metodoPago"
                    placeholder="Transferencia, MP, efectivo..."
                    :disabled="!isEditable"
                  />
                </div>
                <div class="field">
                  <FloatingField
                    id="ed-sena"
                    label="Seña"
                    type="number"
                    prefix="$"
                    float-size="13px"
                    v-model="sena"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    :invalid="senaInvalid"
                    :disabled="!isEditable"
                  />
                </div>
                <div class="field">
                  <FloatingField
                    id="ed-resto"
                    label="Resto"
                    prefix="$"
                    float-size="13px"
                    always-float
                    readonly
                    tabindex="-1"
                    aria-label="Resto a pagar, calculado automáticamente"
                    :model-value="restoCalc.toFixed(2)"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-body">
              <div class="form-row form-row-envio">
                <div class="field">
                  <div class="envio-head">
                    <h4>Entrega</h4>
                    <span id="ed-envio-label" class="form-subhead">Método de envío</span>
                  </div>
                  <div class="segmented" style="margin-top: 4px;">
                    <input
                      type="checkbox"
                      id="cb-envio-tipo"
                      class="tgl tgl-flip"
                      :checked="tipoEntrega === 'envio'"
                      @change="tipoEntrega = ($event.target as HTMLInputElement).checked ? 'envio' : 'retira'"
                      :disabled="!isEditable"
                    />
                    <label for="cb-envio-tipo" data-tg-on="Envío" data-tg-off="Retira" class="tgl-btn" style="margin: 0;"></label>
                  </div>
                </div>
                <div v-if="tipoEntrega === 'envio'" class="field">
                  <FloatingField
                    id="ed-lugar-envio"
                    label="Lugar de envío"
                    v-model="direccionEntrega"
                    placeholder="Calle, número, colonia, CP"
                    :disabled="!isEditable"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-body">
              <LinesSpreadsheet
                v-model="lineas"
                :productosList="productos"
                :errors="errors"
              />

              <p v-if="errors.detalles" class="err" role="alert">{{ errors.detalles }}</p>

              <EditorTotals
                :subtotal="subtotal"
                :total="total"
              />
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-body">
              <div class="field">
                <FloatingField
                  id="ed-notas"
                  label="Notas"
                  multiline
                  v-model="notas"
                  placeholder="Detalles para el cliente: incluye montaje, instrucciones de retiro, alergenos, etc."
                  :disabled="!isEditable"
                />
              </div>
              <label class="check-row">
                <input type="checkbox" v-model="includeNotes" :disabled="!isEditable" />
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
          <PresupuestoDoc v-else :doc="snapshot" :config="config" />
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-border px-5.5 py-3.5 bg-surface min-h-[56px] select-none shrink-0">
        <div class="flex-1"></div>
        <div class="flex items-center gap-2">
          <template v-if="canShareDoc">
            <BaseButton variant="secondary" type="button" @click="handleCopyLink">
              <Link2 :size="16" aria-hidden="true" />
              Copiar link
            </BaseButton>
            <BaseButton variant="secondary" type="button" :disabled="pdfLoading" @click="handleDownloadPdf">
              <Download :size="16" aria-hidden="true" />
              {{ pdfLoading ? 'Generando...' : 'Descargar PDF' }}
            </BaseButton>
          </template>
        </div>
      </div>
    </div>
  </Transition>

  <ConfirmDialog
    :open="showConfirmExit"
    title="Salir sin guardar"
    message="Tenés cambios sin guardar en este presupuesto. ¿Querés salir de todos modos?"
    confirm-label="Salir"
    variant="danger"
    @confirm="showConfirmExit = false; closeEditor()"
    @cancel="showConfirmExit = false"
  />

  <ConfirmDialog
    :open="showConfirmReopen"
    title="Reabrir presupuesto"
    message="Este presupuesto ya está cerrado. Al reabrirlo, volverá al estado 'En curso' para que puedas modificar sus datos y se borrará la fecha de finalización. ¿Deseas continuar?"
    confirm-label="Reabrir"
    variant="default"
    @confirm="confirmReopen"
    @cancel="showConfirmReopen = false"
  />
</template>

<style scoped>
.editor-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--color-page-bg);
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
  color: var(--color-ink-muted);
  font-weight: 500;
}

.editor-title .eyebrow .folio {
  color: var(--color-violet-700);
  font-variant-numeric: tabular-nums;
}

.editor-title h2 {
  font-size: 22px;
  line-height: 1.1;
  margin: 0;
  color: var(--color-violet-700);
}

.save-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 6px 12px;
  background: var(--color-mint);
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
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 26px;
  background: var(--color-page-bg);
}

.editor-preview {
  overflow-y: auto;
  padding: 28px 32px;
  background: radial-gradient(circle at 50% 0%, rgba(139, 37, 112, 0.04), transparent 240px), var(--color-page-bg);
}

.form-tailspace { height: 4px; }

.form-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-section-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.form-section-head h4 {
  font-size: 16px;
  color: var(--color-ink);
  font-weight: 500;
  letter-spacing: -0.005em;
}

/* subtítulo inline del header (ej. "Método de envío") */
.form-subhead {
  font-size: var(--text-12);
  font-weight: 500;
  color: var(--color-ink-muted);
}

.step-pill {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--color-violet-50);
  color: var(--color-violet-700);
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.form-section-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

.form-row-3 { grid-template-columns: 2fr 1fr 1fr; }

/* Entrega: field control (Entrega + método + pill) y field input alineados por su base */
.form-row-envio {
  grid-template-columns: auto 1fr;
  align-items: end;
}
.form-row-envio .segmented {
  width: auto;
  align-self: center;
}
.envio-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.envio-head h4 {
  font-size: 16px;
  color: var(--color-ink);
  font-weight: 500;
  letter-spacing: -0.005em;
}

/* marca de inicio de la tabla de productos */
.th-producto {
  font-weight: 700;
  color: var(--color-ink);
}

.date-input { padding-left: 36px; }


.money-wrap { position: relative; }
.money-prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-ink-muted);
  font-size: 13px;
  pointer-events: none;
}

.money-input {
  padding-left: 22px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.add-line-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: var(--color-surface);
  border: 0;
  border-top: 1px dashed var(--color-border-strong);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-violet-700);
  cursor: pointer;
  text-align: left;
}
.add-line-btn:hover { background: var(--color-violet-50); }
.add-line-btn svg { width: 14px; height: 14px; }

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
  color: var(--color-ink-muted);
}

.ed-totals .r.grand {
  border-top: 1px solid var(--color-border-strong);
  margin-top: 8px;
  padding-top: 12px;
  font-size: 24px;
  font-weight: 500;
  color: var(--color-ink);
  letter-spacing: -0.01em;
}

.ed-totals .r.grand .v { color: var(--color-violet-700); }

.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 400;
  color: var(--color-ink);
  cursor: pointer;
}

.check-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-teal-500);
  cursor: pointer;
}

.editor-foot {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 14px 28px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  position: relative;
  z-index: 5;
}

.editor-foot-left {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 28px;
  border-right: 1px solid var(--color-border);
}

.editor-foot-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-foot-right .btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-ink-muted);
  text-align: center;
}

.preview-empty svg {
  width: 44px;
  height: 44px;
  opacity: 0.45;
  margin-bottom: 6px;
  color: var(--color-violet-700);
}

.preview-empty p {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-ink);
  margin: 0;
}

.preview-empty small { font-size: 12px; color: var(--color-ink-muted); }

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
