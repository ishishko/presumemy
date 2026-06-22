# G5.5 — `modules/presupuestos/PresupuestosPage.vue`

> **Ubicación (modular, rev.2):** destino `modules/presupuestos/PresupuestosPage.vue` · `estado.ts` (FSM+tonos) y `EstadoDropdown` viven en `modules/presupuestos`.

| | |
|---|---|
| **Ruta destino** | `web/src/modules/presupuestos/PresupuestosPage.vue` |
| **Grupo / orden** | G5 (vistas) · 5º |
| **LOC actuales** | 353 |
| **Tipo** | migrar |
| **Dependencias** | G1.1, G1.3, G3.5 (`DataTable`), G3.7 (`RowActions`), G3.2 (`StatusBadge`), nuevo `FilterChips`, módulo común de estados FSM |
| **Consumidores** | ruta `/presupuestos` |

## Estado actual
Tabla de presupuestos con filtros por estado, **dropdown de cambio de estado FSM** (transiciones por estado), borrado, y confirmación especial al facturar/cancelar. Smells:
- `import { del, patch }` directo (**DIP**; el `patch` de estado debería ir al store).
- `money()` + `formatDate()` locales.
- `statusTones` (tone+label) y `TRANSITIONS` (FSM) **duplicados** con `DashboardView` (statusTones) y con la lógica del backend.
- Dropdown de estado con clases globales `.custom-status-dropdown/.status-badge-wrap/.status-dropdown-*` + listener global de click.
- `<style scoped>` `.row-action*` (idéntico a otras vistas).
- Inline styles en celdas; `.badge lavender` para temática.

## Objetivo
Vista orquestadora con `DataTable` + `RowActions` + un componente de **dropdown de estado** que encapsule la FSM, consumiendo un módulo común de estados (tone/label/transiciones). Sin `services/api`, sin duplicar `statusTones`.

## Plan de acción paso a paso
1. **(SRP/DRY)** Extraer módulo `modules/presupuestos/estado.ts`: `ESTADO_META: Record<Estado,{tone,label}>` + `TRANSITIONS: Record<Estado,Estado[]>` + `getAvailableTransitions`. Lo consumen Dashboard (G5.1), esta vista y `PresupuestoEditor` (G6.6). (Fuente única de la FSM en el front; el backend valida igual.) **(rev.1)** Agregar **test unitario** de `getAvailableTransitions` (6 estados, transiciones no triviales — lógica de negocio crítica).
2. **(SRP)** Extraer `modules/presupuestos/components/EstadoDropdown.vue`: recibe `presupuesto`/estado, muestra `StatusBadge`, despliega transiciones y emite `change(nuevoEstado)`. Encapsula el dropdown + cierre por click-fuera.
3. **(DIP)** Mover el `patch('/presupuestos/:id/estado')` al store (`store.cambiarEstado(id, estado)` con update optimista + revert). La vista llama al store. `del` → `store.remove`.
4. **(reuso)** Tabla → `DataTable`; acciones → `RowActions`; filtros → `FilterChips`; `money`/`formatDate` → `shared/lib/format` (G1.1).
5. **(reuso)** Las 2 confirmaciones (borrar / facturar-cancelar) siguen con `ConfirmDialog`.
6. **(Tailwind)** Eliminar inline styles y `<style scoped>`.

## Componentes que crea/consume
Crea `modules/presupuestos/estado.ts`, `modules/presupuestos/components/EstadoDropdown.vue`. Consume `DataTable`, `RowActions`, `FilterChips`, `StatusBadge`, `formatMoney`/`formatDate`.

## Criterios de aceptación
- `vue-tsc` ok; FSM de estados (transiciones, confirmación al facturar/cancelar, update optimista + revert) idéntica.
- `statusTones`/`TRANSITIONS` definidos **una sola vez** en `modules/presupuestos/estado.ts` y reusados por Dashboard.
- Sin `services/api` en la vista.

## Riesgos / notas
- El update optimista (`p.estado = newStatus` y revert en catch) debe preservarse al mover el `patch` al store.
- `StatusBadge` necesita tonos para todos los estados FSM (`borrador/en_curso/cerrado/facturado/cancelado/enviado`); definir el mapa estado→tone en `modules/presupuestos/estado.ts` y traducir a los tonos de `StatusBadge` (G3.2).
- Mapear los tonos legacy (`violet/teal/mint/lavender/coral/default`) del badge actual a los tonos de `StatusBadge`.
