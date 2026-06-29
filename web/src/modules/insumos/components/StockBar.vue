<script setup lang="ts">
import { computed } from 'vue'
import { getNivel, getFillPct, type Nivel } from '../stock'

const props = defineProps<{
  stock: number
  minimo: number
}>()

const nivel = computed(() => getNivel(props.stock, props.minimo))
const pct = computed(() => getFillPct(props.stock, props.minimo))

const CLASSES: Record<Nivel, string> = {
  sin_unidades: 'low',
  critico: 'low',
  bajo: 'warn',
  ok: 'ok',
}
</script>

<template>
  <div class="stock-bar" :class="CLASSES[nivel]" title="Nivel de stock">
    <div :style="{ width: `${pct}%` }" />
  </div>
</template>
