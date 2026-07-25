<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check, X } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useToast } from '@/shared/lib/useToast'
import { useFinanzasStore } from '../store'
import { usePresupuestosStore } from '@/modules/presupuestos'
import { formatMoney } from '@/shared/lib/format'
import type { Transaccion } from '../types'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FloatingField from '@/shared/ui/FloatingField.vue'
import FloatingSelect from '@/shared/ui/FloatingSelect.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'

const props = defineProps<{
  open: boolean
  transaccion?: Transaccion | null
}>()

const emit = defineEmits<{
  close: []
  saved: [transaccion: Transaccion]
}>()

const { toast } = useToast()

const isEdit = computed(() => !!props.transaccion)

const fecha = ref(new Date().toISOString().slice(0, 10))
const tipo = ref('venta_producto')
const cuenta = ref<Transaccion['cuenta']>('banco')
const signo = ref<'in' | 'out'>('in')
const valor = ref(0)
const detalle = ref('')
const nroFactura = ref('')
const presupuestoId = ref('')

const store = useFinanzasStore()
const presupuestosStore = usePresupuestosStore()
const { data: presupuestos } = storeToRefs(presupuestosStore)

const tipoMovs = [
  { id: 'venta_producto', label: 'Venta producto', sign: 1 },
  { id: 'venta_presupuesto', label: 'Venta presupuesto', sign: 1 },
  { id: 'cobro_cliente', label: 'Cobro cliente', sign: 1 },
  { id: 'compra_insumo', label: 'Compra insumo', sign: -1 },
  { id: 'pago_servicio', label: 'Pago servicio', sign: -1 },
  { id: 'pago_imprenta', label: 'Pago imprenta', sign: -1 },
  { id: 'pago_alquiler', label: 'Pago alquiler', sign: -1 },
  { id: 'pago_sueldo', label: 'Pago sueldo', sign: -1 },
  { id: 'retiro_socio', label: 'Retiro socio', sign: -1 },
  { id: 'deposito', label: 'Deposito', sign: 1 },
  { id: 'ajuste_positivo', label: 'Ajuste positivo', sign: 1 },
  { id: 'ajuste_negativo', label: 'Ajuste negativo', sign: -1 },
]

const cuentas = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'banco', label: 'Banco' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'billetera', label: 'Billetera' },
]

const TIPOS_EGRESO = [
  'compra_insumo', 'pago_servicio', 'pago_imprenta',
  'pago_alquiler', 'pago_sueldo', 'retiro_socio', 'ajuste_negativo'
]

function esEgreso(t: string): boolean {
  return TIPOS_EGRESO.includes(t)
}

const tipoMeta = computed(() => tipoMovs.find(t => t.id === tipo.value))
const monto = computed(() => parseFloat(String(valor.value)) || 0)

const moneyAbs = computed(() => {
  return formatMoney(parseFloat(String(valor.value)) || 0)
})

const showConfirmExit = ref(false)

const dirty = computed(() => {
  if (isEdit.value) {
    if (!props.transaccion) return false
    const t = props.transaccion
    return (
      fecha.value !== t.fecha.slice(0, 10) ||
      tipo.value !== t.tipo ||
      cuenta.value !== t.cuenta ||
      signo.value !== (esEgreso(t.tipo) ? 'out' : 'in') ||
      Number(valor.value) !== Number(t.monto) ||
      detalle.value !== (t.detalle || '') ||
      nroFactura.value !== (t.nroFactura || '') ||
      presupuestoId.value !== (t.presupuestoId ? String(t.presupuestoId) : '')
    )
  } else {
    return (
      fecha.value !== new Date().toISOString().slice(0, 10) ||
      tipo.value !== 'venta_producto' ||
      cuenta.value !== 'banco' ||
      signo.value !== 'in' ||
      Number(valor.value) !== 0 ||
      detalle.value !== '' ||
      nroFactura.value !== '' ||
      presupuestoId.value !== ''
    )
  }
})

function handleClose() {
  if (dirty.value) {
    showConfirmExit.value = true
  } else {
    emit('close')
  }
}

