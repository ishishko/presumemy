<script setup lang="ts">
defineProps<{
  title: string
  sub?: string
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <div>
      <h1 class="text-28">{{ title }}</h1>
      <div v-if="sub" class="text-13 text-ink-muted">{{ sub }}</div>
    </div>
    <div class="flex items-center gap-2">
      <slot />
    </div>
  </div>
</template>
