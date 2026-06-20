# G2.2 — `components/layout/PageHead.vue`

> **Ubicación (modular, rev.2):** destino `shared/ui/PageHead.vue` · import `@/shared/ui`.

| | |
|---|---|
| **Ruta** | `web/src/components/layout/PageHead.vue` |
| **Grupo / orden** | G2 (primitivos) · 2º |
| **LOC actuales** | 18 |
| **Tipo** | migrar |
| **Dependencias** | G0 |
| **Consumidores** | vistas que muestran encabezado de página con acciones |

## Estado actual
Presentacional puro: props `title`/`sub`, slot de acciones. Clases globales `.page-head`, `.title`, `.sub`. Ya mezcla una utilidad Tailwind suelta (`text-2xl`) con clases globales — inconsistencia a unificar.

## Objetivo
Encabezado presentacional 100% Tailwind, sin clases globales. Slot de acciones intacto.

## Plan de acción paso a paso
1. **(Tailwind/C1-C2)** `.page-head` → `flex items-center justify-between gap-4` (revisar valores reales en `components.css`).
2. **(Tailwind)** `h1` → heading violeta (hereda de `@layer base`; ajustar tamaño con `text-28`/`text-2xl` según prototipo). `.sub` → `text-13 text-ink-muted`.
3. **(Vue)** Mantener `defineProps<{ title: string; sub?: string }>()` y `<slot />`. Sin lógica.

## Antes → Después
```vue
<template>
  <div class="flex items-center justify-between gap-4">
    <div>
      <h1 class="text-28">{{ title }}</h1>
      <div v-if="sub" class="text-13 text-ink-muted">{{ sub }}</div>
    </div>
    <div class="flex items-center gap-2"><slot /></div>
  </div>
</template>
```

## Mapeo Tailwind
| Antes | Después |
|---|---|
| `.page-head` | `flex items-center justify-between gap-4` |
| `.title` | (wrapper simple) |
| `.sub` | `text-13 text-ink-muted` |

## Criterios de aceptación
- `vue-tsc` ok; slot de acciones renderiza igual.
- Encabezado idéntico al prototipo.

## Riesgos / notas
- Confirmar dónde se usa `PageHead` realmente (puede estar poco usado dado que `AppHeader` ya muestra el título de página); anotar en su doc si queda como utilitario para vistas internas.
