<script setup lang="ts">
import { ref, computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
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
}>(), {
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
})

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

// el label se divide en caracteres para la animación "wave" (escalonada);
// los espacios se vuelven no-rompibles para que el flex no los colapse
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
</script>

<template>
  <div
    class="ff-group"
    :class="[`ff-${state}`, { 'is-floated': floated, 'is-disabled': disabled, 'has-prefix': !!prefix, 'is-multiline': multiline }]"
    :style="{ '--ff-float-size': floatSize }"
  >
    <span v-if="prefix" class="ff-prefix" aria-hidden="true">{{ prefix }}</span>

    <textarea
      v-if="multiline"
      :id="id"
      class="ff-control ff-textarea"
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
      class="ff-control"
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
    <label :for="id" class="ff-label">
      <span
        v-for="(ch, i) in labelChars"
        :key="i"
        class="ff-char"
        :style="{ '--index': i }"
      >{{ ch === ' ' ? ' ' : ch }}</span>
    </label>
  </div>
</template>
