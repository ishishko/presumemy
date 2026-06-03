<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Send, Plus, Trash2, X } from '@lucide/vue'
import { get, post, put } from '@/services/api'
import { useToast } from '@/composables/useToast'
import type { Presupuesto, Cliente, Producto, PaginationResult } from '@/types'
import { presupuestoSchema } from '@/schemas/presupuestos'

const props = defineProps<{
  open: boolean
  presupuesto?: Presupuesto | null
}>()

const emit = defineEmits<{
  close: []
  saved: [presupuesto: Presupuesto]
}>()

const { toast } = useToast()

const isEdit = computed(() => !!props.presupuesto)

const clientes = ref<Cliente[]>([])
const productos = ref<Producto[]>([])

const clienteId = ref<number>(0)
const tematica = ref('')
const tipoEntrega = ref<'retira' | 'envio'>('retira')
const direccionEntrega = ref('')
const fechaEntrega = ref('')
const sena = ref(0)
const notas = ref('')
const lineas = ref<Array<{
  productoId: number
  descripcion: string
  cantidad: number
  precioUnitario: number
}>>([])

const errors = ref<Record<string, string>>({})

function money(n: number): string {
  return `$ ${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const subtotal = computed(() =>
  lineas.value.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0)
)

const iva = computed(() => subtotal.value * 0.16)
const total = computed(() => subtotal.value + iva.value)

function reset() {
  clienteId.value = 0
  tematica.value = ''
  tipoEntrega.value = 'retira'
  direccionEntrega.value = ''
  fechaEntrega.value = ''
  sena.value = 0
  notas.value = ''
  lineas.value = []
  errors.value = {}
}

function loadPresupuesto() {
  reset()
  if (props.presupuesto) {
    const p = props.presupuesto
    clienteId.value = p.clienteId
    tematica.value = p.tematica || ''
    tipoEntrega.value = p.tipoEntrega
    direccionEntrega.value = p.direccionEntrega || ''
    fechaEntrega.value = p.fechaEntrega ? p.fechaEntrega.slice(0, 16) : ''
    sena.value = p.sena || 0
    notas.value = p.notas || ''
    lineas.value = (p.detalles || []).map(d => ({
      productoId: d.productoId,
      descripcion: d.descripcion,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
    }))
  }
  if (lineas.value.length === 0) {
    addLinea()
  }
}

function addLinea() {
  const firstProduct = productos.value[0]
  lineas.value.push({
    productoId: firstProduct?.id || 0,
    descripcion: firstProduct?.nombre || '',
    cantidad: 1,
    precioUnitario: firstProduct?.precio || 0,
  })
}

function removeLinea(idx: number) {
  lineas.value.splice(idx, 1)
  if (lineas.value.length === 0) addLinea()
}

function onProductoChange(idx: number, productoId: number) {
  const p = productos.value.find(p => p.id === productoId)
  if (p) {
    lineas.value[idx].productoId = p.id
    lineas.value[idx].descripcion = p.nombre
    lineas.value[idx].precioUnitario = p.precio
  }
}

function validate(): boolean {
  const result = presupuestoSchema.safeParse({
    clienteId: clienteId.value,
    tematica: tematica.value,
    tipoEntrega: tipoEntrega.value,
    direccionEntrega: direccionEntrega.value,
    fechaEntrega: fechaEntrega.value ? new Date(fechaEntrega.value).toISOString() : undefined,
    sena: sena.value,
    notas: notas.value,
    detalles: lineas.value.filter(l => l.productoId && l.cantidad > 0),
  })
  if (!result.success) {
    errors.value = {}
    result.error.issues.forEach((e: any) => {
      errors.value[e.path.join('.')] = e.message
    })
    return false
  }
  errors.value = {}
  return true
}

async function handleSave(action: 'borrador' | 'enviado') {
  if (!validate()) return

  const detalles = lineas.value
    .filter(l => l.productoId && l.cantidad > 0)
    .map(l => ({
      productoId: l.productoId,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
    }))

  const payload: any = {
    clienteId: clienteId.value,
    tematica: tematica.value,
    tipoEntrega: tipoEntrega.value,
    direccionEntrega: direccionEntrega.value,
    fechaEntrega: fechaEntrega.value ? new Date(fechaEntrega.value).toISOString() : undefined,
    sena: sena.value,
    notas: notas.value,
    detalles,
  }

  try {
    let res: Presupuesto
    if (isEdit.value && props.presupuesto) {
      res = await put<Presupuesto>('/presupuestos', props.presupuesto.id, payload)
      toast('Presupuesto actualizado')
    } else {
      res = await post<Presupuesto>('/presupuestos', payload)
      toast(action === 'enviado' ? 'Presupuesto enviado' : 'Borrador guardado')
    }

    if (action === 'enviado' && !isEdit.value) {
      await put<Presupuesto>('/presupuestos/estado', res.id, { estado: 'enviado' })
    }

    emit('saved', res)
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al guardar', 'error')
  }
}

onMounted(async () => {
  try {
    const [clientesRes, productosRes] = await Promise.all([
      get<PaginationResult<Cliente>>('/clientes', { page: 1, limit: 200 }),
      get<PaginationResult<Producto>>('/productos', { page: 1, limit: 200 }),
    ])
    clientes.value = clientesRes.data
    productos.value = productosRes.data
  } catch (e: any) {
    toast('Error al cargar datos', 'error')
  }
})

watch(() => props.open, (open) => {
  if (open) loadPresupuesto()
})

defineExpose({ loadPresupuesto })
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer-container">
        <div class="drawer-scrim" @click="emit('close')"></div>
        <aside class="drawer-panel">
          <div class="drawer-head">
            <div class="drawer-title-block">
              <span class="drawer-eyebrow">{{ isEdit ? presupuesto!.folio : 'Nuevo presupuesto' }}</span>
              <h3>{{ isEdit ? 'Editar presupuesto' : 'Crear presupuesto' }}</h3>
            </div>
            <div class="spacer"></div>
            <button class="icon-btn" @click="emit('close')" title="Cerrar">
              <X :size="18" />
            </button>
          </div>

          <div class="drawer-body">
            <div class="grid-2" style="margin-bottom: 18px">
              <div class="field" :class="{ 'field-error': errors.clienteId }">
                <label>Cliente</label>
                <select class="select" v-model.number="clienteId">
                  <option :value="0" disabled>Seleccionar cliente</option>
                  <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                </select>
                <span v-if="errors.clienteId" class="field-error-msg">{{ errors.clienteId }}</span>
              </div>
              <div class="field">
                <label>Tipo de entrega</label>
                <select class="select" v-model="tipoEntrega">
                  <option value="retira">Retira</option>
                  <option value="envio">Envio</option>
                </select>
              </div>
            </div>

            <div class="grid-2" style="margin-bottom: 18px">
              <div class="field">
                <label>Temática</label>
                <input class="input" v-model="tematica" placeholder="Ej. Cumple Mila · unicornios" />
              </div>
              <div class="field">
                <label>Fecha de entrega</label>
                <input class="input" type="datetime-local" v-model="fechaEntrega" />
              </div>
            </div>

            <div v-if="tipoEntrega === 'envio'" class="field" style="margin-bottom: 18px">
              <label>Dirección de entrega</label>
              <input class="input" v-model="direccionEntrega" placeholder="Calle, número, localidad" />
            </div>

            <div style="display: flex; alignItems: center; justifyContent: space-between; marginBottom: 8">
              <span class="label">Líneas del presupuesto</span>
              <button class="btn btn-ghost btn-sm" @click="addLinea">
                <Plus :size="14" /> Agregar línea
              </button>
            </div>

            <div class="line-items">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="width: 60px" class="num">Cant.</th>
                    <th style="width: 100px" class="num">Precio</th>
                    <th style="width: 100px" class="num">Subtotal</th>
                    <th style="width: 32px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(l, idx) in lineas" :key="idx">
                    <td>
                      <select
                        class="cell-input"
                        :value="l.productoId"
                        @change="onProductoChange(idx, +($event.target as HTMLSelectElement).value)"
                      >
                        <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                      </select>
                    </td>
                    <td>
                      <input
                        class="cell-input num-input"
                        type="number"
                        min="1"
                        v-model.number="l.cantidad"
                      />
                    </td>
                    <td>
                      <input
                        class="cell-input num-input"
                        type="number"
                        min="0"
                        step="0.01"
                        v-model.number="l.precioUnitario"
                      />
                    </td>
                    <td class="num" style="font-weight: 500; font-variant-numeric: tabular-nums">
                      {{ money(l.cantidad * l.precioUnitario) }}
                    </td>
                    <td>
                      <button
                        class="del-line-btn"
                        @click="removeLinea(idx)"
                        title="Eliminar línea"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="totals">
              <div class="row"><span>Subtotal</span><span>{{ money(subtotal) }}</span></div>
              <div class="row"><span style="color: var(--ink-muted)">IVA (16%)</span><span>{{ money(iva) }}</span></div>
              <div class="row grand"><span>Total</span><span class="v">{{ money(total) }}</span></div>
            </div>

            <div class="grid-2" style="margin-top: 18px">
              <div class="field">
                <label>Seña</label>
                <input class="input" type="number" min="0" step="0.01" v-model.number="sena" />
              </div>
            </div>

            <div class="field" style="margin-top: 18px">
              <label>Notas para el cliente</label>
              <textarea
                class="textarea"
                v-model="notas"
                placeholder="Ej. Entrega el 30 de mayo en la mañana. Incluye montaje."
                rows="3"
              />
            </div>
          </div>

          <div class="drawer-foot">
            <button class="btn btn-ghost" @click="emit('close')">Cancelar</button>
            <button class="btn btn-secondary" @click="handleSave('borrador')">Guardar borrador</button>
            <button class="btn btn-primary" @click="handleSave('enviado')">
              <Send :size="16" /> Enviar
            </button>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-container {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}

.drawer-scrim {
  position: absolute;
  inset: 0;
  background: rgba(28, 26, 30, 0.40);
  pointer-events: auto;
}

.drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 560px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: grid;
  grid-template-rows: auto 1fr auto;
  pointer-events: auto;
  box-shadow: var(--shadow-2);
}

.drawer-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}

.drawer-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.drawer-eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  font-weight: 500;
}

.drawer-head h3 {
  font-size: 17px;
  font-weight: 500;
  margin: 0;
  line-height: 1.2;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px;
}

.drawer-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--border);
  justify-content: flex-end;
}

.spacer { flex: 1; }

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field-error .input,
.field-error .select,
.field-error .textarea {
  border-color: var(--coral-500);
}

.field-error-msg {
  font-size: 12px;
  color: var(--coral-500);
  margin-top: 4px;
}

.del-line-btn {
  background: transparent;
  border: 0;
  color: var(--ink-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: grid;
  place-items: center;
}

.del-line-btn:hover { color: var(--coral-500); background: var(--coral-50); }

/* Transitions */
.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}

.drawer-enter-active .drawer-scrim,
.drawer-leave-active .drawer-scrim {
  transition: opacity 220ms ease;
}

.drawer-enter-from .drawer-scrim,
.drawer-leave-to .drawer-scrim {
  opacity: 0;
}
</style>
