<script setup lang="ts">
import { Pencil, Trash2 } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    editLabel?: string
    deleteLabel?: string
    showEdit?: boolean
    showDelete?: boolean
  }>(),
  {
    editLabel: 'Editar',
    deleteLabel: 'Eliminar',
    showEdit: true,
    showDelete: true,
  }
)

const emit = defineEmits<{
  edit: []
  delete: []
}>()
</script>

<template>
  <div class="flex gap-1 justify-end items-center" @click.stop>
    <button
      v-if="showEdit"
      type="button"
      :title="editLabel"
      class="p-1.5 rounded text-ink-muted hover:bg-page-bg hover:text-ink transition-colors cursor-pointer focus-visible:outline-none focus-visible:shadow-focus-ring"
      @click="emit('edit')"
    >
      <Pencil :size="14" />
    </button>
    <button
      v-if="showDelete"
      type="button"
      :title="deleteLabel"
      class="p-1.5 rounded text-ink-muted hover:bg-coral-50 hover:text-coral-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:shadow-danger-ring"
      @click="emit('delete')"
    >
      <Trash2 :size="14" />
    </button>
  </div>
</template>