function reset() {
  fecha.value = new Date().toISOString().slice(0, 10)
  tipo.value = 'venta_producto'
  cuenta.value = 'banco'
  signo.value = 'in'
  valor.value = 0
  detalle.value = ''
  nroFactura.value = ''
  presupuestoId.value = ''
}

function loadTransaccion() {
  reset()
  if (props.transaccion) {
    const t = props.transaccion
    fecha.value = t.fecha.slice(0, 10)
    tipo.value = t.tipo
    cuenta.value = t.cuenta
    signo.value = esEgreso(t.tipo) ? 'out' : 'in'
    valor.value = Number(t.monto)
    detalle.value = t.detalle || ''
    nroFactura.value = t.nroFactura || ''
    presupuestoId.value = t.presupuestoId ? String(t.presupuestoId) : ''
  }
}

function validate(): boolean {
  if (!(Number(valor.value) > 0)) {
    toast('El valor debe ser mayor a 0', 'error')
    return false
  }
  return true
}

async function handleSave() {
  if (!validate()) return

  const payload: any = {
    fecha: fecha.value,
    tipo: tipo.value,
    cuenta: cuenta.value,
    monto: monto.value,
    detalle: detalle.value,
    nroFactura: nroFactura.value || undefined,
    presupuestoId: presupuestoId.value ? parseInt(presupuestoId.value) : undefined,
  }

  try {
    let res: Transaccion
    if (isEdit.value && props.transaccion) {
      res = await store.updateTransaccion(props.transaccion.id, payload)
      toast('Movimiento actualizado')
    } else {
      res = await store.createTransaccion(payload)
      toast('Movimiento creado')
    }
    emit('saved', res)
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al guardar', 'error')
  }
}

watch(() => tipo.value, (val) => {
  signo.value = esEgreso(val) ? 'out' : 'in'
})

watch(() => props.open, (open) => {
  if (open) loadTransaccion()
})

watch(() => props.open, async (open) => {
  if (open && presupuestos.value.length === 0) {
    try {
      await presupuestosStore.fetch()
    } catch {
      toast('Error al cargar presupuestos', 'error')
    }
  }
})

