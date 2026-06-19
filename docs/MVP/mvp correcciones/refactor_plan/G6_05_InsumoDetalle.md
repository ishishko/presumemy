# G6.5 — `components/overlays/InsumoDetalle.vue`

| | |
|---|---|
| **Ruta** | `web/src/components/overlays/InsumoDetalle.vue` |
| **Grupo / orden** | G6 (pesados) · 5º |
| **LOC actuales** | 1.344 (≈900 de template + `<style scoped>`) |
| **Tipo** | migrar (+ extracción fuerte) |
| **Dependencias** | G2.1/2.4/2.5, G3.1, G2.6, G1.1, G1.2, G1.3; nuevos `ProveedoresEditor`, `useInsumoCosteo`, posible `OverlayShell` |
| **Consumidores** | `InsumosView` (G5.4) |

## Estado actual
Overlay fullscreen de insumo con secciones **Identidad / Stock (semáforo) / Costeo (simple o pack) / Proveedores / Notas / footer**. El más complejo del proyecto. Smells:
- `import { get, post, put, del }` directo (**DIP**) — carga categorías y proveedores por su cuenta; crea/borra proveedores globales vía API desde el overlay.
- **Editor de proveedores muy pesado** (≈250 líneas de lógica): autocomplete contra `proveedoresList`, crear-al-vuelo con `ConfirmDialog`, borrar proveedor global, navegación por teclado (Enter→siguiente fila), `focusProviderInput`, `cleanupEmptyProveedores`, `onProvTableFocusout`, highlight de fila activa, límite 3, regla "uno principal".
- **Semáforo de stock con umbrales DISTINTOS a `useStockLevel`** (G1.2): aquí `sin_unidades` (s=0), `critico` (s≤m·0.2), `bajo` (s<m), `ok`. Usa tokens `--orange-ink`/`--orange-50` (¿existen?) — reconciliar.
- `costoUnitario` (simple = costoPaquete; pack = costoPaquete/cantidadPack) → regla de negocio.
- `money` local; `dirty` manual (~35 líneas con comparación de proveedores).
- Integra modo editor del topbar (`update:header`/`editorDirty`), `body.no-scroll`.

## Objetivo
Overlay delgado: shell + secciones, con **proveedores y costeo extraídos**, datos vía stores, semáforo unificado con `useStockLevel`, Tailwind. Este es el de mayor reducción de complejidad.

## Plan de acción paso a paso
1. **(SRP — clave)** Extraer `components/insumos/ProveedoresEditor.vue`: encapsula la tabla de proveedores + toda su lógica (autocomplete, crear/borrar con sus `ConfirmDialog`, teclado, cleanup, principal). v-model de `proveedores[]` + recibe `proveedoresList`. Reduce el archivo a la mitad y aísla la parte más frágil.
2. **(DIP)** Crear/usar `useProveedoresStore` (o métodos en `useInsumosStore`) para `crear`/`borrar` proveedor global y listar; el editor no toca `services/api`. Categorías → `useInsumosStore`.
3. **(SRP/test)** Extraer `useInsumoCosteo` (simple/pack → `costoUnitario`). Regla de negocio testeable.
4. **(reconciliar G1.2)** El semáforo aquí tiene 4 niveles (incluye `sin_unidades` y umbral `0.2`), distinto de `useStockLevel` (3 niveles, `0.5`). **Decisión:** unificar en `useStockLevel` con una variante/parámetro, o documentar que el overlay usa un nivel más granular. No duplicar la lógica; centralizar. Tokens `orange` faltantes → agregar a `@theme` o mapear a `--yellow`/`--coral`.
5. **(reuso)** `costoUnitario` muestra → `formatMoney`. `esSimple` toggle → `ToggleSwitch`/`SegmentedControl`. Campos → `FloatingField`/`FloatingSelect`. Stock bar/semáforo → `StockBar`/`StatusBadge` (con el nivel granular).
6. **(reuso/eval)** `OverlayShell` compartido con `ProductoDetalle` (G6.4).
7. **(DRY)** `dirty` → `useDirty` (incluida la comparación de proveedores). **(Tailwind)** migrar `id-*`/`ins-*`/`cell-*` scoped; botón guardar sin `:style` inline. **(C6)** conservar transición `overlay`.

## Componentes/utils que crea
`ProveedoresEditor.vue`, `useInsumoCosteo`, (posible) `useProveedoresStore`, `OverlayShell.vue`.

## Criterios de aceptación
- `vue-tsc` ok; proveedores (autocomplete, crear-al-vuelo, borrar global, teclado Enter, límite 3, principal), costeo simple/pack, semáforo, modo editor, guardar/eliminar/exit: **todo idéntico**.
- Sin `services/api` directo; semáforo unificado; sin `:style` inline.
- `useInsumoCosteo` y el nivel de stock con tests.

## Riesgos / notas
- **El más riesgoso del refactor.** La lógica de foco/blur de proveedores es delicada (escritura fantasma detrás del modal, cleanup en focusout). Extraer con cuidado y probar a teclado y mouse exhaustivamente.
- `ProveedoresEditor` es el subcomponente más valioso de todo el plan; diseñarlo con API por v-model + eventos clara.
- Verificar existencia de tokens `--orange-ink`/`--orange-50`/`--green-*` antes de mapear.
