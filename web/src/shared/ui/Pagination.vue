<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'

defineProps<{
  currentPage: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  pageSize: number
}>()

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
  'prev': []
  'next': []
}>()

const sizes = [10, 25, 50]

function changeSize(size: number) {
  emit('update:pageSize', size)
  emit('update:currentPage', 1)
}
</script>

<template>
  <div class="flex items-center justify-between px-[18px] py-3 border-t border-border bg-surface text-13 text-ink-muted">
    <div class="flex gap-1">
      Mostrando <span class="font-semibold text-ink font-mono tabular-nums">{{ startIndex }}</span> al <span class="font-semibold text-ink font-mono tabular-nums">{{ endIndex }}</span> de <span class="font-semibold text-ink font-mono tabular-nums">{{ totalItems }}</span>
    </div>
    
    <div class="flex items-center gap-3">
      <button
        class="flex items-center justify-center w-7 h-7 border border-border-strong rounded-md bg-transparent text-ink cursor-pointer hover:bg-page-bg hover:border-ink-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:shadow-focus-ring"
        :disabled="currentPage === 1"
        @click="emit('prev')"
        title="Página anterior"
      >
        <ChevronLeft :size="16" />
      </button>
      
      <span class="text-13">
        Página <span class="font-semibold text-ink font-mono tabular-nums">{{ currentPage }}</span> de <span class="font-semibold text-ink font-mono tabular-nums">{{ totalPages }}</span>
      </span>
      
      <button
        class="flex items-center justify-center w-7 h-7 border border-border-strong rounded-md bg-transparent text-ink cursor-pointer hover:bg-page-bg hover:border-ink-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:shadow-focus-ring"
        :disabled="currentPage === totalPages"
        @click="emit('next')"
        title="Página siguiente"
      >
        <ChevronRight :size="16" />
      </button>
    </div>
    
    <div class="flex items-center gap-2.5">
      <span class="text-12">Filas por página</span>
      <div class="flex bg-ink-muted/5 rounded-md p-0.5 border border-border">
        <button
          v-for="s in sizes"
          :key="s"
          type="button"
          class="border-0 bg-transparent px-2.5 py-1 text-11 font-semibold rounded cursor-pointer transition-colors"
          :class="[pageSize === s ? 'bg-surface text-ink shadow-1' : 'text-ink-muted hover:text-ink']"
          @click="changeSize(s)"
        >
          {{ s }}
        </button>
      </div>
    </div>
  </div>
</template>
