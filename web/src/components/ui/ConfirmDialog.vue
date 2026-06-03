<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

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

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('cancel')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="open" class="confirm-mask" @click="emit('cancel')">
        <div class="confirm-dialog" @click.stop>
          <h4>{{ title }}</h4>
          <p>{{ message }}</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="emit('cancel')">
              {{ cancelLabel || 'Cancelar' }}
            </button>
            <button
              :class="variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'"
              @click="emit('confirm')"
            >
              {{ confirmLabel || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-mask {
  position: fixed;
  inset: 0;
  background: rgba(28, 26, 30, 0.30);
  display: grid;
  place-items: center;
  z-index: 60;
}

.confirm-dialog {
  background: var(--surface);
  border-radius: var(--r-lg);
  padding: 22px;
  width: 380px;
  box-shadow: var(--shadow-2);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.confirm-dialog h4 {
  font-size: 17px;
  font-weight: 500;
  color: var(--ink);
  margin: 0;
}

.confirm-dialog p {
  font-size: 13px;
  color: var(--ink-muted);
  margin: 0;
  line-height: 1.45;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* Transitions */
.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 140ms ease;
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
</style>
