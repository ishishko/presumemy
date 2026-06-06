<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get, put } from '@/services/api'
import type { ConfiguracionNegocio, DistribucionGanancia } from '@/types'

const config = ref<ConfiguracionNegocio | null>(null)
const socios = ref<DistribucionGanancia[]>([])
const loading = ref(true)
const error = ref('')

const MONEDAS = [
  { id: 'ARS', label: 'ARS — Peso argentino' },
  { id: 'USD', label: 'USD — Dólar estadounidense' },
  { id: 'EUR', label: 'EUR — Euro' },
  { id: 'OTRA', label: 'Otra moneda…' },
]

const canalColors: Record<string, string> = {
  instagram: '#D7548C',
  whatsapp: '#1F8A5B',
  mail: '#2E6F70',
  otros: '#6B6270',
}

const canalLabels: Record<string, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  mail: 'Mail',
  otros: 'Otros',
}

const canalMeta = computed(() => {
  const id = config.value?.contactoCanal || 'instagram'
  return { color: canalColors[id] || '#6B6270', label: canalLabels[id] || id }
})

const domicilio = computed(() => config.value?.domicilio as Record<string, string> | undefined)

const totalActivo = computed(() =>
  socios.value.filter((s) => s.activo).reduce((sum, s) => sum + Number(s.porcentaje), 0)
)

const sociosValid = computed(() => Math.abs(totalActivo.value - 100) < 0.01)

const configDirty = ref(false)
const sociosDirty = ref(false)

function updateConfig(field: string, value: any) {
  if (config.value) {
    (config.value as any)[field] = value
    configDirty.value = true
  }
}

function updateDomicilio(field: string, value: string) {
  if (config.value?.domicilio) {
    (config.value.domicilio as any)[field] = value
    configDirty.value = true
  }
}

function updateSocio(id: number, patch: Partial<DistribucionGanancia>) {
  const idx = socios.value.findIndex((s) => s.id === id)
  if (idx >= 0) {
    socios.value[idx] = { ...socios.value[idx], ...patch }
    sociosDirty.value = true
  }
}

async function saveConfig() {
  if (!config.value) return
  try {
    await put('/ajustes/configuracion', 1, {
      nombre: config.value.nombre,
      moneda: config.value.moneda,
      domicilio: config.value.domicilio,
      contactoCanal: config.value.contactoCanal,
      contactoValor: config.value.contactoValor,
    })
    configDirty.value = false
  } catch (e: any) {
    error.value = e.message || 'Error al guardar'
  }
}

async function saveSocios() {
  if (!sociosValid.value) return
  try {
    await put('/ajustes/distribucion', 0, {
      items: socios.value.map((s) => ({ id: s.id, porcentaje: s.porcentaje })),
    })
    sociosDirty.value = false
  } catch (e: any) {
    error.value = e.message || 'Error al guardar'
  }
}

