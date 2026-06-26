<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check } from '@lucide/vue'
import { post, put, get } from '@/shared/api/client'
import { useToast } from '@/shared/lib/useToast'
import type { OrdenImprenta, Presupuesto, PaginationResult } from '@/types'
import DrawerShell from '@/shared/ui/DrawerShell.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FloatingField from '@/shared/ui/FloatingField.vue'
import FloatingSelect from '@/shared/ui/FloatingSelect.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'

const props = defineProps<{
  open: boolean
  orden?: OrdenImprenta | null
}>()

const emit = defineEmits<{
  close: []
  saved: [orden: OrdenImprenta]
}>()

const { toast } = useToast()

const isEdit = computed(() => !!props.orden)

const fecha = ref(new Date().toISOString().slice(0, 10))
const presupuestoId = ref('')
const tematica = ref('')
const hojas = ref(0)
const tipoHoja = ref('Opalina A4 220 g')
const valorNuestro = ref(0)
const valorPatri = ref(0)
const metodoPago = ref('transferencia')
const pagado = ref(false)

const presupuestos = ref<Presupuesto[]>([])

const metodosPago = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'mercado_pago', label: 'Mercado Pago' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'cheque', label: 'Cheque' },
]

const diff = computed(() => (parseFloat(String(valorNuestro.value)) || 0) - (parseFloat(String(valorPatri.value)) || 0))

