# G2.1 — `components/ui/ToggleSwitch.vue`

> **Ubicación (modular, rev.2):** destino `shared/ui/ToggleSwitch.vue` · import `@/shared/ui`.

| | |
|---|---|
| **Ruta** | `web/src/components/ui/ToggleSwitch.vue` |
| **Grupo / orden** | G2 (primitivos) · 1º |
| **LOC actuales** | 31 |
| **Tipo** | migrar |
| **Dependencias** | G0 (`@theme`) |
| **Consumidores** | `AjustesView`, `InsumoDetalle` (flip switch), drawers |

## Estado actual
Botón `role="switch"` con a11y correcta (teclado space/enter, `aria-checked`, `aria-label`, `disabled`). Estilado por clase global `.toggle-switch` + `.on` (en `components.css`). Usa `props.modelValue` + emit `update:modelValue` manual.

## Objetivo
Switch presentacional, sin clase global, con `defineModel`. Es el primero a propósito: bajo riesgo y fija la convención de v-model + mapa de estado.

## Plan de acción paso a paso
1. **(Vue/C5)** Reemplazar `props.modelValue` + `emit('update:modelValue')` por `const model = defineModel<boolean>()`. Mantener `disabled` y `ariaLabel` como props.
2. **(Tailwind/C1-C2)** Migrar `.toggle-switch`/`.on` a utilidades: track (`w-9 h-5 rounded-pill`), thumb (pseudo o `<span>` con `translate-x-*`), color on/off (`bg-teal-500` / `bg-border-strong`), transición `transition-colors`.
3. **(OCP/C3)** Estado on/off mediante clases condicionadas (no string concat): objeto/ternaria de clases del track + posición del thumb.
4. **(a11y)** Conservar `role="switch"`, `:aria-checked`, `:aria-label`, handlers `space/enter`, `:disabled` + `disabled:opacity-50`.

## Antes → Después
```vue
<!-- Después (esqueleto) -->
<script setup lang="ts">
const model = defineModel<boolean>()
const props = defineProps<{ disabled?: boolean; ariaLabel?: string }>()
function toggle() { if (!props.disabled) model.value = !model.value }
</script>
<template>
  <button type="button" role="switch" :aria-checked="model" :aria-label="ariaLabel" :disabled="disabled"
    class="relative w-9 h-5 rounded-pill transition-colors disabled:opacity-50"
    :class="model ? 'bg-teal-500' : 'bg-border-strong'"
    @click="toggle" @keydown.space.prevent="toggle" @keydown.enter.prevent="toggle">
    <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
      :class="model && 'translate-x-4'" />
  </button>
</template>
```

## Mapeo Tailwind
| Antes | Después |
|---|---|
| `.toggle-switch` (track) | `relative w-9 h-5 rounded-pill bg-border-strong transition-colors` |
| `.toggle-switch.on` | `bg-teal-500` |
| thumb on | `translate-x-4` |

## Criterios de aceptación
- `vue-tsc` ok; v-model sigue funcionando donde se usa.
- Visual idéntico al prototipo (tamaño, color teal, animación del thumb).
- Teclado y screen reader: sin regresión.

## Riesgos / notas
- Verificar dimensiones exactas del switch en `components.css` (`.toggle-switch`) antes de fijar `w-9 h-5`/`translate-x-4`.
- Al cambiar a `defineModel`, revisar que los call-sites usen `v-model` (no `:model-value`+`@update`).
