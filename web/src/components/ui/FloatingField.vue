<script setup lang="ts">
import { ref, computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  id: string
  label: string
  modelValue: string
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
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
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
  emit('update:modelValue', (e.target as HTMLInputElement | HTMLTextAreaElement).value)
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

<style scoped>
.ff-group {
  position: relative;
  width: 100%;
  /* triplets para los rings de estado */
  --ff-celeste: 117, 204, 206; /* --teal-500 */
  --ff-green: 52, 165, 108;    /* --green-500 */
  --ff-red: 234, 95, 60;       /* --coral-500 */
  --ff-violet: 139, 37, 112;   /* --violet-700 */
  /* desplazamiento del label en reposo (posición de placeholder) */
  --ff-rest-y: 24px;
}
.ff-group.is-multiline {
  --ff-rest-y: 16px;
}

.ff-control {
  width: 100%;
  box-sizing: border-box;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--ink);
  background: var(--surface);
  border: 1.5px solid var(--border-strong);
  border-radius: var(--r-md);
  padding: 13px 14px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.ff-group.has-prefix .ff-control {
  padding-left: 26px;
}
.ff-textarea {
  min-height: 84px;
  resize: vertical;
  line-height: 1.5;
}

.ff-control::placeholder {
  color: var(--ink-muted);
  opacity: 1;
}
.ff-control:focus {
  outline: none;
}

.ff-prefix {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-size: 14px;
  pointer-events: none;
}

/* --- Label: pill al flotar; los caracteres suben escalonados (wave) --- */
.ff-label {
  position: absolute;
  left: 6px;
  top: 0;
  transform: translateY(-50%);
  display: flex;
  padding: 1px 8px;
  border-radius: var(--r-pill);
  pointer-events: none;
  background: transparent;
  box-shadow: none;
  transition: background 160ms ease, box-shadow 160ms ease;
}
.ff-group.has-prefix .ff-label {
  left: 18px;
}

.ff-char {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.2;
  color: var(--ink-muted);
  /* reposo: bajado a la posición de placeholder */
  transform: translateY(var(--ff-rest-y));
  transition: transform 200ms ease, font-size 200ms ease, color 200ms ease;
  transition-delay: calc(var(--index) * 0.02s);
}

/* flotado: los caracteres suben a la línea del borde (con stagger) */
.ff-group.is-floated .ff-label {
  background: var(--surface);
  box-shadow: var(--shadow-1);
}
.ff-group.is-floated .ff-char {
  transform: translateY(0);
  font-size: var(--ff-float-size);
}

/* color del label flotado = color FUERTE del estado; solo focus es violeta */
.ff-empty.is-floated .ff-char   { color: var(--teal-700); }
.ff-valid.is-floated .ff-char   { color: var(--green-700); }
.ff-invalid.is-floated .ff-char { color: var(--coral-700); }
.ff-focus.is-floated .ff-char   { color: var(--violet-900); }

/* --- Rings de estado en el input (tenues; focus = violeta más visible) --- */
.ff-empty .ff-control {
  border-color: rgba(var(--ff-celeste), 0.55);
  box-shadow: 0 0 0 3px rgba(var(--ff-celeste), 0.12);
}
.ff-valid .ff-control {
  border-color: rgba(var(--ff-green), 0.55);
  box-shadow: 0 0 0 3px rgba(var(--ff-green), 0.12);
}
.ff-invalid .ff-control {
  border-color: rgba(var(--ff-red), 0.65);
  box-shadow: 0 0 0 3px rgba(var(--ff-red), 0.16);
}
.ff-focus .ff-control {
  border-color: rgb(var(--ff-violet));
  box-shadow: 0 0 0 3px rgba(var(--ff-violet), 0.30);
}

/* --- Deshabilitado: neutro, sin estado --- */
.ff-group.is-disabled .ff-control {
  border-color: var(--border-strong);
  box-shadow: none;
  background: var(--page-bg);
  color: var(--ink-muted);
  cursor: not-allowed;
}
.ff-group.is-disabled .ff-char {
  color: var(--ink-muted) !important;
}
.ff-group.is-disabled.is-floated .ff-label {
  background: var(--page-bg);
  box-shadow: none;
}
</style>
