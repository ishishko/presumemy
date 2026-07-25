<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const cancelBtnRef = ref<HTMLButtonElement | null>(null)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      cancelBtnRef.value?.focus()
    })
  }
}, { immediate: true })

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('cancel')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="open" class="fixed inset-0 bg-ink/30 grid place-items-center z-90" @click="emit('cancel')">
        <div class="bg-surface rounded-lg p-5.5 w-95 shadow-2 border border-border flex flex-col gap-3.5" @click.stop>
          <h4 class="text-17 font-medium text-ink m-0">{{ title }}</h4>
          <p class="text-13 text-ink-muted m-0 leading-1.45">{{ message }}</p>
          <div class="flex gap-2 justify-end">
            <BaseButton ref="cancelBtnRef" variant="secondary" @click="emit('cancel')">
              {{ cancelLabel || 'Cancelar' }}
            </BaseButton>
            <BaseButton
              :variant="variant === 'danger' ? 'danger' : 'primary'"
              @click="emit('confirm')"
            >
              {{ confirmLabel || 'Confirmar' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 140ms ease;
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
</style>
