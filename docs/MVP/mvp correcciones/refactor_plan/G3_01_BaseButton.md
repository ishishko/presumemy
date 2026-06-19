# G3.1 — `components/ui/BaseButton.vue` (nuevo)

| | |
|---|---|
| **Ruta** | `web/src/components/ui/BaseButton.vue` |
| **Grupo / orden** | G3 (base + shell) · 1º |
| **LOC actuales** | 0 (nuevo) |
| **Tipo** | crear |
| **Dependencias** | G0 |
| **Consumidores** | toda la app (reemplaza `.btn*` global de `components.css`) |

## Estado actual
No existe. Hoy los botones usan clases globales `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-icon`, `.icon-btn` repartidas en todos los templates (`components.css` ~297-371). Reglas del DS (CLAUDE.md):
- primary: `bg teal-500`, texto blanco, hover `brightness(.94)`.
- secondary: `surface` + `border-strong`.
- ghost: transparente, texto `violet-700`, hover `bg violet-50`.
- danger: `bg coral-500`.
- press: `translateY(1px)`. disabled: 50% opacidad (nunca gris).

## Objetivo (OCP + DRY)
Un único componente con variantes vía **mapa de estrategia**. Agregar variante = nueva entrada. Reemplaza todas las clases `.btn*` del proyecto.

## Plan de acción paso a paso
1. **(API/ISP)** Props: `variant?: 'primary'|'secondary'|'ghost'|'danger'` (default `primary`), `icon?: boolean` (botón cuadrado solo-ícono), `disabled?`, `type?`. Slot default = contenido. Emite `click` (o nativo).
2. **(OCP/C3)** Mapa `VARIANTS: Record<Variant, string>` (ver C3 del índice). Clases base comunes: `inline-flex items-center justify-center gap-2 rounded-md text-14 font-medium transition active:translate-y-px disabled:opacity-50 disabled:pointer-events-none`.
3. **(Tailwind)** `icon` → tamaño cuadrado (`p-2` / `w-9 h-9`) en vez de `px-4 py-2`.
4. **(clean)** Hover por variante incluido en el mapa (`hover:brightness-95`, `hover:bg-violet-50`, etc.).

## Antes → Después
```vue
<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const props = withDefaults(defineProps<{ variant?: Variant; icon?: boolean }>(), { variant: 'primary' })
const BASE = 'inline-flex items-center justify-center gap-2 rounded-md text-14 font-medium transition active:translate-y-px disabled:opacity-50 disabled:pointer-events-none'
const VARIANTS: Record<Variant, string> = {
  primary:   'bg-teal-500 text-white hover:brightness-95',
  secondary: 'bg-surface border border-border-strong text-ink hover:bg-page-bg',
  ghost:     'bg-transparent text-violet-700 hover:bg-violet-50',
  danger:    'bg-coral-500 text-white hover:brightness-95',
}
</script>
<template>
  <button :class="[BASE, VARIANTS[variant], icon ? 'p-2' : 'px-4 py-2']"><slot /></button>
</template>
```

## Reemplaza
`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-icon`, `.icon-btn`.

## Criterios de aceptación
- `vue-tsc` ok; las 4 variantes + icon coinciden con el prototipo (hover, press, disabled).
- Focus ring teal visible (`focus-visible:shadow-[var(--focus-ring)]`; danger → ring coral).

## Riesgos / notas
- `.icon-btn` (header/drawer) tiene tamaño/forma propia; mapear a `variant="ghost" icon`. Verificar contra el prototipo.
- Verificar valores exactos de `.btn*` en `components.css` antes de fijar paddings.
- Hacerlo temprano: `ConfirmDialog` (G2.6) y el shell lo consumen.
