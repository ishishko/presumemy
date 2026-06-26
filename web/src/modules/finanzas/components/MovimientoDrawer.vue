<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check } from '@lucide/vue'
import { post, put, get } from '@/shared/api/client'
import { useToast } from '@/shared/lib/useToast'
import type { Transaccion, Presupuesto, PaginationResult } from '@/types'
import DrawerShell from '@/shared/ui/DrawerShell.vue'
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

const presupuestos = ref<Presupuesto[]>([])

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
  { id: 'deposito', label: 'Depósito', sign: 1 },
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
  return `$ ${(parseFloat(String(valor.value)) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
      res = await put<Transaccion>('/finanzas', props.transaccion.id, payload)
      toast('Movimiento actualizado')
    } else {
      res = await post<Transaccion>('/finanzas', payload)
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
      const res = await get<PaginationResult<Presupuesto>>('/presupuestos', { page: 1, limit: 100 })
      presupuestos.value = res.data
    } catch (e: any) {
      toast('Error al cargar presupuestos', 'error')
    }
  }
})

defineExpose({ loadTransaccion })
</script>

<template>
  <DrawerShell
    :open="open"
    :title="tipoMeta?.label || 'Movimiento'"
    :eyebrow="isEdit ? 'Editar movimiento' : 'Nuevo movimiento'"
    @close="handleClose"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex gap-3">
          <div class="flex-1">
            <FloatingField
              id="fd-m-fecha"
              label="Fecha"
              type="date"
              always-float
              v-model="fecha"
            />
          </div>
          <div class="flex-1">
            <FloatingSelect id="fd-m-cuenta" label="Cuenta" v-model="cuenta">
              <option v-for="c in cuentas" :key="c.id" :value="c.id">{{ c.label }}</option>
            </FloatingSelect>
          </div>
        </div>

        <div>
          <FloatingSelect id="fd-m-tipo" label="Tipo de movimiento" v-model="tipo">
            <option v-for="t in tipoMovs" :key="t.id" :value="t.id">{{ t.label }}</option>
          </FloatingSelect>
        </div>

        <div>
          <label class="text-11 font-medium uppercase tracking-[0.06em] text-ink-muted mb-2 block">Valor</label>
          <div class="flex gap-1 mb-2 select-none" role="group" aria-label="Signo">
            <button
              type="button"
              class="flex-1 py-2 px-3 border border-border-strong rounded-lg bg-page-bg text-ink-muted text-13 font-medium cursor-pointer transition-all duration-120 hover:bg-page-bg/80"
              :class="[signo === 'in' ? 'bg-teal-100! text-teal-700! border-teal-500!' : '']"
              @click="signo = 'in'"
            >+ Ingreso</button>
            <button
              type="button"
              class="flex-1 py-2 px-3 border border-border-strong rounded-lg bg-page-bg text-ink-muted text-13 font-medium cursor-pointer transition-all duration-120 hover:bg-page-bg/80"
              :class="[signo === 'out' ? 'bg-coral-50! text-coral-500! border-coral-500!' : '']"
              @click="signo = 'out'"
            >− Egreso</button>
          </div>
          <input
            class="w-full font-sans text-20 font-medium text-right tabular-nums px-4 py-3 border border-border-strong rounded-md bg-surface outline-none focus:border-teal-500"
            :class="[signo === 'in' ? 'text-teal-700' : 'text-coral-500']"
            type="number"
            min="0"
            step="0.01"
            v-model.number="valor"
            placeholder="0"
          />
          <span class="block text-12 text-ink-muted mt-1.5 select-none">
            Equivale a {{ signo === 'in' ? '+ ' : '− ' }}{{ moneyAbs }} en la cuenta {{ cuentas.find(c => c.id === cuenta)?.label }}.
          </span>
        </div>

        <div>
          <FloatingField
            id="fd-m-detalle"
            label="Detalle"
            multiline
            v-model="detalle"
            placeholder="Ej. cobro presupuesto P-1024 · Marisol Aguirre"
          />
        </div>

        <div class="flex gap-3">
          <div class="flex-1">
            <FloatingField
              id="fd-m-nrofactura"
              label="Nro. de factura"
              v-model="nroFactura"
              placeholder="Opcional"
            />
          </div>
          <div class="flex-1">
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

        <div class="bg-page-bg border border-border rounded-md p-4 flex flex-col gap-2 select-none mt-2">
          <div class="flex justify-between text-13 text-ink">
            <span class="text-ink-muted">Tipo</span>
            <span>{{ tipoMeta?.label }}</span>
          </div>
          <div class="flex justify-between text-13 text-ink">
            <span class="text-ink-muted">Cuenta</span>
            <span>{{ cuentas.find(c => c.id === cuenta)?.label }}</span>
          </div>
          <div class="flex justify-between border-t border-border pt-2 mt-1 text-13 font-medium text-ink">
            <span>Impacto</span>
            <span :class="[signo === 'in' ? 'text-teal-700' : 'text-coral-500']">
              {{ signo === 'in' ? '+ ' : '− ' }}{{ moneyAbs }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #foot>
      <BaseButton variant="ghost" @click="handleClose">Cancelar</BaseButton>
      <BaseButton variant="primary" @click="handleSave">
        <Check :size="16" /> Guardar
      </BaseButton>
    </template>
  </DrawerShell>

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
</template>
