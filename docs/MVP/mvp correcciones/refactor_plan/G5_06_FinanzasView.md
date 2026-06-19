# G5.6 — `views/FinanzasView.vue`

| | |
|---|---|
| **Ruta** | `web/src/views/FinanzasView.vue` |
| **Grupo / orden** | G5 (vistas) · 6º |
| **LOC actuales** | 380 |
| **Tipo** | migrar |
| **Dependencias** | G1.1, G1.3, G3.3/3.4 (`BaseCard`/`BaseKpi`), G3.5 (`DataTable`), G3.7 (`RowActions`), G3.2 (`StatusBadge`), nuevo `FilterChips` |
| **Consumidores** | ruta `/finanzas` |

## Estado actual
Dos pestañas (movimientos / imprenta), cada una con su tabla; KPIs (ingresos/egresos/utilidad); filtros por tipo y por cuenta; drawers de movimiento e imprenta. Smells:
- `import { del }` directo (**DIP**); store ya tiene `removeTransaccion`/`removeOrden`.
- `money`/`signedMoney`/`formatDate` locales (signedMoney usa `+ /−`).
- `tipoMovs` con **hex crudos** (`#2E6F70`, `#EA5F3C`) + lógica de badge por color inline (líneas 234-242).
- `fin-tabs`, `fin-pill`, `fin-tipo-badge`, `fin-monto-pos/neg`, `fin-pagado-badge` (clases globales) + `<style scoped>` `.row-action*`.
- Muchísimos inline styles en celdas; `grid-3` KPIs con inline.

## Objetivo
Vista con KPIs (`BaseKpi`), dos `DataTable`, tabs y filtros por componentes, sin `services/api`, sin formatos locales, sin hex crudos (tono ingreso/egreso por mapa).

## Plan de acción paso a paso
1. **(DIP)** `del` → `store.removeTransaccion`/`store.removeOrden` (absorber el `del` en el store, G1.3 — finanzas tiene 2 endpoints).
2. **(DRY)** `money`/`signedMoney`/`formatDate` → `utils/format` (`formatMoney` + `formatSignedMoney`).
3. **(OCP)** `tipoMovs`: separar **dato** (id+label) de **signo** (ingreso/egreso). El tono del badge sale de un mapa `tipo → 'ingreso'|'egreso'` → `StatusBadge tone`. Eliminar la comparación por hex (`=== '#2E6F70'`).
4. **(SRP)** Extraer `components/finanzas/FinTabs.vue` (tabs movimientos/imprenta con contadores) si aporta; si no, Tailwind inline.
5. **(reuso)** Tablas → `DataTable` (2 configs de columnas); acciones → `RowActions`; filtros tipo/cuenta → `FilterChips`; badge pagado/pendiente y tipo → `StatusBadge`.
6. **(Tailwind)** KPIs → `BaseKpi`; eliminar inline styles; `.fin-*` → utilidades.

## Componentes que crea/consume
Posible `FinTabs.vue`. Consume `BaseKpi`, `DataTable`, `RowActions`, `StatusBadge`, `FilterChips`, `formatMoney`.

## Criterios de aceptación
- `vue-tsc` ok; ambas pestañas, KPIs, filtros, montos con signo y badges idénticos.
- Sin `services/api`; sin hex crudos para clasificar ingreso/egreso.

## Riesgos / notas
- La clasificación ingreso/egreso hoy depende de comparar el color hex — frágil. Reemplazar por una propiedad semántica (`signo`) en el catálogo de tipos.
- `signedMoney` usa el carácter `−` (minus U+2212), no guion; preservarlo.
- Período (year/month) viene del store (`currentPeriod`); mantener la navegación de período.