onMounted(async () => {
  try {
    const [configRes, sociosRes] = await Promise.all([
      get<{ data: ConfiguracionNegocio }>('/ajustes/configuracion'),
      get<{ data: DistribucionGanancia[] }>('/ajustes/distribucion'),
    ])
    config.value = configRes.data
    socios.value = sociosRes.data
  } catch (e: any) {
    error.value = e.message || 'Error al cargar ajustes'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="content">
    <div v-if="loading" class="card"><p>Cargando ajustes...</p></div>
    <div v-else-if="error" class="card"><p class="err">{{ error }}</p></div>

    <template v-else-if="config">
      <div class="aj-stack">
        <!-- Columna Izquierda: Inicio -->
        <div class="aj-col">
          <!-- Bloque Inicio -->
          <section class="aj-block">
            <header class="aj-block-head">
              <div>
                <h3>Inicio</h3>
                <p class="hint">Datos del negocio que aparecen en presupuestos y la app.</p>
              </div>
              <span v-if="configDirty" class="aj-dirty-chip"><span class="dot" /> Sin guardar</span>
            </header>
            <div class="aj-block-body">
              <div class="aj-grid-2">
                <div class="aj-field">
                  <label>Nombre del negocio</label>
                  <input class="input" :value="config.nombre" @input="updateConfig('nombre', ($event.target as HTMLInputElement).value)" />
                </div>
                <div class="aj-field">
                  <label>Moneda</label>
                  <select class="select" :value="config.moneda" @change="updateConfig('moneda', ($event.target as HTMLSelectElement).value)">
                    <option v-for="m in MONEDAS" :key="m.id" :value="m.id">{{ m.label }}</option>
                  </select>
                </div>
              </div>

              <h5 class="aj-subhead">Domicilio</h5>
              <div class="aj-dom-grid">
                <div class="aj-field" style="grid-column: 1 / span 2">
                  <label>Calle</label>
                  <input class="input" :value="domicilio?.calle || ''" @input="updateDomicilio('calle', ($event.target as HTMLInputElement).value)" />
                </div>
                <div class="aj-field">
                  <label>Número</label>
                  <input class="input" :value="domicilio?.numero || ''" @input="updateDomicilio('numero', ($event.target as HTMLInputElement).value)" />
                </div>
                <div class="aj-field">
                  <label>Ciudad</label>
                  <input class="input" :value="domicilio?.ciudad || ''" @input="updateDomicilio('ciudad', ($event.target as HTMLInputElement).value)" />
                </div>
                <div class="aj-field">
                  <label>Provincia</label>
                  <input class="input" :value="domicilio?.provincia || ''" @input="updateDomicilio('provincia', ($event.target as HTMLInputElement).value)" />
                </div>
              </div>

              <h5 class="aj-subhead">Contacto del negocio</h5>
              <div class="aj-grid-2">
                <div class="aj-field">
                  <label>Canal</label>
                  <div class="aj-canal-select">
                    <span class="canal-dot" :style="{ background: canalMeta.color }" />
                    <select class="select" :value="config.contactoCanal || 'instagram'" @change="updateConfig('contactoCanal', ($event.target as HTMLSelectElement).value)">
                      <option v-for="(label, id) in canalLabels" :key="id" :value="id">{{ label }}</option>
                    </select>
                  </div>
                </div>
                <div class="aj-field">
                  <label>Valor</label>
                  <input class="input" :value="config.contactoValor || ''" @input="updateConfig('contactoValor', ($event.target as HTMLInputElement).value)" />
                </div>
              </div>
            </div>
            <footer class="aj-block-foot">
              <div class="spacer" />
              <button class="btn btn-primary" :disabled="!configDirty" @click="saveConfig" :style="{ opacity: configDirty ? 1 : 0.5, pointerEvents: configDirty ? 'auto' : 'none' }">Guardar cambios</button>
            </footer>
          </section>
        </div>

        <!-- Columna Derecha: Presupuestos, Finanzas y Cuenta -->
        <div class="aj-col">
          <!-- Bloque Presupuestos -->
          <section class="aj-block">
            <header class="aj-block-head">
              <div>
                <h3>Presupuestos</h3>
                <p class="hint">Comportamiento por defecto del flujo de presupuestos.</p>
              </div>
            </header>
            <div class="aj-block-body">
              <div class="aj-toggle-row aj-toggle-row-card">
                <div class="lbl">
                  <span class="t">Cancelación automática por tiempo</span>
                  <span class="h">Los presupuestos en estado <strong>Enviado</strong> se cancelarán automáticamente luego de X días sin confirmación.</span>
                </div>
                <div class="aj-switch" :class="{ on: config.cancelacionAuto }" @click="updateConfig('cancelacionAuto', !config.cancelacionAuto)" />
              </div>
              <div v-if="config.cancelacionAuto" class="aj-conditional">
                <div class="aj-field" style="max-width: 220px">
                  <label>Días de espera</label>
                  <div class="aj-num-with-unit">
                    <input class="input" type="number" min="1" step="1" :value="config.diasEspera" @input="updateConfig('diasEspera', Number(($event.target as HTMLInputElement).value))" style="text-align: right; font-variant-numeric: tabular-nums" />
                    <span class="aj-unit-pill">días</span>
                  </div>
                </div>
                <p class="hint">Después de <strong>{{ config.diasEspera || 0 }} día{{ config.diasEspera === 1 ? '' : 's' }}</strong> sin respuesta, el presupuesto pasa a <em>Cancelado</em>.</p>
              </div>
            </div>
            <footer class="aj-block-foot">
              <div class="spacer" />
              <button class="btn btn-primary" :disabled="!configDirty" @click="saveConfig" :style="{ opacity: configDirty ? 1 : 0.5, pointerEvents: configDirty ? 'auto' : 'none' }">Guardar cambios</button>
            </footer>
          </section>

          <!-- Bloque Finanzas -->
          <section class="aj-block">
            <header class="aj-block-head">
              <div>
                <h3>Finanzas</h3>
                <p class="hint">Distribución automática de ganancias al cerrar el período.</p>
              </div>
              <span v-if="sociosDirty" class="aj-dirty-chip"><span class="dot" /> Sin guardar</span>
            </header>
            <div class="aj-block-body">
              <div class="aj-socios-table">
                <table>
                  <colgroup>
                    <col />
                    <col style="width: 160px" />
                    <col style="width: 90px" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Socio / Destino</th>
                      <th class="num">Porcentaje</th>
                      <th class="center">Activo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in socios" :key="s.id" :class="{ off: !s.activo }">
                      <td>
                        <input class="prov-input" :value="s.nombre" @input="updateSocio(s.id, { nombre: ($event.target as HTMLInputElement).value })" />
                      </td>
                      <td>
                        <div class="aj-pct-cell">
                          <input class="prov-input num" type="number" min="0" max="100" step="1" :value="s.porcentaje" @input="updateSocio(s.id, { porcentaje: Number(($event.target as HTMLInputElement).value) })" />
                          <span class="aj-pct-unit">%</span>
                        </div>
                      </td>
                      <td class="center">
                        <div class="aj-switch" :class="{ on: s.activo }" @click="updateSocio(s.id, { activo: !s.activo })" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <footer class="aj-block-foot">
              <span :class="['aj-sum-indicator', sociosValid ? 'ok' : 'err']">
                <span class="dot" />
                Suma activa: <strong>{{ totalActivo }}%</strong>
                <span v-if="!sociosValid" class="aj-sum-err-hint"> · debe ser 100%</span>
              </span>
              <div class="spacer" />
              <button class="btn btn-primary" :disabled="!sociosDirty || !sociosValid" @click="saveSocios" :style="{ opacity: sociosDirty && sociosValid ? 1 : 0.5, pointerEvents: sociosDirty && sociosValid ? 'auto' : 'none' }">Guardar cambios</button>
            </footer>
          </section>

          <!-- Bloque Cuenta -->
          <section class="aj-block">
            <header class="aj-block-head">
              <div>
                <h3>Cuenta</h3>
                <p class="hint">Tu información personal y preferencias de la sesión.</p>
              </div>
            </header>
            <div class="aj-block-body">
              <div class="aj-grid-2">
                <div class="aj-field">
                  <label>Nombre</label>
                  <input class="input" :value="config.nombre" disabled />
                </div>
                <div class="aj-field">
                  <label>Email <span class="optional">(solo lectura)</span></label>
                  <input class="input readonly" :value="config.contactoValor || '—'" readonly tabindex="-1" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.aj-stack {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 100%;
  align-items: start;
}

.aj-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Block shell */
.aj-block {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.aj-block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
}
.aj-block-head h3 {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.005em;
  margin: 0 0 4px;
}
.aj-block-head .hint {
  font-size: 13px;
  color: var(--ink-muted);
  margin: 0;
  max-width: 540px;
}
.aj-dirty-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 4px 10px;
  background: var(--yellow);
  color: var(--yellow-ink);
  border-radius: 999px;
  flex-shrink: 0;
}
.aj-dirty-chip .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--yellow-ink);
}

