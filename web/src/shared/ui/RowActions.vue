<script setup lang="ts">
import { Pencil, Trash2 } from '@lucide/vue'

const emit = defineEmits<{
  edit: []
  delete: []
}>()
</script>

<template>
  <div class="flex items-center gap-1">
    <button
      class="w-8 h-8 inline-flex items-center justify-center rounded-md bg-transparent border-0 text-ink-muted cursor-pointer hover:bg-page-bg hover:text-ink transition-colors"
      @click="emit('edit')"
      title="Editar"
    >
      <Pencil :size="15" />
    </button>
    <button
      class="w-8 h-8 inline-flex items-center justify-center rounded-md bg-transparent border-0 text-ink-muted cursor-pointer hover:bg-coral-50 hover:text-coral-500 transition-colors"
      @click="emit('delete')"
      title="Eliminar"
    >
      <Trash2 :size="15" />
    </button>
  </div>
</template>
