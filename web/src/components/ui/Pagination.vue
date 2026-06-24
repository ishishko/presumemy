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
  <div class="pagination-container">
    <div class="pagination-info">
      Mostrando <span class="tabular">{{ startIndex }}</span> al <span class="tabular">{{ endIndex }}</span> de <span class="tabular">{{ totalItems }}</span>
    </div>
    
    <div class="pagination-controls">
      <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="emit('prev')"
        title="Página anterior"
      >
        <ChevronLeft :size="16" />
      </button>
      
      <span class="pagination-page">
        Página <span class="tabular font-medium">{{ currentPage }}</span> de <span class="tabular font-medium">{{ totalPages }}</span>
      </span>
      
      <button
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="emit('next')"
        title="Página siguiente"
      >
        <ChevronRight :size="16" />
      </button>
    </div>
    
    <div class="pagination-size">
      <span class="size-label">Filas por página</span>
      <div class="size-options">
        <button
          v-for="s in sizes"
          :key="s"
          :class="['size-btn', pageSize === s && 'active']"
          @click="changeSize(s)"
        >
          {{ s }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  font-size: 13px;
  color: var(--ink-muted);
}

.pagination-info {
  display: flex;
  gap: 4px;
}

.tabular {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--ink);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  transition: all 120ms ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--page-bg);
  border-color: var(--ink-muted);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-page {
  font-size: 13px;
}

.font-medium {
  font-weight: 500;
}

.pagination-size {
  display: flex;
  align-items: center;
  gap: 10px;
}

.size-label {
  font-size: 12px;
}

.size-options {
  display: flex;
  background: var(--page-bg);
  border-radius: 6px;
  padding: 2px;
  border: 1px solid var(--border);
}

.size-btn {
  border: none;
  background: transparent;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  color: var(--ink-muted);
  cursor: pointer;
  transition: all 120ms ease;
}

.size-btn.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-1);
}
</style>
