# G3.13 — `shared/ui/Pagination.vue`

> **Ubicación (modular, rev.2):** destino `shared/ui/Pagination.vue` · se consume por segmento (`import Pagination from '@/shared/ui/Pagination.vue'` o vía barrel de `shared/ui` si se adopta). Presentacional puro, sin dominio. Pareja de `usePagination` (G1.4).

| | |
|---|---|
| **Ruta destino** | `web/src/shared/ui/Pagination.vue` |
| **Grupo / orden** | G3 (UI) · 13º |
| **LOC actuales** | 171 (≈97 de `<style scoped>`) |
| **Tipo** | migrar |
| **Dependencias** | G0 (tokens `@theme`); Lucide (`ChevronLeft`/`ChevronRight`) |
| **Consumidores** | listas paginadas (Insumos/Productos/Clientes/Presupuestos/Finanzas), alimentado por `usePagination` (G1.4) |

## Estado actual
Barra de paginación (Epic D): info "Mostrando X al Y de Z", controles prev/next con página actual, y selector de "filas por página" (10/25/50) tipo segmented. Props de solo lectura (`currentPage`, `totalPages`, `totalItems`, `startIndex`, `endIndex`, `pageSize`) + emits (`update:currentPage`, `update:pageSize`, `prev`, `next`). **Presentacional puro**, sin estado ni fetch. Smells:
- `<style scoped>` completo (`.pagination-*`, `.size-*`) con tokens `var(--*)` → migrar a utilidades.
- El selector de tamaño **reinventa un segmented** (`.size-options`/`.size-btn.active`) que se parece a `SegmentedControl` (G2.3) → evaluar reuso.
- Import `@lucide/vue` (verificar que es el mismo specifier que el resto del proyecto, no `lucide-vue-next`).

## Objetivo
Componente Tailwind, sin `<style scoped>`, en `shared/ui`. Mantener la API de props/emits intacta para no tocar a los consumidores.

## Plan de acción paso a paso
1. **(C13 — shared)** Mover a `shared/ui/Pagination.vue`; es genérico sin dominio.
2. **(Tailwind)** Migrar `.pagination-container`/`info`/`controls`/`btn`/`page`/`size` a utilidades. `tabular` → `tabular-nums`. Botones disabled con `disabled:opacity-40` (sin gris, per DS).
3. **(reuso — evaluar)** El selector 10/25/50 puede usar `SegmentedControl` (G2.3) si su API encaja; si fuerza demasiado, dejar los botones pero estilados con el mismo patrón de tono que el resto del UI kit. Decidir en implementación (no inventar un 2º segmented divergente — mismo smell que `aj-switch`/`pd-switch`).
4. **(ISP/Vue)** Mantener props segregadas + emits tipados (`defineEmits<…>()`). Considerar `defineModel()` para `currentPage`/`pageSize` si simplifica a los consumidores; opcional.
5. **(C5)** Iconos Lucide stroke 1.5, `:size="16"`.

## Criterios de aceptación
- `vue-tsc` ok; prev/next/disabled, cambio de page size (resetea a página 1), info de rango: idénticos.
- Sin `<style scoped>`; vive en `shared/ui`; API de props/emits sin cambios para los consumidores.

## Riesgos / notas
- Acoplado a `usePagination` (G1.4) solo por contrato de datos (números + handlers); no debe importar el composable — los valores llegan por props desde la vista.
- Verificar el specifier de Lucide contra el resto del proyecto antes de migrar.
