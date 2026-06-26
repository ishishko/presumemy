<script setup lang="ts">
import { X } from '@lucide/vue'
import { onMounted, onUnmounted } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps<{
  open: boolean
  title: string
  eyebrow?: string
  width?: string
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
    <Transition name="drawer">
      <div v-if="open" class="drawer-container">
        <div class="drawer-scrim" @click="emit('close')"></div>
        <aside class="drawer-panel" :style="width ? { width } : {}">
          <div class="flex items-center gap-3.5 px-[22px] py-[18px] border-b border-border">
            <div v-if="eyebrow || title" class="flex flex-col gap-1 flex-1 min-w-0">
              <span v-if="eyebrow" class="text-11 uppercase tracking-[0.08em] text-ink-muted font-medium">{{ eyebrow }}</span>
              <h3 class="text-[17px] font-medium m-0 leading-tight">{{ title }}</h3>
            </div>
            <slot name="head-actions"></slot>
            <div class="flex-1"></div>
            <BaseButton
              variant="ghost"
              icon
              @click="emit('close')"
              title="Cerrar"
            >
              <X :size="18" />
            </BaseButton>
          </div>
          <div class="flex-1 overflow-y-auto p-[22px]">
            <slot name="body"></slot>
          </div>
          <div v-if="$slots.foot" class="flex items-center gap-2.5 px-[22px] py-3.5 border-t border-border justify-end">
            <slot name="foot"></slot>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-container {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
}

.drawer-scrim {
  position: absolute;
  inset: 0;
  background: rgba(28, 26, 30, 0.40);
  pointer-events: auto;
}

.drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 520px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: grid;
  grid-template-rows: auto 1fr auto;
  pointer-events: auto;
  box-shadow: var(--shadow-2);
  z-index: 81;
}

/* Transitions */
.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}

.drawer-enter-active .drawer-scrim,
.drawer-leave-active .drawer-scrim {
  transition: opacity 220ms ease;
}

.drawer-enter-from .drawer-scrim,
.drawer-leave-to .drawer-scrim {
  opacity: 0;
}
</style>
