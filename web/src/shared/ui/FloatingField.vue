<script setup lang="ts">
import { ref, computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    modelValue: string | number
    placeholder?: string
    list?: string
    autocomplete?: string
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    invalid?: boolean
    describedby?: string
    type?: 'text' | 'date' | 'number'
    multiline?: boolean
    prefix?: string
    floatSize?: string
    alwaysFloat?: boolean
    modelModifiers?: { number?: boolean }
  }>(),
  {
    placeholder: '',
    autocomplete: 'off',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    type: 'text',
    multiline: false,
    prefix: '',
    floatSize: '14px',
    alwaysFloat: false,
    modelModifiers: () => ({}),
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const isFocused = ref(false)
const touched = ref(false)

const hasValue = computed(() => props.modelValue != null && String(props.modelValue).length > 0)

// el label no puede oficiar de placeholder si hay prefijo ($) o el control es nativo (date)
const effectiveAlwaysFloat = computed(() => props.alwaysFloat || !!props.prefix || props.type === 'date')
const floated = computed(() => effectiveAlwaysFloat.value || isFocused.value || hasValue.value)

// estado visual: focus(violeta) > rojo(incorrecto/required vacío) > verde(correcto) > celeste(opcional vacío)
const state = computed(() => {
  if (isFocused.value) return 'focus'
  if (props.invalid) return 'invalid'
  if (hasValue.value) return 'valid'
  if (props.required && touched.value) return 'invalid'
  return 'empty'
})
const isInvalid = computed(() => state.value === 'invalid')

// el label se divide en caracteres para la animación "wave" (escalonada)
const labelChars = computed(() => Array.from(props.label).map(c => (c === ' ' ? ' ' : c)))

const placeholderShown = computed(() =>
  (isFocused.value || effectiveAlwaysFloat.value) ? props.placeholder : ' '
)

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement | HTMLTextAreaElement).value
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
    class="ff-group relative w-full"
    :class="[
      `ff-${state}`,
      {
        'is-floated': floated,
        'is-disabled': disabled,
        'has-prefix': !!prefix,
        'is-multiline': multiline
      }
    ]"
    :style="{
      '--ff-float-size': floatSize,
      '--ff-rest-y': multiline ? '16px' : '24px'
    }"
  >
    <span
      v-if="prefix"
      class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted font-sans text-14 pointer-events-none aria-hidden"
      aria-hidden="true"
    >
      {{ prefix }}
    </span>

    <textarea
      v-if="multiline"
      :id="id"
      class="w-full box-border font-sans text-14 color-ink bg-surface border-[1.5px] rounded-md py-3 px-3.5 outline-none transition-[border-color,box-shadow] duration-150 min-height-84 resize-y line-height-1.5"
      :class="[controlClass, prefix ? 'pl-[26px]' : '']"
      :value="modelValue"
      :disabled="disabled"
      :readonly="readonly"
      :placeholder="placeholderShown"
      :aria-invalid="isInvalid || undefined"
      :aria-describedby="describedby"
      @input="onInput"
      @focus="isFocused = true"
      @blur="onBlur"
      v-bind="$attrs"
    />
    <input
      v-else
      :id="id"
      class="w-full box-border font-sans text-14 color-ink bg-surface border-[1.5px] rounded-md py-3 px-3.5 outline-none transition-[border-color,box-shadow] duration-150"
      :class="[controlClass, prefix ? 'pl-[26px]' : '']"
      :type="type"
      :value="modelValue"
      :list="list"
      :disabled="disabled"
      :readonly="readonly"
      :autocomplete="autocomplete"
      :placeholder="placeholderShown"
      :aria-invalid="isInvalid || undefined"
      :aria-describedby="describedby"
      @input="onInput"
      @focus="isFocused = true"
      @blur="onBlur"
      v-bind="$attrs"
    />

    <label
      :for="id"
      class="ff-label absolute left-1.5 top-0 -translate-y-1/2 display-flex py-[1px] px-[8px] rounded-pill pointer-events-none transition-[background,box-shadow] duration-160"
      :class="[
        floated ? (disabled ? 'bg-page-bg shadow-none' : 'bg-surface shadow-1') : 'bg-transparent shadow-none',
        prefix ? 'left-[18px]' : ''
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
  transform: translateY(var(--ff-rest-y));
  transition: transform 200ms ease, font-size 200ms ease, color 200ms ease;
  transition-delay: calc(var(--index) * 0.02s);
}

.is-floated .ff-char {
  transform: translateY(0);
  font-size: var(--ff-float-size, 14px);
}

/* Colores de label flotado */
.is-floated.ff-empty .ff-char { color: var(--color-teal-700); }
.is-floated.ff-valid .ff-char { color: var(--color-green-700); }
.is-floated.ff-invalid .ff-char { color: var(--color-coral-700); }
.is-floated.ff-focus .ff-char { color: var(--color-violet-900); }

.is-disabled .ff-char {
  color: var(--color-ink-muted) !important;
}
.min-height-84 {
  min-height: 84px;
}
</style>
