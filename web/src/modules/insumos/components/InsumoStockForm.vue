<script setup lang="ts">
import { computed } from 'vue'
import { getNivel } from '@/modules/insumos/stock'
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

const fillPct = computed(() => {
  if (stockMinimo.value === 0) return stockActual.value > 0 ? 100 : 0
  return Math.min(100, (stockActual.value / stockMinimo.value) * 100)
})

const nivelMeta = {
  sin_unidades: { label: 'Sin unidades', color: 'var(--coral-500)', bg: 'var(--coral-50)' },
  critico: { label: 'Crítico', color: 'var(--coral-500)', bg: 'var(--coral-50)' },
  bajo: { label: 'Bajo', color: 'var(--amber-600)', bg: 'var(--amber-50)' },
  ok: { label: 'OK', color: 'var(--teal-600)', bg: 'var(--teal-50)' },
}

function money(n: number): string {
  return formatMoney(n)
}
</script>

<template>
  <!-- SECCIÓN 2: Costeo -->
  <section class="form-section">
    <div class="form-section-body">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span class="id-cost-label" style="font-size: 11px; font-weight: 500; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.06em;">Modalidad de costo</span>
        <div class="checkbox-wrapper-10">
          <input type="checkbox" id="cb-cost-type" class="tgl tgl-flip" v-model="esSimple">
          <label for="cb-cost-type" data-tg-on="Simple" data-tg-off="Pack" class="tgl-btn"></label>
        </div>
      </div>

      <!-- Grid de campos de costo -->
      <div :class="esSimple ? 'form-row' : 'id-grid-3'">
        <div class="field">
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
          <div v-if="errors.costoPaquete" id="err-costo-paquete" class="field-error" role="alert">
            {{ errors.costoPaquete }}
          </div>
        </div>

        <!-- Unidades por pack -->
        <div v-if="!esSimple" class="field">
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
          <div v-if="errors.cantidadPack" id="err-cantidad-pack" class="field-error" role="alert">
            {{ errors.cantidadPack }}
          </div>
        </div>

        <div class="field">
          <FloatingField
            id="ins-unidad"
            label="Unidad de medida"
            required
            v-model="unidad"
            placeholder="Ej. pliego, m, rollo"
            :invalid="!!errors.unidad"
            :describedby="errors.unidad ? 'err-unidad' : undefined"
          />
          <div v-if="errors.unidad" id="err-unidad" class="field-error" role="alert">
            {{ errors.unidad }}
          </div>
        </div>
      </div>

      <!-- Costo unitario readonly destacado -->
      <div v-if="!esSimple" class="id-cost-row grand">
        <span class="id-cost-label">Costo unitario calculado</span>
        <span class="id-cost-value text-mono">
          {{ money(costoUnitario) }} <span class="unit-ref">/ {{ unidad || 'u' }}</span>
        </span>
      </div>
    </div>
  </section>

  <hr class="id-section-divider">

  <!-- SECCIÓN 3: Control de stock -->
  <section class="form-section">
    <div class="form-section-head" style="margin-bottom: 4px;">
      <h4 id="title-stock" style="font-size: 11px; color: var(--ink-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; margin: 0;">Control de stock</h4>
    </div>
    <div class="form-section-body">
      <div class="id-grid-stock" style="align-items: flex-end;">
        <div class="field">
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
          <div v-if="errors.stockActual" id="err-stock-actual" class="field-error" role="alert">
            {{ errors.stockActual }}
          </div>
        </div>

        <div class="field">
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
          <div v-if="errors.stockMinimo" id="err-stock-minimo" class="field-error" role="alert">
            {{ errors.stockMinimo }}
          </div>
        </div>

        <!-- Bloque de nivel inline -->
        <div class="id-level-block-inline">
          <div class="row" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="id-level-stats-inline" style="text-align: left;">
              <span>{{ stockMinimo > 0 ? Math.round((stockActual / stockMinimo) * 100) + '%' : 'sin mín.' }}</span>
            </div>
            <span
              class="id-level-badge"
              :style="{ background: nivelMeta[nivel].bg, color: nivelMeta[nivel].color }"
            >
              <span class="dot" /> {{ nivelMeta[nivel].label }}
            </span>
          </div>
          <div class="id-level-bar" :class="{ 'sin_unidades': nivel === 'sin_unidades' }" style="margin-top: 4px;">
            <div
              class="fill"
              :style="{ width: fillPct + '%', background: nivelMeta[nivel].color }"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
