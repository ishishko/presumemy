<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown } from '@lucide/vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    modelValue?: string | number | null
    disabled?: boolean
    required?: boolean
    invalid?: boolean
    describedby?: string
    floatSize?: string
    modelModifiers?: { number?: boolean }
  }>(),
  {
    disabled: false,
    required: false,
    invalid: false,
    floatSize: '14px',
    modelModifiers: () => ({}),
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const isFocused = ref(false)
const touched = ref(false)

const hasValue = computed(() => {
  const v = props.modelValue
  return v !== '' && v !== 0 && v != null
})

// el label de un select siempre está flotado (el control siempre muestra algo)
const state = computed(() => {
  if (isFocused.value) return 'focus'
  if (props.invalid) return 'invalid'
  if (hasValue.value) return 'valid'
  if (props.required && touched.value) return 'invalid'
  return 'empty'
})
const isInvalid = computed(() => state.value === 'invalid')

const labelChars = computed(() => Array.from(props.label).map(c => (c === ' ' ? ' ' : c)))

function onChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  emit('update:modelValue', props.modelModifiers?.number ? (raw === '' ? '' : Number(raw)) : raw)
}
function onBlur() {
  isFocused.value = false
  touched.value = true
}

const CONTROL_STATES: Record<string, string> = {
  empty: 'border-[rgba(117,204,206,0.55)] shadow-[0_0_0_3px_rgba(117,204,206,0.12)]',
  valid: 'border-[rgba(52,165,108,0.55)] shadow-[0_0_0_3px_rgba(52,165,108,0.12)]',
  invalid: 'border-[rgba(234,95,60,0.65)] shadow-[0_0_0_3px_rgba(234,95,60,0.16)]',
  focus: 'border-violet-700 shadow-[0_0_0_3px_rgba(139,37,112,0.30)]',
}

const controlClass = computed(() => {
  if (props.disabled) {
    return 'border-border-strong bg-page-bg text-ink-muted cursor-not-allowed shadow-none'
  }
  return CONTROL_STATES[state.value] || CONTROL_STATES.empty
})
</script>

<template>
  <div
    class="ff-group is-floated relative w-full"
    :class="[
      `ff-${state}`,
      {
        'is-disabled': disabled
      }
    ]"
    :style="{
      '--ff-float-size': floatSize,
      '--ff-rest-y': '24px'
    }"
  >
    <select
      :id="id"
      class="w-full box-border font-sans text-14 color-ink bg-surface border-[1.5px] rounded-md py-3 pl-3.5 pr-9 outline-none transition-[border-color,box-shadow] duration-150 appearance-none cursor-pointer"
      :class="[controlClass]"
      :value="modelValue"
      :disabled="disabled"
      :aria-invalid="isInvalid || undefined"
      :aria-describedby="describedby"
      @change="onChange"
      @focus="isFocused = true"
      @blur="onBlur"
      v-bind="$attrs"
    >
      <slot />
    </select>
    <ChevronDown
      :size="16"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
      aria-hidden="true"
    />
    <label
      :for="id"
      class="ff-label absolute left-1.5 top-0 -translate-y-1/2 display-flex py-[1px] px-[8px] rounded-pill pointer-events-none transition-[background,box-shadow] duration-160"
      :class="[
        disabled ? 'bg-page-bg shadow-none' : 'bg-surface shadow-1'
      ]"
    >
      <span
        v-for="(ch, i) in labelChars"
        :key="i"
        class="ff-char font-sans text-14 line-height-1.2"
        :style="{ '--index': i }"
      >{{ ch }}</span>
    </label>
  </div>
</template>

<style scoped>
.ff-char {
  display: inline-block;
  color: var(--color-ink-muted);
  transform: translateY(0);
  font-size: var(--ff-float-size, 14px);
  transition: transform 200ms ease, font-size 200ms ease, color 200ms ease;
  transition-delay: calc(var(--index) * 0.02s);
}

/* Colores de label flotado */
.ff-empty .ff-char { color: var(--color-teal-700); }
.ff-valid .ff-char { color: var(--color-green-700); }
.ff-invalid .ff-char { color: var(--color-coral-700); }
.ff-focus .ff-char { color: var(--color-violet-900); }

.is-disabled .ff-char {
  color: var(--color-ink-muted) !important;
}
</style>
