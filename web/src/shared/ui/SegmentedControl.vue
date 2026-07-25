<script setup lang="ts">
import { ref } from 'vue'

const model = defineModel<string>()
const props = withDefaults(defineProps<{
  options: { value: string; label: string }[]
  disabled?: boolean
  ariaLabel?: string
  ariaLabelledby?: string
}>(), {
  disabled: false,
})

const groupEl = ref<HTMLElement | null>(null)

function select(v: string) {
  if (!props.disabled) model.value = v
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return
  e.preventDefault()
  const idx = props.options.findIndex(o => o.value === model.value)
  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
  const next = props.options[(idx + dir + props.options.length) % props.options.length]
  if (next) {
    model.value = next.value
    requestAnimationFrame(() => {
      groupEl.value?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
    })
  }
}
</script>

<template>
  <div
    ref="groupEl"
    class="inline-flex items-center p-0.75 bg-surface border border-border-strong rounded-[10px] gap-0.5"
    role="radiogroup"
    :aria-label="ariaLabel"
    :aria-labelledby="ariaLabelledby"
    @keydown="onKeydown"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="model === opt.value"
      :tabindex="model === opt.value ? 0 : -1"
      class="bg-transparent border-0 font-sans text-13 font-medium py-1.75 px-4 rounded-lg cursor-pointer inline-flex items-center gap-1.75 transition-colors disabled:opacity-50"
      :class="model === opt.value
        ? 'bg-violet-700 text-white'
        : 'text-ink-muted hover:text-ink'"
      :disabled="disabled"
      @click="select(opt.value)"
    >{{ opt.label }}</button>
  </div>
</template>
