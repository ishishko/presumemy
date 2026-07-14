# G1.4 — `shared/lib/usePagination.ts`

> **Ubicación (modular, rev.2):** destino `shared/lib/usePagination.ts` · sin barrel (se consume por segmento: `import { usePagination } from '@/shared/lib/usePagination'`). Genérico, sin dominio.

| | |
|---|---|
| **Ruta destino** | `web/src/shared/lib/usePagination.ts` |
| **Grupo / orden** | G1 (datos/utils) · 4º |
| **LOC actuales** | 70 |
| **Tipo** | migrar (reubicar) |
| **Dependencias** | solo Vue (`ref`/`computed`/`watch`) |
| **Consumidores** | vistas con listas paginadas client-side (Insumos, Productos, Clientes, Presupuestos, Finanzas) + `Pagination.vue` (G3.13) |

## Estado actual
Composable genérico de paginación client-side (Epic D): recibe `items` (ref o getter) + `initialPageSize`, expone `currentPage`, `pageSize`, `totalItems`, `totalPages`, `paginatedItems`, `startIndex`/`endIndex` y navegación (`prevPage`/`nextPage`/`goToPage`). Resetea a página 1 cuando cambia la cantidad de items. **No tiene dominio ni toca el API** — es puro estado derivado.

## Objetivo
Reubicar tal cual a `shared/lib`. No requiere refactor de lógica; solo mover el archivo y actualizar imports en sus consumidores.

## Plan de acción paso a paso
1. **(C13 — shared)** Mover `composables/usePagination.ts` → `shared/lib/usePagination.ts` sin cambios de lógica (genérico, sin negocio).
2. **(imports)** Actualizar consumidores a `@/shared/lib/usePagination`. (El barrido global de imports lo cierra G7.2.)
3. **(opcional, YAGNI)** Si se repite el patrón "store-list + usePagination + Pagination.vue" en ≥3 vistas, evaluar un wrapper; por ahora **no** se crea (Regla de Tres).

## Criterios de aceptación
- `vue-tsc` ok; la paginación de las listas funciona igual (misma page size, reset al filtrar).
- Vive en `shared/lib`; ningún consumidor importa la ruta vieja `composables/`.

## Riesgos / notas
- Pareja con `Pagination.vue` (G3.13): el componente es la UI, este composable es el estado. Mantener la API estable entre ambos.
- Acepta `ref` **o** getter (`() => T[]`); preservar esa firma flexible.
