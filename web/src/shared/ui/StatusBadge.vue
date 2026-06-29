<script setup lang="ts">
type Tone = 'ok' | 'warning' | 'danger' | 'info' | 'neutral'

const props = withDefaults(
  defineProps<{
    label: string
    tone?: Tone
  }>(),
  {
    tone: 'neutral',
  }
)

const TONES: Record<Tone, string> = {
  ok: 'teal',
  warning: 'yellow',
  danger: 'coral',
  info: 'violet',
  neutral: 'default',
}
</script>

<template>
  <span
    class="badge"
    :class="[TONES[tone]]"
  >
    <slot name="dot" />
    {{ label }}
  </span>
</template>
