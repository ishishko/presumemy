<script setup lang="ts">
defineProps<{
  padding?: string
}>()
</script>

<template>
  <div class="bg-surface border border-border rounded-lg shadow-1" :class="padding || 'p-5'">
    <slot />
  </div>
</template>
