<script setup lang="ts">
import { ref } from 'vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    icon?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    icon: false,
    disabled: false,
    type: 'button',
  }
)

const buttonEl = ref<HTMLButtonElement | null>(null)

const BASE = 'inline-flex items-center justify-center gap-2 rounded-md text-14 font-medium transition active:translate-y-px disabled:opacity-50 disabled:pointer-events-none cursor-pointer'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-teal-500 text-white hover:brightness-95 focus-visible:outline-none focus-visible:shadow-focus-ring',
  secondary: 'bg-surface border border-border-strong text-ink hover:bg-page-bg focus-visible:outline-none focus-visible:shadow-focus-ring',
  ghost: 'bg-transparent text-violet-700 hover:bg-violet-50 focus-visible:outline-none focus-visible:shadow-focus-ring',
  danger: 'bg-coral-500 text-white hover:brightness-95 focus-visible:outline-none focus-visible:shadow-danger-ring',
}

defineExpose({
  focus: () => buttonEl.value?.focus(),
  $el: buttonEl
})
</script>

<template>
  <button
    ref="buttonEl"
    :type="type"
    :disabled="disabled"
    :class="[BASE, VARIANTS[variant], icon ? 'p-2 w-9 h-9' : 'px-4 py-2']"
  >
    <slot />
  </button>
</template>
