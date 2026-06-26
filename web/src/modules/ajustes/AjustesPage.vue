<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAjustesStore } from './store'
import type { ConfiguracionNegocio, DistribucionGanancia } from '@/types'
import FloatingField from '@/shared/ui/FloatingField.vue'
import FloatingSelect from '@/shared/ui/FloatingSelect.vue'
import ToggleSwitch from '@/shared/ui/ToggleSwitch.vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import { useToast } from '@/shared/lib/useToast'

const store = useAjustesStore()
const { toast } = useToast()

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

const config = ref<ConfiguracionNegocio | null>(null)
const socios = ref<DistribucionGanancia[]>([])

const domicilio = computed(() => config.value?.domicilio as Record<string, string> | undefined)

const totalActivo = computed(() =>
  socios.value.filter((s) => s.activo).reduce((sum, s) => sum + Number(s.porcentaje), 0)
)

const sociosValid = computed(() => Math.abs(totalActivo.value - 100) < 0.01)

const configDirty = ref(false)
const sociosDirty = ref(false)

const showLoading = computed(() => store.loading && !store.hasFetched)

function updateConfig(field: string, value: any) {
  if (config.value) {
    ;(config.value as any)[field] = value
    configDirty.value = true
  }
}

function updateDomicilio(field: string, value: string) {
  if (config.value) {
    if (!config.value.domicilio) {
      config.value.domicilio = {}
    }
    ;(config.value.domicilio as any)[field] = value
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
    toast('Configuración guardada correctamente')
  } catch (e: any) {
    toast(e.message || 'Error al guardar configuración', 'error')
  }
}

async function saveSocios() {
  if (!sociosValid.value) return
  try {
    await store.saveSocios(
      socios.value.map((s) => ({ id: s.id, porcentaje: s.porcentaje }))
    )
    sociosDirty.value = false
    toast('Distribución guardada correctamente')
  } catch (e: any) {
    toast(e.message || 'Error al guardar distribución', 'error')
  }
}

onMounted(async () => {
  try {
    await store.fetch()
    if (store.config) {
      config.value = JSON.parse(JSON.stringify(store.config))
    }
    if (store.socios) {
      socios.value = JSON.parse(JSON.stringify(store.socios))
    }
  } catch (e: any) {
    error.value = e.message || 'Error al cargar ajustes'
  }
})
</script>

