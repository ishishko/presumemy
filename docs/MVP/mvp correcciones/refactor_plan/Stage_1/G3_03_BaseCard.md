# G3.3 — `shared/ui/BaseCard.vue` (nuevo)

> **Ubicación (modular, rev.2):** destino `shared/ui/BaseCard.vue` · import `@/shared/ui`.

| | |
|---|---|
| **Ruta destino** | `web/src/shared/ui/BaseCard.vue` |
| **Grupo / orden** | G3 (base + shell) · 3º |
| **LOC actuales** | 0 (nuevo) |
| **Tipo** | crear |
| **Dependencias** | G0 |
| **Consumidores** | `DashboardPage`, `FinanzasPage`, login, estados de carga, etc. |

## Estado actual
No existe como componente. Clase global `.card` (`components.css` ~371-408): `bg surface`, `border 1px border`, `rounded-lg`, `shadow-1`. Se usa suelta en muchos templates (ej. `InsumosView` línea 199 `<div class="card">`).

## Objetivo (DRY)
Card presentacional mínimo. Reemplaza `.card`. Slot default; padding opcional.

## Plan de acción paso a paso
1. **(ISP)** Props mínimas: `padded?: boolean` (default true). Slot default.
2. **(Tailwind/C1)** Base: `bg-surface border border-border rounded-lg shadow-1` + `p-6` si `padded`.
3. **(YAGNI)** No agregar header/footer slots hasta que aparezca la 3ª necesidad (Regla de Tres).

## Antes → Después
```vue
<template>
  <div class="bg-surface border border-border rounded-lg shadow-1" :class="padded && 'p-6'"><slot /></div>
</template>
```

## Reemplaza
`.card` global.

## Criterios de aceptación
- `vue-tsc` ok; cards idénticas (borde hairline, sombra suave, radio 12px).

## Riesgos / notas
- Algunas "cards" del proyecto tienen padding/variantes propias (ej. KPI). Esas usan `BaseKpi` (G3.4) o utilidades extra sobre `BaseCard`, no se fuerzan dentro de este componente.
