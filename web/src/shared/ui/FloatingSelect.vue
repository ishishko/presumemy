<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown } from '@lucide/vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  id: string
  label: string
  modelValue: string | number
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  describedby?: string
  floatSize?: string
  modelModifiers?: { number?: boolean }
}>(), {
  disabled: false,
  required: false,
  invalid: false,
  floatSize: '14px',
  modelModifiers: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const isFocused = ref(false)
const touched = ref(false)

const hasValue = computed(() => {
  const v = props.modelValue
  return v !== '' && v !== 0 && v != null
})

const state = computed(() => {
  if (isFocused.value) return 'focus'
  if (props.invalid) return 'invalid'
  if (hasValue.value) return 'valid'
  if (props.required && touched.value) return 'invalid'
  return 'empty'
})
const isInvalid = computed(() => state.value === 'invalid')

const labelChars = computed(() => Array.from(props.label).map(c => (c === ' ' ? ' ' : c)))

function onChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  emit('update:modelValue', props.modelModifiers?.number ? (raw === '' ? '' : Number(raw)) : raw)
}
function onBlur() {
  isFocused.value = false
  touched.value = true
}
</script>

<template>
  <div
    class="ff-group is-floated"
    :class="[`ff-${state}`, { 'is-disabled': disabled }]"
    :style="{ '--ff-float-size': floatSize }"
  >
    <select
      :id="id"
      class="ff-control ff-select"
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
    <ChevronDown :size="16" class="ff-chevron" aria-hidden="true" />
    <label :for="id" class="ff-label">
      <span
        v-for="(ch, i) in labelChars"
        :key="i"
        class="ff-char"
        :style="{ '--index': i }"
      >{{ ch }}</span>
    </label>
  </div>
</template>
