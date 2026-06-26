<script setup lang="ts">
import BaseCard from './BaseCard.vue'

type Tone = 'ok' | 'danger' | 'neutral'

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    sub?: string
    tone?: Tone
  }>(),
  {
    tone: 'neutral',
  }
)

const SUB_TONES: Record<Tone, string> = {
  ok: 'text-green-700',
  danger: 'text-coral-700',
  neutral: 'text-ink-muted',
}
</script>

<template>
  <BaseCard>
    <div class="flex flex-col gap-1">
      <span class="text-11 uppercase tracking-[0.06em] text-ink-muted font-medium">{{ label }}</span>
      <span class="text-28 font-medium text-ink font-mono tabular-nums leading-none">{{ value }}</span>
      <span v-if="sub" class="text-12 font-medium" :class="[SUB_TONES[tone]]">{{ sub }}</span>
    </div>
  </BaseCard>
</template>
