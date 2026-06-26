<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean
  }>(),
  {
    padded: true,
  }
)
</script>

<template>
  <div
    class="bg-surface border border-border rounded-lg shadow-1"
    :class="padded ? 'p-6' : ''"
  >
    <slot />
  </div>
</template>