function money(n: number): string {
  return `$ ${Math.abs(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function reset() {
  fecha.value = new Date().toISOString().slice(0, 10)
  presupuestoId.value = ''
  tematica.value = ''
  hojas.value = 0
  tipoHoja.value = 'Opalina A4 220 g'
  valorNuestro.value = 0
  valorPatri.value = 0
  metodoPago.value = 'transferencia'
  pagado.value = false
}

function loadOrden() {
  reset()
  if (props.orden) {
    const o = props.orden
    fecha.value = o.fecha.slice(0, 10)
    presupuestoId.value = o.presupuestoId ? String(o.presupuestoId) : ''
    tematica.value = o.tematica || ''
    hojas.value = o.hojas
    tipoHoja.value = o.tipoHoja
    valorNuestro.value = o.valorUnitario
    valorPatri.value = o.valorTotal
    metodoPago.value = o.metodoPago
    pagado.value = o.pagado
  }
}

function validate(): boolean {
  if (!tematica.value.trim()) {
    toast('Indicá una temática o cliente', 'error')
    return false
  }
  if (Number(hojas.value) < 0 || Number(valorNuestro.value) < 0 || Number(valorPatri.value) < 0) {
    toast('Los valores no pueden ser negativos', 'error')
    return false
  }
  return true
}

async function handleSave() {
  if (!validate()) return

  const payload: any = {
    fecha: fecha.value,
    tematica: tematica.value,
    hojas: parseInt(String(hojas.value)) || 0,
    tipoHoja: tipoHoja.value,
    valorUnitario: parseFloat(String(valorNuestro.value)) || 0,
    valorTotal: parseFloat(String(valorPatri.value)) || 0,
    metodoPago: metodoPago.value,
    pagado: pagado.value,
    diferencia: diff.value,
  }

  if (presupuestoId.value) {
    payload.presupuestoId = parseInt(presupuestoId.value)
  }

  try {
    let res: OrdenImprenta
    if (isEdit.value && props.orden) {
      res = await put<OrdenImprenta>('/finanzas/ordenes-imprenta', props.orden.id, payload)
      toast('Orden actualizada')
    } else {
      res = await post<OrdenImprenta>('/finanzas/ordenes-imprenta', payload)
      toast('Orden creada')
    }
    emit('saved', res)
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al guardar', 'error')
  }
}

watch(() => props.open, (open) => {
  if (open) loadOrden()
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

const showConfirmExit = ref(false)

const dirty = computed(() => {
  if (isEdit.value) {
    if (!props.orden) return false
    const o = props.orden
    return (
      fecha.value !== o.fecha.slice(0, 10) ||
      presupuestoId.value !== (o.presupuestoId ? String(o.presupuestoId) : '') ||
      tematica.value !== (o.tematica || '') ||
      Number(hojas.value) !== o.hojas ||
      tipoHoja.value !== o.tipoHoja ||
      Number(valorNuestro.value) !== o.valorUnitario ||
      Number(valorPatri.value) !== o.valorTotal ||
      metodoPago.value !== o.metodoPago ||
      pagado.value !== o.pagado
    )
  } else {
    return (
      fecha.value !== new Date().toISOString().slice(0, 10) ||
      presupuestoId.value !== '' ||
      tematica.value !== '' ||
      Number(hojas.value) !== 0 ||
      tipoHoja.value !== 'Opalina A4 220 g' ||
      Number(valorNuestro.value) !== 0 ||
      Number(valorPatri.value) !== 0 ||
      metodoPago.value !== 'transferencia' ||
      pagado.value !== false
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

defineExpose({ loadOrden })
</script>

<template>
  <DrawerShell
    :open="open"
    :title="tematica || 'Orden sin temática'"
    :eyebrow="isEdit ? 'Editar orden' : 'Nueva orden de imprenta'"
    @close="handleClose"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex gap-3">
          <div class="flex-1">
            <FloatingField
              id="fd-i-fecha"
              label="Fecha"
              type="date"
              always-float
              v-model="fecha"
            />
          </div>
          <div class="flex-1">
            <FloatingField
              id="fd-i-presupuesto"
              label="Presupuesto"
              v-model="presupuestoId"
              placeholder="P-1024 (opcional)"
              list="fd-presupuestos-i"
            />
            <datalist id="fd-presupuestos-i">
              <option v-for="p in presupuestos" :key="p.id" :value="p.folio" />
            </datalist>
          </div>
        </div>

        <div>
          <FloatingField
            id="fd-i-tematica"
            label="Temática / cliente"
            required
            v-model="tematica"
            placeholder="Ej. Cumple Mila · unicornios pastel"
          />
        </div>

        <div class="flex gap-3">
          <div class="flex-1">
            <FloatingField
              id="fd-i-hojas"
              label="Cantidad de hojas"
              type="number"
              v-model.number="hojas"
              min="0"
              step="1"
            />
          </div>
          <div class="flex-1">
            <FloatingField
              id="fd-i-tipohoja"
              label="Tipo de hoja"
              v-model="tipoHoja"
              placeholder="Opalina A4 220 g"
            />
          </div>
        </div>

        <div class="text-11 uppercase tracking-[0.06em] text-ink-muted font-medium mt-3 pb-1 border-b border-border">Valores</div>

        <div class="flex gap-3">
          <div class="flex-1">
            <FloatingField
              id="fd-i-valornuestro"
              label="Valor nuestro"
              type="number"
              prefix="$"
              v-model.number="valorNuestro"
              :invalid="Number(valorNuestro) < 0"
              min="0"
              step="0.01"
            />
          </div>
          <div class="flex-1">
            <FloatingField
              id="fd-i-valorpatri"
              label="Valor Patri"
              type="number"
              prefix="$"
              v-model.number="valorPatri"
              :invalid="Number(valorPatri) < 0"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div class="bg-page-bg border border-border rounded-md p-4 flex flex-col gap-2 select-none">
          <div class="flex justify-between text-13 text-ink">
            <span class="text-ink-muted">Valor nuestro</span>
            <span class="font-mono tabular-nums">{{ money(valorNuestro) }}</span>
          </div>
          <div class="flex justify-between text-13 text-ink">
            <span class="text-ink-muted">Valor Patri</span>
            <span class="font-mono tabular-nums">{{ money(valorPatri) }}</span>
          </div>
          <div class="flex justify-between border-t border-border pt-2 mt-1 text-13 font-medium text-ink">
            <span>Diferencia</span>
            <span
              class="font-mono tabular-nums"
              :class="[diff >= 0 ? 'text-teal-700' : 'text-coral-500']"
            >
              {{ diff >= 0 ? '+ ' : '− ' }}{{ money(diff) }}
            </span>
          </div>
        </div>

        <div class="text-11 uppercase tracking-[0.06em] text-ink-muted font-medium mt-3 pb-1 border-b border-border">Pago</div>

        <div class="flex gap-3 items-start">
          <div class="flex-1">
            <FloatingSelect
              id="fd-i-metodopago"
              label="Método de pago"
              v-model="metodoPago"
            >
              <option v-for="m in metodosPago" :key="m.id" :value="m.id">{{ m.label }}</option>
            </FloatingSelect>
          </div>
          <div class="flex-1 flex flex-col gap-1">
            <label class="text-11 font-medium uppercase tracking-[0.06em] text-ink-muted select-none">Estado</label>
            <label class="flex gap-2.5 items-start cursor-pointer mt-1">
              <input
                type="checkbox"
                v-model="pagado"
                class="mt-1 accent-violet-700 w-4 h-4"
              />
              <div class="flex flex-col gap-0.5">
                <span class="text-13 font-medium text-ink">Pagado a la imprenta</span>
                <span class="text-11 text-ink-muted">{{ pagado ? 'Registrado como pagado.' : 'Pendiente de pago.' }}</span>
              </div>
            </label>
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
    message="Tenés cambios pendientes en esta orden. Si salís ahora, vas a perderlos."
    confirm-label="Salir sin guardar"
    cancel-label="Seguir editando"
    variant="danger"
    @confirm="emit('close'); showConfirmExit = false"
    @cancel="showConfirmExit = false"
  />
</template>
