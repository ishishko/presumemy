<script setup lang="ts">
import { ref } from 'vue'

const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    options: { value: string; label: string }[]
    disabled?: boolean
    ariaLabel?: string
    ariaLabelledby?: string
  }>(),
  {
    disabled: false,
  }
)

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
    class="inline-flex p-0.5 bg-ink-muted/5 rounded-md border border-border"
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
      :disabled="disabled"
      class="px-3 py-1.5 text-13 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:shadow-focus-ring disabled:opacity-50 disabled:pointer-events-none"
      :class="model === opt.value ? 'bg-surface text-ink shadow-1 font-medium' : 'text-ink-muted hover:text-ink'"
      @click="select(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
