<script setup lang="ts">
const model = defineModel<boolean>({ required: true })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    disabled: false,
  }
)

function toggle() {
  if (!props.disabled) model.value = !model.value
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-label="ariaLabel"
    :disabled="disabled"
    class="relative w-9 h-5 rounded-pill transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:shadow-focus-ring"
    :class="model ? 'bg-teal-500' : 'bg-ink-muted/30'"
    @click="toggle"
    @keydown.space.prevent="toggle"
    @keydown.enter.prevent="toggle"
  >
    <span
      class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
      :class="model ? 'translate-x-4' : 'translate-x-0'"
    />
  </button>
</template>
