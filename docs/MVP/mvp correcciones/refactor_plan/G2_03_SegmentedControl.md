# G2.3 — `shared/ui/SegmentedControl.vue`

> **Ubicación (modular, rev.2):** destino `shared/ui/SegmentedControl.vue` · import `@/shared/ui`.

| | |
|---|---|
| **Ruta destino** | `web/src/shared/ui/SegmentedControl.vue` |
| **Grupo / orden** | G2 (primitivos) · 3º |
| **LOC actuales** | 61 |
| **Tipo** | migrar |
| **Dependencias** | G0 |
| **Consumidores** | `PresupuestoEditor` (Retira/Envío), posibles toggles de vista |

## Estado actual
Radiogroup accesible (roving tabindex, flechas ←→↑↓, `role="radio"`, `aria-checked`). Clases globales `.segmented` / `.seg-btn` + `.active`. v-model manual (`modelValue`/`update:modelValue`).

## Objetivo
Mismo control accesible, estilado con Tailwind y mapa activo/inactivo, opcionalmente `defineModel`.

## Plan de acción paso a paso
1. **(Vue/C5)** `defineModel<string>()` en lugar de prop+emit (la lógica de flechas sigue emitiendo al model). Mantener `options`, `disabled`, `ariaLabel`, `ariaLabelledby`.
2. **(Tailwind)** `.segmented` → contenedor `inline-flex p-0.5 bg-page-bg rounded-md border border-border` (ajustar al prototipo). `.seg-btn` → `px-3 py-1.5 text-13 rounded-sm transition-colors`.
3. **(OCP/C3)** Activo vs inactivo por mapa/ternaria: activo `bg-surface text-ink shadow-1`, inactivo `text-ink-muted hover:text-ink`.
4. **(a11y)** Conservar **toda** la lógica de teclado (`onKeydown`, roving tabindex, foco en el activo). No tocar `groupEl`/`requestAnimationFrame`.

## Antes → Después
```vue
:class="['px-3 py-1.5 text-13 rounded-sm transition-colors',
         modelValue === opt.value ? 'bg-surface text-ink shadow-1' : 'text-ink-muted hover:text-ink']"
```

## Mapeo Tailwind
| Antes | Después |
|---|---|
| `.segmented` | `inline-flex p-0.5 bg-page-bg rounded-md border border-border` |
| `.seg-btn` | `px-3 py-1.5 text-13 rounded-sm transition-colors text-ink-muted` |
| `.seg-btn.active` | `bg-surface text-ink shadow-1` |

## Criterios de aceptación
- `vue-tsc` ok; navegación con flechas y foco intactos.
- Visual idéntico (segmento activo elevado).

## Riesgos / notas
- No degradar a11y: el roving tabindex (`:tabindex="active?0:-1"`) y el foco programático deben quedar igual.
- Verificar medidas/colores reales en `components.css` (`.segmented`).
