<script setup lang="ts">
import { X } from '@lucide/vue'
import { onMounted, onUnmounted } from 'vue'

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
          <div class="drawer-head">
            <div v-if="eyebrow || title" class="drawer-title-block">
              <span v-if="eyebrow" class="drawer-eyebrow">{{ eyebrow }}</span>
              <h3>{{ title }}</h3>
            </div>
            <slot name="head-actions"></slot>
            <div class="spacer"></div>
            <button class="icon-btn" @click="emit('close')" title="Cerrar">
              <X :size="18" />
            </button>
          </div>
          <div class="drawer-body">
            <slot name="body"></slot>
          </div>
          <div v-if="$slots.foot" class="drawer-foot">
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
  z-index: 50;
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
}

.drawer-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}

.drawer-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.drawer-eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  font-weight: 500;
}

.drawer-head h3 {
  font-size: 17px;
  font-weight: 500;
  margin: 0;
  line-height: 1.2;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px;
}

.drawer-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--border);
  justify-content: flex-end;
}

.spacer { flex: 1; }

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
