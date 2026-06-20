# G3.2 — `components/ui/StatusBadge.vue` (nuevo)

> **Ubicación (modular, rev.2):** componente genérico → `shared/ui/StatusBadge.vue` (`@/shared/ui`). Su mapa `Record<EstadoPresupuesto, Tone>` vive en `modules/presupuestos/estado.ts`, no acá.

| | |
|---|---|
| **Ruta** | `web/src/components/ui/StatusBadge.vue` |
| **Grupo / orden** | G3 (base + shell) · 2º |
| **LOC actuales** | 0 (nuevo) |
| **Tipo** | crear |
| **Dependencias** | G0 |
| **Consumidores** | `InsumosView` (nivel), `PresupuestosView` (FSM), `FinanzasView`, overlays |

## Estado actual
No existe. Hoy los badges se arman inline con estilos `:style="{ background, color }"` y clases globales `.badge*` (`components.css` ~526-587). Ej. `InsumosView` (líneas 264-270) pinta el badge con `nivelMeta[...].bg/color` (colores crudos). Cada vista repite el patrón pastel+texto.

## Objetivo (OCP + ISP)
Pill de estado reutilizable que recibe **solo** `{ label, tone }` (ISP) y traduce `tone` a clases pastel vía mapa (OCP). Centraliza la regla del DS: pasteles solo de fondo, texto `--ink` o el override del tono (ej. `--yellow-ink` sobre amarillo).

## Plan de acción paso a paso
1. **(ISP)** Props: `label: string`, `tone: 'ok'|'warning'|'danger'|'info'|'neutral'` (+ las que pidan los estados FSM de presupuestos al migrar G5.5). Slot opcional para un dot.
2. **(OCP/C3)** Mapa `TONE: Record<Tone, string>` con par fondo/texto correcto del DS:
   ```ts
   const TONE = {
     ok:      'bg-teal-100 text-teal-700',
     warning: 'bg-yellow text-yellow-ink',
     danger:  'bg-coral-50 text-coral-700',
     info:    'bg-violet-100 text-violet-700',
     neutral: 'bg-page-bg text-ink-muted',
   }
   ```
3. **(Tailwind)** Base: `inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-12 font-medium`.
4. **(consumo)** `useStockLevel.NIVEL_META` ya expone `tone` → `InsumosView` pasa `:tone="NIVEL_META[nivel].tone"`.

## Antes → Después
```vue
<!-- Antes (InsumosView, inline) -->
<span class="insumos-state-badge" :style="{ background: meta.bg, color: meta.color }"><span class="d"/> {{ meta.label }}</span>
<!-- Después -->
<StatusBadge :label="meta.label" :tone="meta.tone" />
```

## Reemplaza
`.badge`/`.insumos-state-badge` inline + `:style` de color en vistas.

## Criterios de aceptación
- `vue-tsc` ok; cada tono coincide con su par pastel del DS (incl. amarillo→`yellow-ink`).
- Sin colores hex crudos en los call-sites.

## Riesgos / notas
- Los estados FSM de presupuestos (`borrador/enviado/en_curso/cerrado/facturado/cancelado`) necesitan su propio mapa estado→tone; definirlo al migrar `PresupuestosView` (G5.5), no hardcodear aquí más tonos de los necesarios (YAGNI).
