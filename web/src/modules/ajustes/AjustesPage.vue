<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAjustesStore } from './store'
import type { DistribucionGanancia } from '@/modules/finanzas'
import FloatingField from '@/shared/ui/FloatingField.vue'
import FloatingSelect from '@/shared/ui/FloatingSelect.vue'
import ToggleSwitch from '@/shared/ui/ToggleSwitch.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'

const store = useAjustesStore()
const { config, socios } = storeToRefs(store)
const loading = ref(true)
const error = ref('')

const MONEDAS = [
  { id: 'ARS', label: 'ARS — Peso argentino' },
  { id: 'USD', label: 'USD — Dólar estadounidense' },
  { id: 'EUR', label: 'EUR — Euro' },
  { id: 'OTRA', label: 'Otra moneda…' },
]

const canalLabels: Record<string, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  mail: 'Mail',
  otros: 'Otros',
}

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
  if (config.value) {
    if (!config.value.domicilio) {
      config.value.domicilio = {}
    }
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
    await store.saveConfig({
      nombre: config.value.nombre,
      moneda: config.value.moneda,
      domicilio: config.value.domicilio,
      contactoCanal: config.value.contactoCanal,
      contactoValor: config.value.contactoValor,
      cancelacionAuto: config.value.cancelacionAuto,
      diasEspera: config.value.diasEspera,
      formatoFechaDashboard: config.value.formatoFechaDashboard,
    })
    configDirty.value = false
  } catch (e: any) {
    error.value = e.message || 'Error al guardar'
  }
}

async function saveSocios() {
  if (!sociosValid.value) return
  try {
    await store.saveDistribucion(socios.value.map((s) => ({ id: s.id, porcentaje: Number(s.porcentaje) })))
    sociosDirty.value = false
  } catch (e: any) {
    error.value = e.message || 'Error al guardar'
  }
}

