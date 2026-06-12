<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
  disabled?: boolean
  ariaLabel?: string
  ariaLabelledby?: string
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const groupEl = ref<HTMLElement | null>(null)

function select(v: string) {
  if (!props.disabled) emit('update:modelValue', v)
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return
  e.preventDefault()
  const idx = props.options.findIndex(o => o.value === props.modelValue)
  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
  const next = props.options[(idx + dir + props.options.length) % props.options.length]
  if (next) {
    emit('update:modelValue', next.value)
    requestAnimationFrame(() => {
      groupEl.value?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
    })
  }
}
</script>

<template>
  <div
    ref="groupEl"
    class="segmented"
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
      :aria-checked="modelValue === opt.value"
      :tabindex="modelValue === opt.value ? 0 : -1"
      :class="['seg-btn', modelValue === opt.value && 'active']"
      :disabled="disabled"
      @click="select(opt.value)"
    >{{ opt.label }}</button>
  </div>
</template>
