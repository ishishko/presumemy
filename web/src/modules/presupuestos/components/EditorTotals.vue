<script setup lang="ts">
import { formatMoney } from '@/shared/lib/format'

// Props
defineProps<{
  subtotal: number
  total: number
}>()

function money(n: number): string {
  return formatMoney(n)
}
</script>

<template>
  <div class="ed-totals">
    <div class="r">
      <span>Subtotal</span>
      <span class="num">{{ money(subtotal) }}</span>
    </div>
    <div class="r grand">
      <span>Total</span>
      <span class="num v">{{ money(total) }}</span>
    </div>
  </div>
</template>
