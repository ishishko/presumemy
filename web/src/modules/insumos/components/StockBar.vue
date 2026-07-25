<script setup lang="ts">
import { computed } from 'vue'
import { getNivel, getFillPct } from '@/modules/insumos/stock'

const props = defineProps<{
  stock: number
  minimo: number
}>()

const nivel = computed(() => getNivel(props.stock, props.minimo))
const fillPct = computed(() => getFillPct(props.stock, props.minimo))

const BAR_COLORS: Record<string, string> = {
  ok: 'bg-canal-whatsapp',
  sin_control: 'bg-canal-whatsapp',
  bajo: 'bg-yellow',
  critico: 'bg-coral-500',
  sin_unidades: 'bg-coral-500',
}
</script>

<template>
  <div class="h-1.5 bg-page-bg rounded-pill overflow-hidden">
    <div
      class="h-full rounded-pill transition-all"
      :class="BAR_COLORS[nivel]"
      :style="{ width: `${fillPct}%` }"
    />
  </div>
</template>
