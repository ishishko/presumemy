<script setup lang="ts">
defineProps<{
  title: string
  sub?: string
}>()
</script>

<template>
  <div class="page-head">
    <div class="title">
      <h1>{{ title }}</h1>
      <div v-if="sub" class="sub">{{ sub }}</div>
    </div>
    <div class="actions">
      <slot />
    </div>
  </div>
</template>