onMounted(async () => {
  try {
    await store.fetchAll()
  } catch (e: any) {
    error.value = e.message || 'Error al cargar ajustes'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="p-6">
    <div v-if="loading" class="bg-surface border border-border rounded-lg p-5">
      <p class="text-14 text-ink-muted">Cargando ajustes...</p>
    </div>
    <div v-else-if="error" class="bg-coral-50 border border-coral-500/20 rounded-lg p-5">
      <p class="text-14 text-coral-500">{{ error }}</p>
    </div>

    <template v-else-if="config">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Columna Izquierda: Inicio -->
        <div class="flex flex-col gap-5">
          <!-- Bloque Inicio -->
          <section class="bg-surface border border-border rounded-lg shadow-1 overflow-hidden flex flex-col">
            <header class="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
              <div>
                <h3 class="text-18 font-medium text-ink m-0 mb-1">Inicio</h3>
                <p class="text-13 text-ink-muted m-0 max-w-135">Datos del negocio que aparecen en presupuestos y la app.</p>
              </div>
              <span v-if="configDirty" class="inline-flex items-center gap-1.5 text-11 px-2.5 py-1 bg-yellow text-yellow-ink rounded-pill flex-shrink-0">
                <span class="w-1.25 h-1.25 rounded-full bg-yellow-ink" /> Sin guardar
              </span>
            </header>
            <div class="p-5 flex flex-col gap-4">
              <div class="grid grid-cols-2 gap-3.5">
                <FloatingField
                  id="aj-nombre-negocio"
                  label="Nombre del negocio"
                  required
                  :model-value="config.nombre"
                  @update:model-value="updateConfig('nombre', String($event))"
                />
                <FloatingSelect
                  id="aj-moneda"
                  label="Moneda"
                  :model-value="config.moneda"
                  @update:model-value="updateConfig('moneda', String($event))"
                >
                  <option v-for="m in MONEDAS" :key="m.id" :value="m.id">{{ m.label }}</option>
                </FloatingSelect>
                <FloatingSelect
                  id="aj-formato-fecha"
                  label="Fecha en dashboard"
                  :model-value="config.formatoFechaDashboard"
                  @update:model-value="updateConfig('formatoFechaDashboard', String($event))"
                >
                  <option value="relativo">Relativo (ej. Entrega hoy)</option>
                  <option value="absoluto">Absoluto (ej. 24 Jun 2026)</option>
                </FloatingSelect>
              </div>

              <h5 class="text-11 font-medium uppercase tracking-0.06em text-ink-muted mt-3 pt-3.5 border-t border-border">Domicilio</h5>
              <div class="grid grid-cols-3 gap-3">
                <div class="col-span-2">
                  <FloatingField id="aj-calle" label="Calle" :model-value="domicilio?.calle || ''" @update:model-value="updateDomicilio('calle', String($event))" />
                </div>
                <FloatingField id="aj-numero" label="Número" :model-value="domicilio?.numero || ''" @update:model-value="updateDomicilio('numero', String($event))" />
                <FloatingField id="aj-localidad" label="Localidad" :model-value="domicilio?.localidad || ''" @update:model-value="updateDomicilio('localidad', String($event))" />
                <FloatingField id="aj-provincia" label="Provincia" :model-value="domicilio?.provincia || ''" @update:model-value="updateDomicilio('provincia', String($event))" />
              </div>

              <h5 class="text-11 font-medium uppercase tracking-0.06em text-ink-muted mt-3 pt-3.5 border-t border-border">Contacto del negocio</h5>
              <div class="grid grid-cols-2 gap-3.5">
                <FloatingSelect
                  id="aj-canal"
                  label="Canal"
                  :model-value="config.contactoCanal || 'instagram'"
                  @update:model-value="updateConfig('contactoCanal', String($event))"
                >
                  <option v-for="(label, id) in canalLabels" :key="id" :value="id">{{ label }}</option>
                </FloatingSelect>
                <FloatingField id="aj-contacto-valor" label="Valor" :model-value="config.contactoValor || ''" @update:model-value="updateConfig('contactoValor', String($event))" />
              </div>
            </div>
            <footer class="flex items-center gap-3 px-6 py-3.5 bg-page-bg border-t border-border">
              <div class="flex-1" />
              <BaseButton :disabled="!configDirty" @click="saveConfig">Guardar cambios</BaseButton>
            </footer>
          </section>
        </div>

        <!-- Columna Derecha: Presupuestos, Finanzas y Cuenta -->
        <div class="flex flex-col gap-5">
          <!-- Bloque Presupuestos -->
          <section class="bg-surface border border-border rounded-lg shadow-1 overflow-hidden flex flex-col">
            <header class="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
              <div>
                <h3 class="text-18 font-medium text-ink m-0 mb-1">Presupuestos</h3>
                <p class="text-13 text-ink-muted m-0 max-w-135">Comportamiento por defecto del flujo de presupuestos.</p>
              </div>
            </header>
            <div class="p-5 flex flex-col gap-4">
              <div class="flex items-center justify-between gap-4 p-3.5 bg-page-bg border border-border rounded-md">
                <div class="flex flex-col gap-0.75">
                  <span class="text-13 font-medium text-ink">Cancelación automática por tiempo</span>
                  <span class="text-12 text-ink-muted max-w-140">Los presupuestos en estado <strong>Enviado</strong> se cancelarán automáticamente luego de X días sin confirmación.</span>
                </div>
                <ToggleSwitch
                  :model-value="config.cancelacionAuto"
                  @update:model-value="updateConfig('cancelacionAuto', $event)"
                  aria-label="Cancelación automática por tiempo"
                />
              </div>
              <div v-if="config.cancelacionAuto" class="bg-violet-50 rounded-md p-3.5 flex flex-col gap-2 animate-[aj-grow_180ms_ease_both]">
                <div class="max-w-55">
                  <label for="aj-dias-espera" class="text-11 font-medium uppercase tracking-0.06em text-ink-muted mb-1.5 block">Días de espera</label>
                  <div class="flex gap-2 items-stretch">
                    <input id="aj-dias-espera" class="flex-1 px-3 py-2 bg-surface border border-border-strong rounded-md text-13 text-ink font-sans text-right tabular-nums focus:outline-none focus:border-teal-500 focus:shadow-focus-ring" type="number" min="1" step="1" :value="config.diasEspera" @input="updateConfig('diasEspera', Number(($event.target as HTMLInputElement).value))" />
                    <span class="inline-flex items-center px-3 text-12 text-ink-muted bg-page-bg border border-border-strong rounded-md min-w-16 justify-center">días</span>
                  </div>
                </div>
                <p class="text-12 text-ink-muted m-0">Después de <strong>{{ config.diasEspera || 0 }} día{{ config.diasEspera === 1 ? '' : 's' }}</strong> sin respuesta, el presupuesto pasa a <em>Cancelado</em>.</p>
              </div>
            </div>
            <footer class="flex items-center gap-3 px-6 py-3.5 bg-page-bg border-t border-border">
              <div class="flex-1" />
              <BaseButton :disabled="!configDirty" @click="saveConfig">Guardar cambios</BaseButton>
            </footer>
          </section>

          <!-- Bloque Finanzas -->
          <section class="bg-surface border border-border rounded-lg shadow-1 overflow-hidden flex flex-col">
            <header class="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
              <div>
                <h3 class="text-18 font-medium text-ink m-0 mb-1">Finanzas</h3>
                <p class="text-13 text-ink-muted m-0 max-w-135">Distribución automática de ganancias al cerrar el período.</p>
              </div>
              <span v-if="sociosDirty" class="inline-flex items-center gap-1.5 text-11 px-2.5 py-1 bg-yellow text-yellow-ink rounded-pill flex-shrink-0">
                <span class="w-1.25 h-1.25 rounded-full bg-yellow-ink" /> Sin guardar
              </span>
            </header>
            <div class="p-5 flex flex-col gap-4">
              <div class="border border-border-strong rounded-[10px] overflow-hidden bg-surface">
                <table class="w-full border-collapse">
                  <thead>
                    <tr>
                      <th class="text-left px-3.5 py-2.5 text-11 font-medium uppercase tracking-0.06em text-ink-muted bg-page-bg border-b border-border">Socio / Destino</th>
                      <th class="text-right px-3.5 py-2.5 text-11 font-medium uppercase tracking-0.06em text-ink-muted bg-page-bg border-b border-border w-40">Porcentaje</th>
                      <th class="text-center px-3.5 py-2.5 text-11 font-medium uppercase tracking-0.06em text-ink-muted bg-page-bg border-b border-border w-22">Activo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in socios" :key="s.id" :class="{ 'opacity-50': !s.activo }">
                      <td class="border-b border-border last:border-b-0">
                        <input class="w-full border-0 bg-transparent font-sans text-13 text-ink px-3.5 py-3 outline-none focus:bg-teal-100" :value="s.nombre" @input="updateSocio(s.id, { nombre: ($event.target as HTMLInputElement).value })" />
                      </td>
                      <td class="border-b border-border last:border-b-0">
                        <div class="flex items-center pr-3.5">
                          <input class="flex-1 border-0 bg-transparent font-sans text-13 text-ink px-3.5 py-3 outline-none text-right tabular-nums focus:bg-teal-100" type="number" min="0" max="100" step="1" :value="s.porcentaje" @input="updateSocio(s.id, { porcentaje: Number(($event.target as HTMLInputElement).value) })" />
                          <span class="text-ink-muted text-13">%</span>
                        </div>
                      </td>
                      <td class="border-b border-border last:border-b-0 text-center px-2.5">
                        <ToggleSwitch
                          :model-value="s.activo"
                          @update:model-value="updateSocio(s.id, { activo: $event })"
                          :aria-label="`Activar ${s.nombre}`"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <footer class="flex items-center gap-3 px-6 py-3.5 bg-page-bg border-t border-border">
              <span :class="['inline-flex items-center gap-2 text-13 px-3 py-1.5 rounded-pill', sociosValid ? 'bg-mint text-green-700' : 'bg-coral-50 text-coral-500']">
                <span class="w-2 h-2 rounded-full bg-current" />
                Suma activa: <strong>{{ totalActivo }}%</strong>
                <span v-if="!sociosValid" class="text-12 opacity-85"> · debe ser 100%</span>
              </span>
              <div class="flex-1" />
              <BaseButton :disabled="!sociosDirty || !sociosValid" @click="saveSocios">Guardar cambios</BaseButton>
            </footer>
          </section>

          <!-- Bloque Cuenta -->
          <section class="bg-surface border border-border rounded-lg shadow-1 overflow-hidden flex flex-col">
            <header class="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
              <div>
                <h3 class="text-18 font-medium text-ink m-0 mb-1">Cuenta</h3>
                <p class="text-13 text-ink-muted m-0 max-w-135">Tu información personal y preferencias de la sesión.</p>
              </div>
            </header>
            <div class="p-5 flex flex-col gap-4">
              <div class="grid grid-cols-2 gap-3.5">
                <FloatingField id="aj-nombre-cuenta" label="Nombre" :model-value="config.nombre" disabled />
                <FloatingField id="aj-email-cuenta" label="Email (solo lectura)" :model-value="config.contactoValor || '—'" readonly always-float tabindex="-1" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@keyframes aj-grow {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
