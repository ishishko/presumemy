# G6.4 — `components/overlays/ProductoDetalle.vue`

| | |
|---|---|
| **Ruta** | `web/src/components/overlays/ProductoDetalle.vue` |
| **Grupo / orden** | G6 (pesados) · 4º |
| **LOC actuales** | 984 (≈460 de `<style scoped>`) |
| **Tipo** | migrar (+ extracción fuerte) |
| **Dependencias** | G2.1/2.3/2.4/2.5, G3.1, G2.6, G1.1, G1.3, G3.12 (`OverlayShell`); nuevos `BomEditor`, `useProductoPricing` |
| **Consumidores** | `ProductosView` (G5.3) |

## Estado actual
Overlay fullscreen (`pd-overlay`: `fixed top:56 left:240`, grid `1fr auto`) con secciones **Fotos / Identidad / Precios / Receta(BOM) / footer**. Integra el "modo editor" del topbar (`update:header` + `editorDirty` de `useEditorMode`), togglea `body.no-scroll`. Smells:
- `import { get, post, put, del }` directo (**DIP**) — además **carga categorías e insumos por su cuenta** (líneas 291-304) → stores.
- `money()` local; `dirty` manual (~16 líneas).
- **CSS muerto/duplicado:** reimplementa `.segmented`/`.seg-btn` (líneas 792-818) y `.pd-switch` (757-782) en scoped **aunque importa** `SegmentedControl` y `ToggleSwitch` → eliminar duplicados.
- **Lógica de costeo en la vista:** `bomTotal`/`costoProducto`/`precioCalculado` + `watch` que sincroniza precio y `syncBomLineasCosts` → composable.
- Tabla BOM con `cell-select`/`cell-input`/`num-input` editables + `add-line-btn` dashed.
- Amber hardcodeado (`#D97706/#FEF3C7/#FCD34D`) en `price-warning-banner`; `#F0EEF4` en photo.
- `:style` inline en botón guardar (dirty) y muchas celdas.

## Objetivo
Overlay delgado: shell reutilizable + secciones, con el BOM y el costeo extraídos, datos vía stores, sin CSS duplicado/muerto, sin `:style` inline, Tailwind.

## Plan de acción paso a paso
1. **(SRP)** Extraer `components/productos/BomEditor.vue`: v-model de `bomLineas[]`, maneja add/remove/`onInsumoChange`, recibe `insumosList`, calcula subtotales. Encapsula la tabla BOM + `add-line-btn`.
2. **(SRP)** Extraer composable `useProductoPricing` (de `bomTotal`/`costoProducto`/`precioCalculado` + sync precio↔manual). Lógica de negocio testeable, fuera del componente.
3. **(DIP)** `get/post/put/del` → `useProductosStore` (incluye categorías) + `useInsumosStore` (lista de insumos). El overlay no toca `services/api`.
4. **(DRY)** `money` → `formatMoney`; eliminar `.segmented`/`.seg-btn`/`.pd-switch` scoped (ya cubiertos por los componentes importados).
5. **(reuso — DECIDIDO rev.1)** Usar `OverlayShell` (**G3.12**, ya con doc propio) como shell fullscreen; no reimplementar el overlay ni su transición/`no-scroll`.
6. **(Tailwind/DS)** Migrar `.pd-*` a utilidades; amber → tokens (`--yellow`/`--yellow-ink`, ver decisión de G5.3). Botón guardar → `BaseButton :disabled="!dirty"` (sin `:style`).
7. **(C6)** Conservar `@keyframes overlay-in/out` (excepción).

## Componentes/utils que crea
`BomEditor.vue`, `useProductoPricing`, posible `OverlayShell.vue`.

## Criterios de aceptación
- `vue-tsc` ok; secciones, costeo (BOM→costo→precio calc→final, warning bajo sugerido), modo editor del topbar, `no-scroll`, guardar/eliminar/exit funcionan igual.
- Sin `services/api` directo; sin CSS duplicado/muerto; sin `:style` inline.
- `useProductoPricing` con test unitario (costeo es regla de negocio).

## Riesgos / notas
- **Integración con `useEditorMode`/topbar** (`update:header`, `editorDirty`, Teleport-like): mantenerla intacta — el header del shell muestra guardar/cerrar y el badge.
- `medida` se bindea pero al guardar no se envía (se mapea a `descripcion` de forma confusa, líneas 138-139); documentar/limpiar sin cambiar comportamiento visible.
- `tieneBom` siempre true en la práctica; revisar si la rama "sin BOM" es código muerto.