<template>
  <div class="w-full">
    <div v-if="showLoading" class="border border-border rounded-lg bg-surface p-6">
      <p class="text-14 text-ink-muted">Cargando ajustes...</p>
    </div>
    <div v-else-if="error" class="border border-coral-200 bg-coral-50 rounded-lg p-6">
      <p class="text-14 text-coral-750 font-medium">{{ error }}</p>
    </div>

    <template v-else-if="config">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <!-- Columna Izquierda: Inicio -->
        <div class="flex flex-col gap-5">
          <!-- Bloque Inicio -->
          <BaseCard :padded="false" class="flex flex-col">
            <header class="flex justify-between items-start gap-4 px-6 py-5 border-b border-border">
              <div>
                <h3 class="text-16 font-medium text-ink m-0">Inicio</h3>
                <p class="text-13 text-ink-muted m-0 mt-1">Datos del negocio que aparecen en presupuestos y la app.</p>
              </div>
              <span v-if="configDirty" class="inline-flex items-center gap-1.5 text-11 px-2.5 py-1 bg-yellow text-yellow-ink rounded-full border border-yellow/20 shrink-0">
                <span class="w-1.5 h-1.5 rounded-full bg-current" /> Sin guardar
              </span>
            </header>
            <div class="p-6 flex flex-col gap-4">
              <div class="grid grid-cols-2 gap-3.5">
                <div class="flex flex-col gap-1.5">
                  <FloatingField
                    id="aj-nombre-negocio"
                    label="Nombre del negocio"
                    required
                    :model-value="config.nombre"
                    @update:model-value="updateConfig('nombre', String($event))"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <FloatingSelect
                    id="aj-moneda"
                    label="Moneda"
                    :model-value="config.moneda"
                    @update:model-value="updateConfig('moneda', String($event))"
                  >
                    <option v-for="m in MONEDAS" :key="m.id" :value="m.id">{{ m.label }}</option>
                  </FloatingSelect>
                </div>
                <div class="flex flex-col gap-1.5 col-span-2">
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
              </div>

              <h5 class="text-11 font-medium uppercase tracking-[0.06em] text-ink-muted mt-3 pt-3.5 border-t border-border">Domicilio</h5>
              <div class="grid grid-cols-3 gap-3">
                <div class="flex flex-col gap-1.5 col-span-2">
                  <FloatingField id="aj-calle" label="Calle" :model-value="domicilio?.calle || ''" @update:model-value="updateDomicilio('calle', String($event))" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <FloatingField id="aj-numero" label="Número" :model-value="domicilio?.numero || ''" @update:model-value="updateDomicilio('numero', String($event))" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <FloatingField id="aj-localidad" label="Localidad" :model-value="domicilio?.localidad || ''" @update:model-value="updateDomicilio('localidad', String($event))" />
                </div>
                <div class="flex flex-col gap-1.5 col-span-2">
                  <FloatingField id="aj-provincia" label="Provincia" :model-value="domicilio?.provincia || ''" @update:model-value="updateDomicilio('provincia', String($event))" />
                </div>
              </div>

              <h5 class="text-11 font-medium uppercase tracking-[0.06em] text-ink-muted mt-3 pt-3.5 border-t border-border">Contacto del negocio</h5>
              <div class="grid grid-cols-2 gap-3.5">
                <div class="flex flex-col gap-1.5">
                  <FloatingSelect
                    id="aj-canal"
                    label="Canal"
                    :model-value="config.contactoCanal || 'instagram'"
                    @update:model-value="updateConfig('contactoCanal', String($event))"
                  >
                    <option v-for="(label, id) in canalLabels" :key="id" :value="id">{{ label }}</option>
                  </FloatingSelect>
                </div>
                <div class="flex flex-col gap-1.5">
                  <FloatingField id="aj-contacto-valor" label="Valor" :model-value="config.contactoValor || ''" @update:model-value="updateConfig('contactoValor', String($event))" />
                </div>
              </div>
            </div>
            <footer class="flex items-center gap-3 px-6 py-3.5 bg-page-bg border-t border-border justify-end">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-13 font-medium bg-violet-700 text-white hover:bg-violet-850 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                :disabled="!configDirty"
                @click="saveConfig"
              >
                Guardar cambios
              </button>
            </footer>
          </BaseCard>
        </div>

        <!-- Columna Derecha: Presupuestos, Finanzas y Cuenta -->
        <div class="flex flex-col gap-5">
          <!-- Bloque Presupuestos -->
          <BaseCard :padded="false" class="flex flex-col">
            <header class="flex justify-between items-start gap-4 px-6 py-5 border-b border-border">
              <div>
                <h3 class="text-16 font-medium text-ink m-0">Presupuestos</h3>
                <p class="text-13 text-ink-muted m-0 mt-1">Comportamiento por defecto del flujo de presupuestos.</p>
              </div>
            </header>
            <div class="p-6 flex flex-col gap-4">
              <div class="flex items-center justify-between gap-4 p-3.5 bg-page-bg border border-border rounded-md">
                <div class="flex flex-col gap-1">
                  <span class="text-13 font-medium text-ink">Cancelación automática por tiempo</span>
                  <span class="text-12 text-ink-muted max-width-[560px]">Los presupuestos en estado <strong>Enviado</strong> se cancelarán automáticamente luego de X días sin confirmación.</span>
                </div>
                <ToggleSwitch
                  :model-value="config.cancelacionAuto"
                  @update:model-value="updateConfig('cancelacionAuto', $event)"
                  aria-label="Cancelación automática por tiempo"
                />
              </div>
              <div v-if="config.cancelacionAuto" class="bg-violet-50/70 rounded-md p-3.5 flex flex-col gap-2 animation-grow">
                <div class="flex flex-col gap-1.5 max-w-[220px]">
                  <label for="aj-dias-espera" class="text-11 font-medium uppercase tracking-[0.06em] text-ink-muted">Días de espera</label>
                  <div class="flex gap-2 items-stretch">
                    <input
                      id="aj-dias-espera"
                      class="w-full box-border font-sans text-14 text-ink bg-surface border border-border-strong rounded-md px-3.5 py-2 outline-none focus:border-violet-700"
                      type="number"
                      min="1"
                      step="1"
                      :value="config.diasEspera"
                      @input="updateConfig('diasEspera', Number(($event.target as HTMLInputElement).value))"
                      style="text-align: right; font-variant-numeric: tabular-nums"
                    />
                    <span class="inline-flex items-center px-3 text-12 text-ink-muted bg-page-bg border border-border-strong rounded-md min-w-[64px] justify-center">días</span>
                  </div>
                </div>
                <p class="text-12 text-ink-muted m-0">Después de <strong>{{ config.diasEspera || 0 }} día{{ config.diasEspera === 1 ? '' : 's' }}</strong> sin respuesta, el presupuesto pasa a <em>Cancelado</em>.</p>
              </div>
            </div>
            <footer class="flex items-center gap-3 px-6 py-3.5 bg-page-bg border-t border-border justify-end">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-13 font-medium bg-violet-700 text-white hover:bg-violet-850 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                :disabled="!configDirty"
                @click="saveConfig"
              >
                Guardar cambios
              </button>
            </footer>
          </BaseCard>

          <!-- Bloque Finanzas -->
          <BaseCard :padded="false" class="flex flex-col">
            <header class="flex justify-between items-start gap-4 px-6 py-5 border-b border-border">
              <div>
                <h3 class="text-16 font-medium text-ink m-0">Finanzas</h3>
                <p class="text-13 text-ink-muted m-0 mt-1">Distribución automática de ganancias al cerrar el período.</p>
              </div>
              <span v-if="sociosDirty" class="inline-flex items-center gap-1.5 text-11 px-2.5 py-1 bg-yellow text-yellow-ink rounded-full border border-yellow/20 shrink-0">
                <span class="w-1.5 h-1.5 rounded-full bg-current" /> Sin guardar
              </span>
            </header>
            <div class="p-6 flex flex-col gap-4">
              <div class="border border-border rounded-lg overflow-hidden bg-surface">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="bg-page-bg">
                      <th class="text-left px-3.5 py-2.5 text-11 font-medium uppercase tracking-[0.06em] text-ink-muted border-b border-border">Socio / Destino</th>
                      <th class="text-right px-3.5 py-2.5 text-11 font-medium uppercase tracking-[0.06em] text-ink-muted border-b border-border w-[160px]">Porcentaje</th>
                      <th class="text-center px-3.5 py-2.5 text-11 font-medium uppercase tracking-[0.06em] text-ink-muted border-b border-border w-[90px]">Activo</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    <tr v-for="s in socios" :key="s.id" :class="[!s.activo ? 'opacity-50' : '']">
                      <td class="p-0">
                        <input
                          class="w-full border-0 bg-transparent font-sans text-13 text-ink px-3.5 py-3 outline-none focus:bg-teal-50/40"
                          :value="s.nombre"
                          @input="updateSocio(s.id, { nombre: ($event.target as HTMLInputElement).value })"
                        />
                      </td>
                      <td class="p-0">
                        <div class="flex items-center pr-3.5">
                          <input
                            class="w-full border-0 bg-transparent font-sans text-13 text-ink px-3.5 py-3 text-right tabular-nums outline-none pr-1.5 focus:bg-teal-50/40"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            :value="s.porcentaje"
                            @input="updateSocio(s.id, { porcentaje: Number(($event.target as HTMLInputElement).value) })"
                          />
                          <span class="text-ink-muted text-13 select-none">%</span>
                        </div>
                      </td>
                      <td class="px-3.5 py-3 align-middle text-center">
                        <div class="inline-flex items-center justify-center">
                          <ToggleSwitch
                            :model-value="s.activo"
                            @update:model-value="updateSocio(s.id, { activo: $event })"
                            aria-label="Activo"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <footer class="flex items-center gap-3 px-6 py-3.5 bg-page-bg border-t border-border flex-wrap">
              <span
                class="inline-flex items-center gap-2 text-13 px-3 py-1.5 rounded-full select-none"
                :class="[sociosValid ? 'bg-teal-50 text-teal-700' : 'bg-coral-50 text-coral-750']"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current" />
                Suma activa: <strong>{{ totalActivo }}%</strong>
                <span v-if="!sociosValid" class="text-12 opacity-85"> · debe ser 100%</span>
              </span>
              <div class="spacer flex-1" />
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-13 font-medium bg-violet-700 text-white hover:bg-violet-850 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                :disabled="!sociosDirty || !sociosValid"
                @click="saveSocios"
              >
                Guardar cambios
              </button>
            </footer>
          </BaseCard>

          <!-- Bloque Cuenta -->
          <BaseCard :padded="false" class="flex flex-col">
            <header class="flex justify-between items-start gap-4 px-6 py-5 border-b border-border">
              <div>
                <h3 class="text-16 font-medium text-ink m-0">Cuenta</h3>
                <p class="text-13 text-ink-muted m-0 mt-1">Tu información personal y preferencias de la sesión.</p>
              </div>
            </header>
            <div class="p-6 flex flex-col gap-4">
              <div class="grid grid-cols-2 gap-3.5">
                <div class="flex flex-col gap-1.5">
                  <FloatingField id="aj-nombre-cuenta" label="Nombre" :model-value="config.nombre" disabled />
                </div>
                <div class="flex flex-col gap-1.5">
                  <FloatingField id="aj-email-cuenta" label="Email (solo lectura)" :model-value="config.contactoValor || '—'" readonly always-float tabindex="-1" />
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.animation-grow {
  animation: aj-grow 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
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
</style>
