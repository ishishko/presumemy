<script setup lang="ts">
type Tone = 'default' | 'lavender' | 'mint' | 'pink' | 'yellow' | 'coral' | 'violet' | 'teal'

const props = defineProps<{
  label: string
  tone?: Tone
  dot?: boolean
}>()

const TONES: Record<Tone, string> = {
  default: 'bg-page-bg text-ink border border-border',
  lavender: 'bg-lavender text-ink',
  mint: 'bg-mint text-ink',
  pink: 'bg-pink-soft text-ink',
  yellow: 'bg-yellow text-yellow-ink',
  coral: 'bg-coral-50 text-coral-500',
  violet: 'bg-violet-100 text-violet-700',
  teal: 'bg-teal-100 text-teal-700',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-pill text-12 font-medium"
    :class="TONES[tone || 'default']"
  >
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full bg-current" />
    {{ label }}
  </span>
</template>
