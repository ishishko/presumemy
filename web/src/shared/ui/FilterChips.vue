<script setup lang="ts">
type Tone = 'ok' | 'warning' | 'danger' | 'info' | 'neutral'

interface Chip {
  id: string | number
  label: string
  count?: number
  dotTone?: Tone
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null
    chips: Chip[]
    deselectable?: boolean
  }>(),
  {
    deselectable: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const DOT_COLORS: Record<Tone, string> = {
  ok: 'bg-teal-500',
  warning: 'bg-yellow',
  danger: 'bg-coral-500',
  info: 'bg-violet-700',
  neutral: 'bg-ink-muted',
}

function select(id: string | number) {
  if (props.modelValue === id) {
    if (props.deselectable) {
      emit('update:modelValue', null)
    }
  } else {
    emit('update:modelValue', id)
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="chip in chips"
      :key="chip.id"
      type="button"
      class="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-13 font-medium transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:shadow-focus-ring"
      :class="[
        modelValue === chip.id
          ? 'bg-violet-700 text-white shadow-1'
          : 'bg-violet-50 text-violet-700 hover:bg-violet-100/60'
      ]"
      @click="select(chip.id)"
    >
      <span
        v-if="chip.dotTone"
        class="w-2 h-2 rounded-full shrink-0"
        :class="[DOT_COLORS[chip.dotTone] || DOT_COLORS.neutral]"
      />
      {{ chip.label }}
      <span
        v-if="chip.count !== undefined"
        class="text-11 px-1.5 py-0.5 rounded-pill bg-black/10 text-inherit/80"
        :class="[modelValue === chip.id ? 'bg-white/20' : 'bg-violet-700/10']"
      >
        {{ chip.count }}
      </span>
    </button>
  </div>
</template>