defineExpose({ loadTransaccion })
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="fixed inset-0 z-80 pointer-events-none">
        <!-- Scrim -->
        <div class="absolute inset-0 bg-ink/40 pointer-events-auto" @click="handleClose"></div>
        
        <!-- Panel -->
        <aside class="absolute top-0 right-0 bottom-0 w-[520px] bg-surface border-l border-border grid grid-rows-[auto_1fr_auto] pointer-events-auto shadow-2 z-81">
          <!-- Header -->
          <div class="flex items-center gap-3.5 px-5.5 py-4.5 border-b border-border">
            <div class="flex flex-col gap-1 flex-1 min-w-0">
              <span class="text-11 uppercase tracking-[0.08em] text-ink-muted font-medium">{{ isEdit ? 'Editar movimiento' : 'Nuevo movimiento' }}</span>
              <h3 class="text-[17px] font-medium m-0 leading-tight">{{ tipoMeta?.label || 'Movimiento' }}</h3>
            </div>
            <button class="w-8.5 h-8.5 grid place-items-center border border-border bg-surface rounded-lg text-ink cursor-pointer hover:bg-page-bg" @click="handleClose" title="Cerrar">
              <X :size="18" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-5.5">
            <div class="flex gap-3 mb-3">
              <div class="field flex-1 min-w-0">
                <FloatingField
                  id="fd-m-fecha"
                  label="Fecha"
                  type="date"
                  always-float
                  v-model="fecha"
                />
              </div>
              <div class="field flex-1 min-w-0">
                <FloatingSelect id="fd-m-cuenta" label="Cuenta" v-model="cuenta">
                  <option v-for="c in cuentas" :key="c.id" :value="c.id">{{ c.label }}</option>
                </FloatingSelect>
              </div>
            </div>

            <div class="flex flex-col mb-3">
              <div class="field">
                <FloatingSelect id="fd-m-tipo" label="Tipo de movimiento" v-model="tipo">
                  <option v-for="t in tipoMovs" :key="t.id" :value="t.id">{{ t.label }}</option>
                </FloatingSelect>
              </div>
            </div>

            <div class="flex flex-col mb-3">
              <div class="field">
                <label class="text-13 font-medium text-ink mb-1.5 block">Valor</label>
                <div class="flex gap-1.5 mb-2" role="group" aria-label="Signo">
                  <button
                    type="button"
                    class="flex-1 py-2 px-3 border border-border-strong rounded-lg bg-page-bg text-ink-muted text-13 font-medium cursor-pointer transition-colors duration-120 hover:text-ink"
                    :class="{ 'bg-teal-50! text-teal-700! border-teal-500!': signo === 'in' }"
                    @click="signo = 'in'"
                  >+ Ingreso</button>
                  <button
                    type="button"
                    class="flex-1 py-2 px-3 border border-border-strong rounded-lg bg-page-bg text-ink-muted text-13 font-medium cursor-pointer transition-colors duration-120 hover:text-ink"
                    :class="{ 'bg-coral-50! text-coral-500! border-coral-500!': signo === 'out' }"
                    @click="signo = 'out'"
                  >− Egreso</button>
                </div>
                <input
                  class="w-full font-sans text-20 font-medium text-right px-4 py-3 border border-border-strong rounded-lg bg-surface focus:outline-none focus:border-teal-500 focus:shadow-focus-ring"
                  :class="[signo === 'in' ? 'text-teal-700!' : 'text-coral-500!']"
                  type="number"
                  min="0"
                  step="0.01"
                  v-model.number="valor"
                  placeholder="0"
                />
                <span class="block text-12 text-ink-muted mt-1.5">
                  Equivale a {{ signo === 'in' ? '+ ' : '− ' }}{{ moneyAbs }} en la cuenta {{ cuentas.find(c => c.id === cuenta)?.label }}.
                </span>
              </div>
            </div>

            <div class="flex flex-col mb-3">
              <div class="field">
                <FloatingField
                  id="fd-m-detalle"
                  label="Detalle"
                  multiline
                  v-model="detalle"
                  placeholder="Ej. cobro presupuesto P-1024 · Marisol Aguirre"
                />
              </div>
            </div>

            <div class="flex gap-3 mb-3">
              <div class="field flex-1 min-w-0">
                <FloatingField
                  id="fd-m-nrofactura"
                  label="Nro. de factura"
                  v-model="nroFactura"
                  placeholder="Opcional"
                />
              </div>
              <div class="field flex-1 min-w-0">
                <FloatingField
                  id="fd-m-presupuesto"
                  label="Presupuesto"
                  v-model="presupuestoId"
                  placeholder="P-1024 (opcional)"
                  list="fd-presupuestos"
                />
                <datalist id="fd-presupuestos">
                  <option v-for="p in presupuestos" :key="p.id" :value="p.folio" />
                </datalist>
              </div>
            </div>

            <div class="bg-page-bg border border-border rounded-lg p-3.5 mt-4.5 flex flex-col gap-2">
              <div class="flex justify-between text-13">
                <span class="text-ink-muted">Tipo</span>
                <span class="font-medium">{{ tipoMeta?.label }}</span>
              </div>
              <div class="flex justify-between text-13">
                <span class="text-ink-muted">Cuenta</span>
                <span class="font-medium">{{ cuentas.find(c => c.id === cuenta)?.label }}</span>
              </div>
              <div class="flex justify-between text-13 border-t border-border pt-2 mt-1 font-semibold">
                <span>Impacto</span>
                <span :class="[signo === 'in' ? 'text-teal-700!' : 'text-coral-500!']">
                  {{ signo === 'in' ? '+ ' : '− ' }}{{ moneyAbs }}
                </span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center gap-2.5 px-5.5 py-3.5 border-t border-border justify-end">
            <BaseButton variant="ghost" @click="handleClose">Cancelar</BaseButton>
            <BaseButton variant="primary" @click="handleSave">
              <Check :size="16" /> Guardar
            </BaseButton>
          </div>
        </aside>

        <ConfirmDialog
          :open="showConfirmExit"
          title="¿Salir sin guardar?"
          message="Tenés cambios pendientes en este movimiento. Si salís ahora, vas a perderlos."
          confirm-label="Salir sin guardar"
          cancel-label="Seguir editando"
          variant="danger"
          @confirm="emit('close'); showConfirmExit = false"
          @cancel="showConfirmExit = false"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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

