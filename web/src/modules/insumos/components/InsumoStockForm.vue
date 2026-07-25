<script setup lang="ts">
import { computed } from 'vue'
import { getNivel, getFillPct } from '@/modules/insumos/stock'
import { formatMoney } from '@/shared/lib/format'
import FloatingField from '@/shared/ui/FloatingField.vue'

// Props
defineProps<{
  errors: Record<string, string>
}>()

// V-Models
const esSimple = defineModel<boolean>('esSimple', { required: true })
const costoPaquete = defineModel<number>('costoPaquete', { required: true })
const cantidadPack = defineModel<number>('cantidadPack', { required: true })
const unidad = defineModel<string>('unidad', { required: true })
const stockActual = defineModel<number>('stockActual', { required: true })
const stockMinimo = defineModel<number>('stockMinimo', { required: true })

const costoUnitario = computed(() => {
  if (esSimple.value) return costoPaquete.value
  return cantidadPack.value > 0 ? costoPaquete.value / cantidadPack.value : 0
})

const nivel = computed(() => {
  return getNivel(stockActual.value, stockMinimo.value)
})

const fillPct = computed(() => getFillPct(stockActual.value, stockMinimo.value))

const nivelMeta = {
  sin_control: { label: 'Sin control', color: 'var(--color-teal-600)', bg: 'var(--color-teal-50)' },
  sin_unidades: { label: 'Sin unidades', color: 'var(--color-coral-500)', bg: 'var(--color-coral-50)' },
  critico: { label: 'Crítico', color: 'var(--color-coral-500)', bg: 'var(--color-coral-50)' },
  bajo: { label: 'Bajo', color: 'var(--color-orange-ink)', bg: 'var(--color-orange-50)' },
  ok: { label: 'OK', color: 'var(--color-teal-600)', bg: 'var(--color-teal-50)' },
}

function money(n: number): string {
  return formatMoney(n)
}
</script>

<template>
  <!-- SECCIÓN 2: Costeo -->
  <section class="flex flex-col gap-[14px]">
    <div class="flex flex-col gap-[18px]">
      <div class="flex items-center justify-between mb-1">
        <span class="text-11 font-medium text-ink-muted uppercase tracking-[0.06em]">Modalidad de costo</span>
        <div class="checkbox-wrapper-10">
          <input type="checkbox" id="cb-cost-type" class="tgl tgl-flip" v-model="esSimple">
          <label for="cb-cost-type" data-tg-on="Simple" data-tg-off="Pack" class="tgl-btn"></label>
        </div>
      </div>

      <!-- Grid de campos de costo -->
      <div :class="esSimple ? 'grid grid-cols-2 gap-[14px]' : 'grid grid-cols-3 gap-4'">
        <div class="flex flex-col gap-1.5">
          <FloatingField
            id="ins-costo-paquete"
            :label="esSimple ? 'Costo unitario' : 'Costo pack'"
            type="number"
            prefix="$"
            v-model.number="costoPaquete"
            min="0"
            step="0.01"
            :invalid="!!errors.costoPaquete"
            :describedby="errors.costoPaquete ? 'err-costo-paquete' : undefined"
          />
          <div v-if="errors.costoPaquete" id="err-costo-paquete" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
            {{ errors.costoPaquete }}
          </div>
        </div>

        <!-- Unidades por pack -->
        <div v-if="!esSimple" class="flex flex-col gap-1.5">
          <FloatingField
            id="ins-cantidad-pack"
            label="Unidades por pack"
            type="number"
            v-model.number="cantidadPack"
            min="0.01"
            step="0.01"
            :invalid="!!errors.cantidadPack"
            :describedby="errors.cantidadPack ? 'err-cantidad-pack' : undefined"
          />
          <div v-if="errors.cantidadPack" id="err-cantidad-pack" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
            {{ errors.cantidadPack }}
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <FloatingField
            id="ins-unidad"
            label="Unidad de medida"
            required
            v-model="unidad"
            placeholder="Ej. pliego, m, rollo"
            :invalid="!!errors.unidad"
            :describedby="errors.unidad ? 'err-unidad' : undefined"
          />
          <div v-if="errors.unidad" id="err-unidad" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
            {{ errors.unidad }}
          </div>
        </div>
      </div>

      <!-- Costo unitario readonly destacado -->
      <div v-if="!esSimple" class="flex items-center justify-between text-13">
        <span class="text-11 text-ink-muted uppercase tracking-[0.06em] font-medium">Costo unitario calculado</span>
        <span class="text-18 font-medium text-violet-700 [font-variant-numeric:tabular-nums]">
          {{ money(costoUnitario) }} <span class="text-ink-muted font-normal text-13">/ {{ unidad || 'u' }}</span>
        </span>
      </div>
    </div>
  </section>

  <hr class="my-0">

  <!-- SECCIÓN 3: Control de stock -->
  <section class="flex flex-col gap-[14px]">
    <div class="flex items-center gap-2.5 mb-1">
      <h4 id="title-stock" class="text-11 text-ink-muted font-medium uppercase tracking-[0.06em] m-0">Control de stock</h4>
    </div>
    <div class="flex flex-col gap-[18px]">
      <div class="grid grid-cols-[1fr_1fr_2fr] gap-4 items-end">
        <div class="flex flex-col gap-1.5">
          <FloatingField
            id="ins-stock-actual"
            label="Stock actual"
            type="number"
            v-model.number="stockActual"
            min="0"
            step="1"
            :invalid="!!errors.stockActual"
            :describedby="errors.stockActual ? 'err-stock-actual' : undefined"
          />
          <div v-if="errors.stockActual" id="err-stock-actual" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
            {{ errors.stockActual }}
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <FloatingField
            id="ins-stock-minimo"
            label="Stock mínimo"
            type="number"
            v-model.number="stockMinimo"
            min="0"
            step="1"
            :invalid="!!errors.stockMinimo"
            :describedby="errors.stockMinimo ? 'err-stock-minimo' : undefined"
          />
          <div v-if="errors.stockMinimo" id="err-stock-minimo" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
            {{ errors.stockMinimo }}
          </div>
        </div>

        <!-- Bloque de nivel inline -->
        <div class="flex flex-col gap-1 justify-end pb-0.5">
          <div class="flex justify-between items-center">
            <div class="text-10 text-ink-muted text-left">
              <span>{{ stockMinimo > 0 ? Math.round((stockActual / stockMinimo) * 100) + '%' : 'sin mín.' }}</span>
            </div>
            <span
              class="inline-flex items-center gap-2 text-13 font-medium px-3 py-[5px] rounded-full"
              :style="{ background: nivelMeta[nivel].bg, color: nivelMeta[nivel].color }"
            >
              <span class="w-[7px] h-[7px] rounded-full bg-current" /> {{ nivelMeta[nivel].label }}
            </span>
          </div>
          <div class="h-2 rounded-full bg-border overflow-hidden mt-1">
            <div
              class="h-full rounded-full transition-[width,background] duration-200"
              :style="{ width: fillPct + '%', background: nivelMeta[nivel].color }"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
