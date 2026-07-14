# G3.14 — `modules/search/` (búsqueda global)

> **Ubicación (modular, rev.2):** nuevo módulo `modules/search/` con `useGlobalSearch.ts` + `search-api.ts` + `types.ts` (`SearchResult`) + `index.ts`. Lo consume **`app/shell/AppHeader`** vía barrel (`@/modules/search`) — único caso permitido donde `app` importa un módulo (respeta `app → modules`). Justificación en `00_Arquitectura_Modular.md` §9.

| | |
|---|---|
| **Ruta destino** | `web/src/modules/search/{useGlobalSearch.ts, search-api.ts, types.ts, index.ts}` |
| **Grupo / orden** | G3 (UI/shell) · 14º — antes de migrar `AppHeader` (G3.9) o en coordinación con él |
| **LOC actuales** | 81 (`composables/useGlobalSearch.ts`) |
| **Tipo** | migrar (reubicar + DIP) + crear módulo |
| **Dependencias** | G1 (`shared/api/client.ts`); Vue |
| **Consumidores** | `app/shell/AppHeader` (G3.9) — dropdown de resultados del topbar |

## Estado actual
Composable de búsqueda global del topbar (Epic D): `query` con debounce 300ms, `AbortController` para cancelar requests en vuelo, `results`/`loading`. Define el tipo `SearchResult` (`tipo: insumo|producto|cliente|presupuesto`, `id`, `codigo`, `titulo`, `subtitulo`) y pega a `/search`. Smells:
- **(DIP)** Importa `get` de `@/services/api` **directo** desde el composable. En la arquitectura modular la UI/feature no toca `shared/api`; debe pasar por el `api.ts` del módulo.
- `let timer: any` y `abortController` sueltos → tipar (`ReturnType<typeof setTimeout>`).
- Lógica de "trimmed < 2" duplicada en `watch` y en `performSearch`.

## Objetivo
Extraer un módulo `search/` autocontenido: el `useGlobalSearch` orquesta debounce + estado, y delega el request en `search-api.ts` (que es el único que conoce `shared/api/client`). El tipo `SearchResult` vive en `types.ts` y se exporta por el barrel. `AppHeader` (en `app/shell`) lo consume por `@/modules/search`.

## Plan de acción paso a paso
1. **(scaffolding)** Crear `modules/search/` con `index.ts` (barrel).
2. **(DIP — C15)** Crear `modules/search/search-api.ts`: `searchAll(q, signal): Promise<SearchResult[]>` que usa `client`/`get` de `shared/api`. El composable deja de importar `services/api`.
3. **(tipos)** Mover `SearchResult` a `modules/search/types.ts`; exportarlo por el barrel (lo necesita `AppHeader` para tipar el dropdown).
4. **(reubicar)** Mover el composable a `modules/search/useGlobalSearch.ts`; que llame a `searchAll` en vez de `get('/search', …)`.
5. **(limpieza)** Tipar `timer` (`ReturnType<typeof setTimeout> | null`); unificar el guard `trimmed.length < 2` en un helper interno; conservar el `AbortController` y `onUnmounted` cleanup (comportamiento de cancelación correcto).
6. **(barrel)** `index.ts` exporta `useGlobalSearch` y `type SearchResult`.
7. **(consumidor)** En `G3_09_AppHeader.md`: el header importa `{ useGlobalSearch, type SearchResult } from '@/modules/search'` (no de `composables/`). Es el **único** import `app → module` del shell; documentarlo ahí.

## Componentes/utils que crea
`modules/search/search-api.ts`, `modules/search/types.ts`, `modules/search/index.ts` (+ reubica `useGlobalSearch.ts`).

## Criterios de aceptación
- `vue-tsc` ok; búsqueda con debounce 300ms, cancelación de request previa, `< 2` chars limpia resultados, dropdown del topbar funciona igual.
- El composable **no** importa `services/api`/`shared/api` directo (pasa por `search-api.ts`).
- `AppHeader` consume `@/modules/search` por barrel; sin imports a `composables/` viejo.

## Riesgos / notas
- Es el **único caso** donde `app/` (shell) importa un módulo; está permitido por la regla `app → modules` y se valida en el enforcement (G7.2) como excepción esperada, no como cross-module lateral.
- No acoplar a los stores de los 4 dominios: `search/` solo conoce el contrato `SearchResult` que devuelve el endpoint `/search`, no los módulos individuales.
- Verificar navegación desde un resultado (router push a la entidad) — si esa lógica está hoy en `AppHeader`, se queda en el shell; el módulo solo provee datos.
