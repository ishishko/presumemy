<script setup lang="ts">
interface Chip {
  id: string
  label: string
  count?: number
  dotTone?: 'ok' | 'warning' | 'danger' | 'neutral'
}

const props = withDefaults(defineProps<{
  modelValue: string | null
  chips: Chip[]
  deselectable?: boolean
}>(), {
  deselectable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const DOT_COLORS: Record<string, string> = {
  ok: 'bg-green-500',
  warning: 'bg-yellow',
  danger: 'bg-coral-500',
  neutral: 'bg-ink-muted',
}

function select(id: string) {
  if (props.deselectable && props.modelValue === id) {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', id)
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-1.5">
    <button
      v-for="chip in chips"
      :key="chip.id"
      type="button"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-12 font-medium border transition-colors cursor-pointer"
      :class="modelValue === chip.id
        ? 'bg-violet-50 text-violet-700 border-violet-100'
        : 'bg-transparent text-ink-muted border-border hover:text-ink hover:border-border-strong'"
      @click="select(chip.id)"
    >
      <span v-if="chip.dotTone" class="w-1.75 h-1.75 rounded-full" :class="DOT_COLORS[chip.dotTone]" />
      {{ chip.label }}
      <span v-if="chip.count !== undefined" class="tabular-nums text-11 font-medium px-1.75 py-0.25 rounded-pill"
        :class="modelValue === chip.id ? 'bg-white/20 text-white' : 'bg-page-bg text-ink-muted'">
        {{ chip.count }}
      </span>
    </button>
  </div>
</template>
