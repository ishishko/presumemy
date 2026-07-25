<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}>()
</script>

<template>
  <div class="bg-surface border border-border rounded-lg p-4 flex flex-col gap-1">
    <span class="text-12 text-ink-muted uppercase tracking-0.06em font-medium">{{ label }}</span>
    <span class="text-22 font-medium text-ink tabular-nums">{{ value }}</span>
    <span v-if="trendValue" class="text-12 font-medium" :class="{
      'text-green-500': trend === 'up',
      'text-coral-500': trend === 'down',
      'text-ink-muted': trend === 'neutral'
    }">{{ trendValue }}</span>
  </div>
</template>
