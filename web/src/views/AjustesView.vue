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
    </template>
  </div>
</template>
