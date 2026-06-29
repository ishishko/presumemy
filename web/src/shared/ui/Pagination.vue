<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  'update:currentPage': [value: number]
}>()

function prev() {
  if (props.currentPage > 1) emit('update:currentPage', props.currentPage - 1)
}

function next() {
  if (props.currentPage < props.totalPages) emit('update:currentPage', props.currentPage + 1)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      class="w-9 h-9 inline-flex items-center justify-center rounded-md bg-transparent border-0 text-ink-muted cursor-pointer hover:bg-page-bg disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="currentPage <= 1"
      @click="prev"
    >
      <ChevronLeft :size="18" />
    </button>
    <span class="text-13 text-ink-muted tabular-nums">
      {{ currentPage }} / {{ totalPages }}
    </span>
    <button
      class="w-9 h-9 inline-flex items-center justify-center rounded-md bg-transparent border-0 text-ink-muted cursor-pointer hover:bg-page-bg disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="currentPage >= totalPages"
      @click="next"
    >
      <ChevronRight :size="18" />
    </button>
  </div>
</template>
