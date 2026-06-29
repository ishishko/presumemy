<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { setEditorMode, resetEditorMode, editorDirty } from '@/shared/lib/editorMode'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    dirty?: boolean
  }>(),
  {
    dirty: false,
  }
)

const emit = defineEmits<{
  close: []
  save: []
}>()

// Sincronizar el estado del editor y la cabecera
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.body.classList.add('no-scroll')
    setEditorMode(
      true,
      props.title,
      () => emit('save'),
      () => emit('close')
    )
    editorDirty.value = props.dirty
  } else {
    document.body.classList.remove('no-scroll')
    resetEditorMode()
  }
}, { immediate: true })

watch(() => props.dirty, (isDirty) => {
  if (props.open) {
    editorDirty.value = isDirty
  }
})

onUnmounted(() => {
  document.body.classList.remove('no-scroll')
  resetEditorMode()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="open"
        class="fixed top-[56px] left-[240px] right-0 bottom-0 z-30 bg-page-bg grid grid-rows-[1fr_auto] overflow-hidden"
      >
        <div class="flex-1 overflow-y-auto">
          <slot name="body" />
        </div>
        <div v-if="$slots.foot" class="flex items-center gap-2.5 px-6 py-4 bg-surface border-t border-border justify-end">
          <slot name="foot" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Transitions */
.overlay-enter-active {
  animation: overlay-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.overlay-leave-active {
  animation: overlay-out 200ms cubic-bezier(0.4, 0, 1, 1) both;
}

@keyframes overlay-in {
  from { transform: translateY(6px); opacity: 0.6; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes overlay-out {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(4px); opacity: 0.6; }
}
</style>
