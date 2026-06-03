<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check, X } from '@lucide/vue'
import { post, put, get } from '@/services/api'
import { useToast } from '@/composables/useToast'
import type { OrdenImprenta, Presupuesto, PaginationResult } from '@/types'

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

async function handleSave() {
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
      const res = await get<PaginationResult<Presupuesto>>('/presupuestos', { page: 1, limit: 200 })
      presupuestos.value = res.data
    } catch (e: any) {
      toast('Error al cargar presupuestos', 'error')
    }
  }
})

defineExpose({ loadOrden })
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer-container">
        <div class="drawer-scrim" @click="emit('close')"></div>
        <aside class="drawer-panel">
          <div class="drawer-head">
            <div class="drawer-title-block">
              <span class="drawer-eyebrow">{{ isEdit ? 'Editar orden' : 'Nueva orden de imprenta' }}</span>
              <h3>{{ tematica || 'Orden sin temática' }}</h3>
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
                <label>Presupuesto</label>
                <input
                  class="input"
                  v-model="presupuestoId"
                  placeholder="P-1024 (opcional)"
                  list="fd-presupuestos-i"
                />
                <datalist id="fd-presupuestos-i">
                  <option v-for="p in presupuestos" :key="p.id" :value="p.folio" />
                </datalist>
              </div>
            </div>

            <div class="fd-row single">
              <div class="field">
                <label>Temática / cliente</label>
                <input
                  class="input"
                  v-model="tematica"
                  placeholder="Ej. Cumple Mila · unicornios pastel"
                />
              </div>
            </div>

            <div class="fd-row">
              <div class="field">
                <label>Cantidad de hojas</label>
                <input
                  class="input"
                  type="number"
                  min="0"
                  step="1"
                  v-model.number="hojas"
                  style="text-align: right; font-variant-numeric: tabular-nums"
                />
              </div>
              <div class="field">
                <label>Tipo de hoja</label>
                <input
                  class="input"
                  v-model="tipoHoja"
                  placeholder="Opalina A4 220 g"
                />
              </div>
            </div>

            <div class="fd-section-label">Valores</div>

            <div class="fd-row">
              <div class="field">
                <label>Valor nuestro</label>
                <input
                  class="fd-money-input"
                  type="number"
                  min="0"
                  step="0.01"
                  v-model.number="valorNuestro"
                />
              </div>
              <div class="field">
                <label>Valor Patri</label>
                <input
                  class="fd-money-input"
                  type="number"
                  min="0"
                  step="0.01"
                  v-model.number="valorPatri"
                />
              </div>
            </div>

            <div class="fd-summary">
              <div class="row">
                <span style="color: var(--ink-muted)">Valor nuestro</span>
                <span style="font-variant-numeric: tabular-nums">{{ money(valorNuestro) }}</span>
              </div>
              <div class="row">
                <span style="color: var(--ink-muted)">Valor Patri</span>
                <span style="font-variant-numeric: tabular-nums">{{ money(valorPatri) }}</span>
              </div>
              <div class="row grand">
                <span>Diferencia</span>
                <span :class="diff >= 0 ? 'fin-diff-pos' : 'fin-diff-neg'" style="font-size: 16px">
                  {{ diff >= 0 ? '+ ' : '− ' }}{{ money(diff) }}
                </span>
              </div>
            </div>

            <div class="fd-section-label" style="margin-top: 16px">Pago</div>

            <div class="fd-row">
              <div class="field">
                <label>Método de pago</label>
                <select class="select" v-model="metodoPago">
                  <option v-for="m in metodosPago" :key="m.id" :value="m.id">{{ m.label }}</option>
                </select>
              </div>
              <div class="field">
                <label>Estado</label>
                <label class="check-row" style="margin-top: 2px">
                  <input type="checkbox" v-model="pagado" />
                  <div class="lbl-block">
                    <span class="t">Pagado a la imprenta</span>
                    <span class="h">{{ pagado ? 'Registrado como pagado.' : 'Pendiente de pago.' }}</span>
                  </div>
                </label>
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

.fd-section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  font-weight: 500;
  margin-bottom: 10px;
}

.fd-money-input {
  width: 100%;
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

.fd-money-input:focus {
  outline: none;
  border-color: var(--teal-500);
  box-shadow: var(--focus-ring);
}

.fd-summary {
  background: var(--page-bg);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 14px 16px;
  margin-top: 8px;
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

.fin-diff-pos { color: #2E6F70; }
.fin-diff-neg { color: var(--coral-500); }

.check-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.check-row input[type="checkbox"] {
  margin-top: 2px;
  accent-color: var(--violet-700);
  width: 16px;
  height: 16px;
}

.lbl-block { display: flex; flex-direction: column; gap: 2px; }
.lbl-block .t { font-size: 13px; font-weight: 500; color: var(--ink); }
.lbl-block .h { font-size: 12px; color: var(--ink-muted); }

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
