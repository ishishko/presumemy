# G5.3 — `views/ProductosView.vue`

| | |
|---|---|
| **Ruta** | `web/src/views/ProductosView.vue` |
| **Grupo / orden** | G5 (vistas) · 3º |
| **LOC actuales** | 253 |
| **Tipo** | migrar |
| **Dependencias** | G1.1, G1.3, G3.1 (`BaseButton`), G4.1 (`CategoriaPills`), G4.2 (`CategoriaDeleteDialog`), nuevo `ProductCard` |
| **Consumidores** | ruta `/productos` |

## Estado actual
Grid de productos con: chips de estado (todos/favoritos/desactualizados), `CategoriaPills`, tarjetas con thumb/fav-toggle/warning/precio/acciones. CRUD + favorito (`patch /productos/:id/favorito`) + categorías. Smells:
- `import { del, patch }` directo (**DIP** para `del`; `patch` de favorito también debería ir al store).
- `money()` local.
- **Colores amber hardcodeados** (`#D97706`, `#FBBF24`, `#FEF3C7`, `#FCD34D`) — no son tokens del DS; el DS usa `--yellow`/`--yellow-ink`. Reconciliar.
- `<style scoped>` extenso para `.prod-card/.prod-actions/.prod-fav-btn/.prod-warning-badge`.
- Chips `.insumos-state-pill` reutilizados (mismos que Insumos → candidato a `FilterChips`).
- Clases globales `.prod-grid/.prod-card/...`.

## Objetivo
Grid con `ProductCard` reutilizable, chips de estado compartidos, sin `services/api` directo, sin `money()` local, colores del DS (no amber crudo).

## Plan de acción paso a paso
1. **(DIP)** `del` → `store.remove`; mover `toggleFavorite`'s `patch` al store (`store.toggleFavorito(id)` que hace el `patch` + `upsert`). La vista no toca `services/api`.
2. **(SRP)** Extraer `components/productos/ProductCard.vue` (props `producto`; emits `edit/delete/toggle-favorite`). Mueve el markup + `<style scoped>` de la card y su hover de acciones.
3. **(DS)** Reemplazar amber crudo por tokens: favorito/warning → `--yellow`/`--yellow-ink` (o agregar tokens `amber-*` a `@theme` si el DS realmente quiere ese tono; **decisión a anotar** — preferir tokens existentes).
4. **(DRY)** Chips de estado → extraer `components/ui/FilterChips.vue` (compartido con `InsumosView`, mismo `.insumos-state-pill`). Props `chips` + v-model.
5. **(reuso)** `money` → `formatMoney`. `CategoriaPills`/`CategoriaDeleteDialog` ya migrados (G4).
6. **(Tailwind)** `.prod-grid` → `grid grid-cols-[repeat(auto-fill,minmax(...))] gap-4`.

## Componentes que crea/consume
Crea `ProductCard.vue`, `FilterChips.vue`. Consume `formatMoney`, `CategoriaPills`, `CategoriaDeleteDialog`, store con `toggleFavorito`.

## Criterios de aceptación
- `vue-tsc` ok; grid, favorito (toggle optimista o vía store), warning, filtros idénticos.
- Sin `services/api`; sin amber hardcodeado fuera de tokens.

## Riesgos / notas
- **Decisión de color:** el amber actual no es token del DS. Resolver: usar `--yellow`/`--yellow-ink` o introducir `amber` en `@theme`. Documentar.
- `FilterChips` se diseña aquí pero debe servir a Insumos (G5.4); coordinar API.