.aj-block-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.aj-block-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: var(--page-bg);
  border-top: 1px solid var(--border);
}
.aj-block-foot .spacer {
  flex: 1;
}

/* Subheadings within a block */
.aj-subhead {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  margin: 12px 0 6px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

/* Field primitives */
.aj-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.aj-field > label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
}
.aj-field > label .optional {
  font-size: 10px;
  color: var(--ink-muted);
  font-weight: 400;
  text-transform: lowercase;
  letter-spacing: 0;
  margin-left: 4px;
}
.aj-field .input.readonly,
.aj-field input.readonly {
  background: var(--page-bg);
  color: var(--ink-muted);
  cursor: default;
}
.aj-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.aj-dom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

/* Canal selector with leading dot */
.aj-canal-select {
  position: relative;
  display: flex;
  align-items: center;
}
.aj-canal-select .canal-dot {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}
.aj-canal-select .select {
  padding-left: 28px;
  width: 100%;
}

/* Toggle row */
.aj-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.aj-toggle-row .lbl {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.aj-toggle-row .lbl .t {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}
.aj-toggle-row .lbl .h {
  font-size: 12px;
  color: var(--ink-muted);
  max-width: 560px;
}
.aj-toggle-row-card {
  padding: 14px 16px;
  background: var(--page-bg);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}

.aj-switch {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: var(--border-strong);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms ease;
}
.aj-switch::after {
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
.aj-switch.on {
  background: var(--teal-500);
}
.aj-switch.on::after {
  transform: translateX(16px);
}
.aj-switch.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.aj-conditional {
  background: var(--violet-50);
  border-radius: var(--r-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: aj-grow 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.aj-conditional .hint {
  font-size: 12px;
  color: var(--ink-muted);
  margin: 0;
}
@keyframes aj-grow {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.aj-num-with-unit {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.aj-num-with-unit .input {
  flex: 1;
}
.aj-unit-pill {
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  color: var(--ink-muted);
  background: var(--page-bg);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  min-width: 64px;
  justify-content: center;
}

/* Socios table */
.aj-socios-table {
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface);
}
.aj-socios-table table {
  width: 100%;
  border-collapse: collapse;
}
.aj-socios-table thead th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  background: var(--page-bg);
  border-bottom: 1px solid var(--border);
}
.aj-socios-table thead th.num {
  text-align: right;
}
.aj-socios-table thead th.center {
  text-align: center;
}
.aj-socios-table tbody td {
  padding: 0;
  border-bottom: 1px solid var(--border);
}
.aj-socios-table tbody tr:last-child td {
  border-bottom: 0;
}
.aj-socios-table tbody td.center {
  text-align: center;
  padding: 10px;
}
.aj-socios-table tbody td .prov-input {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--ink);
  padding: 12px 14px;
  outline: none;
}
.aj-socios-table tbody td .prov-input.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.aj-socios-table tbody td .prov-input:focus {
  background: var(--teal-100);
}
.aj-socios-table tbody tr.off td {
  opacity: 0.5;
}

.aj-pct-cell {
  display: flex;
  align-items: center;
  padding-right: 14px;
}
.aj-pct-cell .prov-input.num {
  padding-right: 6px;
}
.aj-pct-unit {
  color: var(--ink-muted);
  font-size: 13px;
}

.aj-sum-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 999px;
}
.aj-sum-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.aj-sum-indicator.ok {
  background: var(--mint);
  color: #1f5a3e;
}
.aj-sum-indicator.err {
  background: var(--coral-50);
  color: var(--coral-500);
}
.aj-sum-err-hint {
  font-size: 12px;
  opacity: 0.85;
}

.aj-password-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: var(--page-bg);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}
.aj-password-row .t {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}
.aj-password-row .h {
  font-size: 12px;
  color: var(--ink-muted);
  margin-top: 2px;
}
</style>
