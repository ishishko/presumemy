<script setup lang="ts">
import { Check, X, Undo2 } from '@lucide/vue'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss, undo } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['toast', `toast-${t.type}`]"
        >
          <div class="toast-icon">
            <Check v-if="t.type === 'success'" :size="16" />
            <X v-else-if="t.type === 'error'" :size="16" />
          </div>
          <span class="toast-message">{{ t.message }}</span>
          <button
            v-if="t.undo"
            class="toast-undo"
            @click="undo(t.id)"
          >
            <Undo2 :size="14" /> Deshacer
          </button>
          <button class="toast-close" @click="dismiss(t.id)">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-2);
  min-width: 300px;
  max-width: 420px;
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.toast-success .toast-icon { background: var(--teal-100); color: var(--teal-600); }
.toast-error .toast-icon { background: var(--coral-50); color: var(--coral-500); }
.toast-info .toast-icon { background: var(--violet-100); color: var(--violet-600); }

.toast-message {
  flex: 1;
  font-size: 13px;
  color: var(--ink);
  min-width: 0;
}

.toast-undo {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 0;
  color: var(--violet-600);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.toast-undo:hover { background: var(--violet-50); }

.toast-close {
  background: transparent;
  border: 0;
  color: var(--ink-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  flex-shrink: 0;
}

.toast-close:hover { background: var(--page-bg); }

/* Transitions */
.toast-enter-active { transition: all 200ms ease; }
.toast-leave-active { transition: all 150ms ease; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
.toast-move { transition: transform 150ms ease; }
</style>
