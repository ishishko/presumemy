# G2.5 — `shared/ui/FloatingSelect.vue`

> **Ubicación (modular, rev.2):** destino `shared/ui/FloatingSelect.vue` · import `@/shared/ui`.

| | |
|---|---|
| **Ruta destino** | `web/src/shared/ui/FloatingSelect.vue` |
| **Grupo / orden** | G2 (primitivos) · 5º |
| **LOC actuales** | 90 |
| **Tipo** | migrar (con excepción de animación) |
| **Dependencias** | G0; **G2.4** (comparte estilos `.ff-*` y lógica de `state`) |
| **Consumidores** | drawers (`MovimientoDrawer`, `ImprentaDrawer`), editor, forms con select |

## Estado actual
`<select>` con label flotante (siempre flotado, porque el control siempre muestra algo) + chevron. Comparte con `FloatingField`: clases `.ff-group is-floated`, `.ff-control.ff-select`, `.ff-label`/`.ff-char`, estados `ff-focus/valid/invalid/empty`, y la **misma lógica de `state`** (focus>invalid>valid>empty). `modelModifiers.number`. Usa `<slot />` para las `<option>`.

## Objetivo
Igual que G2.4: API/lógica intactas, Tailwind para todo menos la animación wave del label (excepción C6). Reutilizar lo compartido con `FloatingField`.

## Plan de acción paso a paso
1. **(SRP/DRY)** Reutilizar el composable `useFieldState` definido en G2.4 (o, si no se extrajo, replicar el mismo mapa de estados → clases). No duplicar la lógica de `state`.
2. **(Tailwind)** Migrar `.ff-control.ff-select` (padding con espacio para el chevron, `appearance-none`, borde, `rounded-md`, `text-14`). Chevron (`ChevronDown` de lucide) posicionado `absolute right-3` con `pointer-events-none`.
3. **(C6 excepción)** Label flotante wave → `<style scoped>` compartido/duplicado mínimo (mismo criterio que G2.4).
4. **(Vue)** Conservar `state` (siempre `is-floated`), `onChange` con `modelModifiers.number`, `onBlur`/`touched`, a11y (`aria-invalid`, `aria-describedby`). `defineOptions({ inheritAttrs:false })` + `v-bind="$attrs"` se mantiene.

## Antes → Después
```vue
<select class="w-full appearance-none rounded-md border border-border bg-surface pl-3 pr-9 py-2 text-14 outline-none" ...>
  <slot />
</select>
<ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted" />
```

## Mapeo Tailwind
| Antes | Después |
|---|---|
| `.ff-select` | `appearance-none pr-9` (+ base de `.ff-control`) |
| `.ff-chevron` | `absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted` |
| `.ff-label`/`.ff-char` | **scoped** (excepción C6) |

## Criterios de aceptación
- `vue-tsc` ok; selección, `.number`, estados y a11y igual.
- Chevron alineado; label flotado idéntico al prototipo.

## Riesgos / notas
- Mantener `appearance-none` para ocultar el chevron nativo y mostrar el de lucide.
- Si G2.4 extrajo `useFieldState`, importarlo aquí; si no, alinear ambos docs para no divergir.
