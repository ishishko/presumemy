<script setup lang="ts">
import { ref, computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  id: string
  label: string
  modelValue: string
  placeholder?: string
  list?: string
  disabled?: boolean
  autocomplete?: string
  invalid?: boolean
  describedby?: string
}>(), {
  placeholder: '',
  autocomplete: 'off',
  disabled: false,
  invalid: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isFocused = ref(false)
const hasValue = computed(() => props.modelValue != null && String(props.modelValue).length > 0)
const floated = computed(() => isFocused.value || hasValue.value)

// estado visual: rojo (bloqueante) > verde (cargado) > celeste (vacío)
const state = computed(() => {
  if (props.invalid) return 'invalid'
  return hasValue.value ? 'valid' : 'empty'
})

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="ff-group" :class="[`ff-${state}`, { 'is-floated': floated, 'is-disabled': disabled }]">
    <input
      :id="id"
      class="ff-input"
      :value="modelValue"
      :list="list"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedby"
      :placeholder="isFocused ? placeholder : ' '"
      @input="onInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
      v-bind="$attrs"
    />
    <label :for="id" class="ff-label">{{ label }}</label>
  </div>
</template>

<style scoped>
.ff-group {
  position: relative;
  width: 100%;
  /* el verde no existe en los tokens del DS: lo definimos acá, acotado al componente */
  --ff-green: 63, 174, 115;   /* lleno correctamente */
  --ff-celeste: 117, 204, 206; /* vacío (= --teal-500) */
  --ff-red: 234, 95, 60;       /* mal cargado / bloqueante (= --coral-500) */
}

.ff-input {
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

/* el label hace de placeholder en reposo; el placeholder real es un espacio
   y solo mostramos el de ejemplo al enfocar */
.ff-input::placeholder {
  color: var(--ink-muted);
  opacity: 1;
}

.ff-input:focus {
  outline: none;
}

/* label: tono neutro, mantiene 14px al subir (no encoge) */
.ff-label {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  padding: 0 4px;
  pointer-events: none;
  color: var(--ink-muted);
  font-size: 14px;
  font-family: var(--font-sans);
  background: transparent;
  transition: top 150ms ease, color 150ms ease, background 150ms ease;
}

.ff-group.is-floated .ff-label {
  top: 0;
  color: var(--ink);
  background: var(--surface);
}

/* --- Sombras tenues por estado --- */
.ff-empty .ff-input {
  border-color: rgba(var(--ff-celeste), 0.55);
  box-shadow: 0 0 0 3px rgba(var(--ff-celeste), 0.12);
}
.ff-empty .ff-input:focus {
  border-color: rgb(var(--ff-celeste));
  box-shadow: 0 0 0 3px rgba(var(--ff-celeste), 0.40);
}

.ff-valid .ff-input {
  border-color: rgba(var(--ff-green), 0.55);
  box-shadow: 0 0 0 3px rgba(var(--ff-green), 0.12);
}
.ff-valid .ff-input:focus {
  border-color: rgb(var(--ff-green));
  box-shadow: 0 0 0 3px rgba(var(--ff-green), 0.38);
}

.ff-invalid .ff-input {
  border-color: rgba(var(--ff-red), 0.65);
  box-shadow: 0 0 0 3px rgba(var(--ff-red), 0.16);
}
.ff-invalid .ff-input:focus {
  border-color: rgb(var(--ff-red));
  box-shadow: 0 0 0 3px rgba(var(--ff-red), 0.42);
}

/* deshabilitado: sin color de estado, neutro */
.ff-group.is-disabled .ff-input {
  border-color: var(--border-strong);
  box-shadow: none;
  background: var(--page-bg);
  color: var(--ink-muted);
  cursor: not-allowed;
}
.ff-group.is-disabled .ff-label {
  color: var(--ink-muted);
}
.ff-group.is-disabled.is-floated .ff-label {
  background: var(--page-bg);
}
</style>
