# G6.6 — `components/editors/PresupuestoEditor.vue`

| | |
|---|---|
| **Ruta** | `web/src/components/editors/PresupuestoEditor.vue` |
| **Grupo / orden** | G6 (pesados) · 6º — **el más grande del proyecto** |
| **LOC actuales** | 1.421 |
| **Tipo** | migrar (+ extracción fuerte) |
| **Dependencias** | G2.3/2.4, G3.1/3.2, G2.6, G4.3 (`PresupuestoDoc`), G1.1, G1.3, `presupuestoEstado.ts` (de G5.5); nuevos `LinesSpreadsheet`, `EstadoDropdown` (reuso G5.5), `usePresupuestoCalc` |
| **Consumidores** | `PresupuestosView` (G5.5) |

## Estado actual
Editor fullscreen **split**: panel izquierdo (form) + panel derecho (preview con `PresupuestoDoc`). Incluye: datos de cliente (autocomplete), temática, fechas, entrega (`SegmentedControl` retira/envío), seña, notas, **spreadsheet de líneas** (drag&drop, navegación por teclado, autocomplete de producto, totales), dropdown de **estado FSM** con badge teletransportado al topbar (`#editor-header-status`), focus-trap del dialog, generación de PDF/link público. Smells:
- `import { get, post, put, patch }` directo (**DIP**); carga clientes/productos/config por su cuenta.
- `statusTones`/`TRANSITIONS` **duplicados** (3ª vez: Dashboard, PresupuestosView, acá) → `utils/presupuestoEstado.ts`.
- `money` local; dirty por snapshot manual (`getFormSnapshot`/`originalFormSnapshot`).
- Lógica enorme de spreadsheet (drag, teclado Enter/Tab, focus, cleanup, `isRowEmpty/Invalid`) embebida.
- Cálculos (`subtotal/total/restoCalc`) en el componente.
- Clases globales `.lines-spreadsheet`, `.cell-input`, editor split, totals (`components.css` ~1186-1760).

## Objetivo
Editor compuesto y delgado: shell split + `LinesSpreadsheet` + `EstadoDropdown` + `PresupuestoDoc`, cálculos y FSM en módulos compartidos, datos vía stores, Tailwind. Máxima extracción.

## Plan de acción paso a paso
1. **(SRP — clave)** Extraer `components/presupuestos/LinesSpreadsheet.vue`: v-model de `lineas[]`, recibe `productos` para autocomplete; encapsula drag&drop (`onDrop`/`dragId`), navegación teclado (`onCellEnter`/`onTableFocusout`/`focusRowFirstCell`), `add/remove/updateLine`, `isRowEmpty/Invalid`, totales de fila. Es el grueso del archivo.
2. **(DRY/SRP)** Reusar `utils/presupuestoEstado.ts` (de G5.5) para `statusTones`/`TRANSITIONS`/`getAvailableTransitions`. Reusar `EstadoDropdown` (de G5.5) para el selector de estado (con su Teleport del badge a `#editor-header-status`).
3. **(SRP/test)** Extraer `usePresupuestoCalc` (`subtotal`/`total`/`restoCalc`). Regla de negocio testeable.
4. **(DIP)** `get/post/put/patch` → stores (`usePresupuestosStore` para guardar/estado; `useClientesStore`/`useProductosStore` para autocomplete; config de ajustes). El editor no toca `services/api`.
5. **(reuso)** `money` → `formatMoney`; entrega → `SegmentedControl`; campos → `FloatingField` (validez por campo: `clienteInvalid`/`senaInvalid` → prop `invalid`). Preview = `PresupuestoDoc` (ya migrado, G4.3).
6. **(dirty)** Mantener el snapshot dirty (o `useDirty`); preservar la integración con `editorDirty`/`useEditorMode` y el Teleport del badge al header.
7. **(a11y)** Conservar el **focus-trap** (`onOverlayKeydown`, `getFocusable`, `restoreFocus`) — no degradar.
8. **(Tailwind/C6)** Migrar editor split + `.lines-spreadsheet` + totals a utilidades; conservar transición de entrada. Botón guardar sin `:style` inline.

## Componentes/utils que crea/consume
Crea `LinesSpreadsheet.vue`, `usePresupuestoCalc`. Consume `EstadoDropdown` + `presupuestoEstado.ts` (G5.5), `PresupuestoDoc`, `SegmentedControl`, `FloatingField`, `BaseButton`, stores, `formatMoney`.

## Criterios de aceptación
- `vue-tsc` ok; spreadsheet (drag&drop, teclado Enter/Tab, autocomplete producto, filas vacías), totales, dropdown de estado + badge en topbar, focus-trap, PDF/link, guardar funcionan **idénticos**.
- Sin `services/api` directo; `statusTones`/`TRANSITIONS` definidos una sola vez (compartidos con Dashboard/PresupuestosView).
- `usePresupuestoCalc` con test.

## Riesgos / notas
- **El refactor de mayor superficie.** Hacerlo último, con todos los primitivos y `presupuestoEstado.ts` ya estables.
- **(C11, rev.1)** No romper el **Teleport del badge**: usar la constante compartida `EDITOR_STATUS_SLOT_ID` (definida en G3.9) en vez del string literal `'editor-header-status'`, para que el contrato con `AppHeader` sea explícito y refactor-safe. Mantener la integración con `useEditorMode` (guardar/cerrar desde el topbar).
- `presupuestoSchema` (zod) de validación se conserva.
- El cambio de estado acá es **local** (se persiste al guardar), distinto del de `PresupuestosView` (persiste inmediato) — preservar esa diferencia.
- Verificar acción de PDF/link público (coordinación con `PublicPresupuestoView`/Puppeteer).
