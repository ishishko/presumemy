<script setup lang="ts">
import { X } from '@lucide/vue'
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  open: boolean
  title?: string
}>()

const emit = defineEmits<{
  close: []
}>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="open" class="fixed inset-0 z-90 bg-surface flex flex-col">
        <header v-if="title || $slots.header" class="flex items-center gap-4 px-6 py-4 border-b border-border">
          <slot name="header">
            <h2 class="text-22 font-medium m-0">{{ title }}</h2>
          </slot>
          <div class="flex-1" />
          <slot name="header-actions" />
          <button
            class="w-9 h-9 inline-flex items-center justify-center rounded-md bg-transparent border-0 text-ink-muted cursor-pointer hover:bg-page-bg"
            @click="emit('close')"
            title="Cerrar"
          >
            <X :size="20" />
          </button>
        </header>
        <div class="flex-1 overflow-y-auto">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 200ms ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
