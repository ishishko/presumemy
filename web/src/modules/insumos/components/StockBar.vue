<script setup lang="ts">
import { computed } from 'vue'
import { getNivel, getFillPct, type Nivel } from '../stock'

const props = defineProps<{
  stock: number
  minimo: number
}>()

const nivel = computed(() => getNivel(props.stock, props.minimo))
const pct = computed(() => getFillPct(props.stock, props.minimo))

const FILL_COLORS: Record<Nivel, string> = {
  sin_unidades: 'bg-coral-500', // o bg-coral-700 para más contraste
  critico: 'bg-coral-500',
  bajo: 'bg-yellow',
  ok: 'bg-teal-500',
}
</script>

<template>
  <div class="h-1.5 w-full rounded-pill bg-ink-muted/15 overflow-hidden" title="Nivel de stock">
    <div
      class="h-full rounded-pill transition-[width] duration-300 ease-out"
      :class="[FILL_COLORS[nivel]]"
      :style="{ width: `${pct}%` }"
    />
  </div>
</template>
