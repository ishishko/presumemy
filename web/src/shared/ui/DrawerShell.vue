<script setup lang="ts">
import { X } from '@lucide/vue'
import { onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  eyebrow?: string
  width?: string
}>(), {
  width: '520px',
})

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
      <div v-if="open" class="fixed inset-0 z-80 pointer-events-none">
        <div class="absolute inset-0 bg-ink/40 pointer-events-auto" @click="emit('close')"></div>
        <aside
          class="absolute top-0 right-0 bottom-0 bg-surface border-l border-border grid grid-rows-[auto_1fr_auto] pointer-events-auto shadow-2 z-81"
          :style="{ width }"
        >
          <div class="flex items-center gap-3.5 py-4.5 px-5.5 border-b border-border">
            <div v-if="eyebrow || title" class="flex flex-col gap-1 flex-1 min-w-0">
              <span v-if="eyebrow" class="text-11 uppercase tracking-0.08em text-ink-muted font-medium">{{ eyebrow }}</span>
              <h3 class="text-17 font-medium m-0 leading-1.2">{{ title }}</h3>
            </div>
            <slot name="head-actions"></slot>
            <div class="flex-1"></div>
            <button class="w-9 h-9 inline-flex items-center justify-center rounded-md bg-transparent border-0 text-ink-muted cursor-pointer hover:bg-page-bg" @click="emit('close')" title="Cerrar">
              <X :size="18" />
            </button>
          </div>
          <div class="overflow-y-auto p-5.5">
            <slot name="body"></slot>
          </div>
          <div v-if="$slots.foot" class="flex items-center gap-2.5 py-3.5 px-5.5 border-t border-border justify-end">
            <slot name="foot"></slot>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active aside,
.drawer-leave-active aside {
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.drawer-enter-from aside,
.drawer-leave-to aside {
  transform: translateX(100%);
}
.drawer-enter-active > div:first-child,
.drawer-leave-active > div:first-child {
  transition: opacity 220ms ease;
}
.drawer-enter-from > div:first-child,
.drawer-leave-to > div:first-child {
  opacity: 0;
}
</style>
