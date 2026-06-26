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
  ok: 'bg-teal-100 text-teal-700',
  warning: 'bg-yellow text-yellow-ink',
  danger: 'bg-coral-50 text-coral-700',
  info: 'bg-violet-100 text-violet-700',
  neutral: 'bg-page-bg text-ink-muted',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-12 font-medium"
    :class="[TONES[tone]]"
  >
    <slot name="dot" />
    {{ label }}
  </span>
</template>
