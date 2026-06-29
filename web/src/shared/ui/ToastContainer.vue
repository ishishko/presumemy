<script setup lang="ts">
import { Check, X, Undo2 } from '@lucide/vue'
import { useToast } from '@/shared/lib/useToast'

const { toasts, dismiss, undo } = useToast()

const ICON_STYLES: Record<string, string> = {
  success: 'bg-teal-100 text-teal-600',
  error: 'bg-coral-50 text-coral-500',
  info: 'bg-violet-100 text-violet-600',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-100 flex flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="flex items-center gap-2.5 py-3 px-4 bg-surface border border-border rounded-md shadow-2 min-w-75 max-w-105"
        >
          <div class="flex-shrink-0 w-6 h-6 rounded-full grid place-items-center" :class="ICON_STYLES[t.type]">
            <Check v-if="t.type === 'success'" :size="16" />
            <X v-else-if="t.type === 'error'" :size="16" />
          </div>
          <span class="flex-1 text-13 text-ink min-w-0">{{ t.message }}</span>
          <button
            v-if="t.undo"
            class="flex items-center gap-1 bg-transparent border-0 text-violet-600 text-12 font-medium cursor-pointer py-1 px-2 rounded-md flex-shrink-0 hover:bg-violet-50"
            @click="undo(t.id)"
          >
            <Undo2 :size="14" /> Deshacer
          </button>
          <button class="bg-transparent border-0 text-ink-muted cursor-pointer p-1 rounded flex-shrink-0 hover:bg-page-bg" @click="dismiss(t.id)">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active { transition: all 200ms ease; }
.toast-leave-active { transition: all 150ms ease; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
.toast-move { transition: transform 150ms ease; }
</style>
