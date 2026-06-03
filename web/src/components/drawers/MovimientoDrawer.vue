<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check, X } from '@lucide/vue'
import { post, put, get } from '@/services/api'
import { useToast } from '@/composables/useToast'
import type { Transaccion, Presupuesto, PaginationResult } from '@/types'

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

const tipoMeta = computed(() => tipoMovs.find(t => t.id === tipo.value))
const monto = computed(() => (signo.value === 'in' ? 1 : -1) * (parseFloat(String(valor.value)) || 0))

function moneyAbs(): string {
  return `$ ${(parseFloat(String(valor.value)) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
    signo.value = Number(t.monto) >= 0 ? 'in' : 'out'
    valor.value = Math.abs(Number(t.monto))
    detalle.value = t.detalle || ''
    nroFactura.value = t.nroFactura || ''
    presupuestoId.value = t.presupuestoId ? String(t.presupuestoId) : ''
  }
}

async function handleSave() {
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
  const meta = tipoMovs.find(t => t.id === val)
  if (meta) signo.value = meta.sign > 0 ? 'in' : 'out'
})

watch(() => props.open, (open) => {
  if (open) loadTransaccion()
})

watch(() => props.open, async (open) => {
  if (open && presupuestos.value.length === 0) {
    try {
      const res = await get<PaginationResult<Presupuesto>>('/presupuestos', { page: 1, limit: 200 })
      presupuestos.value = res.data
    } catch (e: any) {
      toast('Error al cargar presupuestos', 'error')
    }
  }
})

defineExpose({ loadTransaccion })
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer-container">
        <div class="drawer-scrim" @click="emit('close')"></div>
        <aside class="drawer-panel">
          <div class="drawer-head">
            <div class="drawer-title-block">
              <span class="drawer-eyebrow">{{ isEdit ? 'Editar movimiento' : 'Nuevo movimiento' }}</span>
              <h3>{{ tipoMeta?.label || 'Movimiento' }}</h3>
            </div>
            <button class="icon-btn" @click="emit('close')" title="Cerrar">
              <X :size="18" />
            </button>
          </div>

          <div class="drawer-body">
            <div class="fd-row">
              <div class="field">
                <label>Fecha</label>
                <input class="input" type="date" v-model="fecha" />
              </div>
              <div class="field">
                <label>Cuenta</label>
                <select class="select" v-model="cuenta">
                  <option v-for="c in cuentas" :key="c.id" :value="c.id">{{ c.label }}</option>
                </select>
              </div>
            </div>

            <div class="fd-row single">
              <div class="field">
                <label>Tipo de movimiento</label>
                <select class="select" v-model="tipo">
                  <option v-for="t in tipoMovs" :key="t.id" :value="t.id">{{ t.label }}</option>
                </select>
              </div>
            </div>

            <div class="fd-row single">
              <div class="field">
                <label>Valor</label>
                <div class="fd-sign-toggle" role="group" aria-label="Signo">
                  <button
                    type="button"
                    :class="{ active: signo === 'in', in: true }"
                    @click="signo = 'in'"
                  >+ Ingreso</button>
                  <button
                    type="button"
                    :class="{ active: signo === 'out', out: true }"
                    @click="signo = 'out'"
                  >− Egreso</button>
                </div>
                <input
                  :class="['fd-money-input', signo === 'in' ? 'income' : 'expense']"
                  type="number"
                  min="0"
                  step="0.01"
                  v-model.number="valor"
                  placeholder="0"
                />
                <span class="hint">
                  Equivale a {{ signo === 'in' ? '+ ' : '− ' }}{{ moneyAbs }} en la cuenta {{ cuentas.find(c => c.id === cuenta)?.label }}.
                </span>
              </div>
            </div>

            <div class="fd-row single">
              <div class="field">
                <label>Detalle</label>
                <textarea
                  class="textarea"
                  v-model="detalle"
                  placeholder="Ej. cobro presupuesto P-1024 · Marisol Aguirre"
                  rows="2"
                />
              </div>
            </div>

            <div class="fd-row">
              <div class="field">
                <label>Nro. de factura</label>
                <input class="input" v-model="nroFactura" placeholder="Opcional" />
              </div>
              <div class="field">
                <label>Presupuesto</label>
                <input
                  class="input"
                  v-model="presupuestoId"
                  placeholder="P-1024 (opcional)"
                  list="fd-presupuestos"
                />
                <datalist id="fd-presupuestos">
                  <option v-for="p in presupuestos" :key="p.id" :value="p.folio" />
                </datalist>
              </div>
            </div>

            <div class="fd-summary">
              <div class="row">
                <span style="color: var(--ink-muted)">Tipo</span>
                <span>{{ tipoMeta?.label }}</span>
              </div>
              <div class="row">
                <span style="color: var(--ink-muted)">Cuenta</span>
                <span>{{ cuentas.find(c => c.id === cuenta)?.label }}</span>
              </div>
              <div class="row grand">
                <span>Impacto</span>
                <span :style="{ color: signo === 'in' ? '#2E6F70' : 'var(--coral-500)' }">
                  {{ signo === 'in' ? '+ ' : '− ' }}{{ moneyAbs }}
                </span>
              </div>
            </div>
          </div>

          <div class="drawer-foot">
            <button class="btn btn-ghost" @click="emit('close')">Cancelar</button>
            <button class="btn btn-primary" @click="handleSave">
              <Check :size="16" /> Guardar
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
  width: 520px;
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

.fd-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.fd-row.single { grid-template-columns: 1fr; }

.fd-sign-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.fd-sign-toggle button {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  background: var(--page-bg);
  color: var(--ink-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}

.fd-sign-toggle button.active.in {
  background: var(--teal-100);
  color: #2E6F70;
  border-color: var(--teal-500);
}

.fd-sign-toggle button.active.out {
  background: var(--coral-50);
  color: var(--coral-500);
  border-color: var(--coral-500);
}

.fd-money-input {
  width: 100%;
  font-family: var(--font-sans);
  font-size: 20px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  text-align: right;
  padding: 12px 16px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--ink);
}

.fd-money-input:focus {
  outline: none;
  border-color: var(--teal-500);
  box-shadow: var(--focus-ring);
}

.fd-money-input.income { color: #2E6F70; }
.fd-money-input.expense { color: var(--coral-500); }

.hint {
  display: block;
  font-size: 12px;
  color: var(--ink-muted);
  margin-top: 6px;
}

.fd-summary {
  background: var(--page-bg);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 14px 16px;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fd-summary .row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.fd-summary .row.grand {
  border-top: 1px solid var(--border);
  padding-top: 8px;
  margin-top: 4px;
  font-weight: 500;
}

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
