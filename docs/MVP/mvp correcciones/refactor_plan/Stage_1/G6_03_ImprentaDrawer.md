# G6.3 — `modules/finanzas/ImprentaDrawer.vue`

> **Ubicación (modular, rev.2):** destino `modules/finanzas/ImprentaDrawer.vue`. Presupuestos vía `@/modules/presupuestos` (barrel).

| | |
|---|---|
| **Ruta destino** | `web/src/modules/finanzas/ImprentaDrawer.vue` |
| **Grupo / orden** | G6 (pesados) · 3º |
| **LOC actuales** | 534 (≈195 de `<style scoped>`) |
| **Tipo** | migrar (+ extracción) |
| **Dependencias** | G2.8 (`DrawerShell`), G2.1 (`ToggleSwitch`), G2.4/2.5, G3.1 (`BaseButton`), G2.6 (`ConfirmDialog`), G1.1 (`formatMoney`), G1.3 (store finanzas), `usePresupuestosStore` |
| **Consumidores** | `FinanzasPage` (G5.6) |

## Estado actual
Drawer de orden de imprenta: fecha, presupuesto (datalist), temática, hojas, tipo de hoja, valor nuestro/patri (diferencia), método de pago, pagado (toggle). Mismos smells que los otros drawers:
- **Reimplementa el shell inline** (no usa `DrawerShell`); `<style scoped>` duplicado.
- `import { post, put, get }` directo (**DIP**); **carga presupuestos por su cuenta** (líneas 130-139) → store.
- `money()` local; `dirty` manual (~28 líneas).
- `pagado` probablemente con switch/checkbox propio → usar `ToggleSwitch`.
- `metodosPago` catálogo local; `tipoHoja` default string mágico (`'Opalina A4 220 g'`).

## Objetivo
Drawer sobre `DrawerShell`, datos vía store, `formatMoney`, `ToggleSwitch` para pagado, Tailwind, dirty con `useDirty`. Reusa `SignedAmountInput`/patrones de `MovimientoDrawer` si aplica.

## Plan de acción paso a paso
1. **(DRY)** Reescribir con `DrawerShell` (slots body/foot). Borra ~195 líneas duplicadas.
2. **(DIP)** `post`/`put` → store finanzas (`createOrden`/`updateOrden`); presupuestos → `usePresupuestosStore` (no `get` directo).
3. **(DRY)** `money` → `formatMoney`; el cálculo `diff` (valorNuestro − valorPatri) se mantiene como computed.
4. **(reuso)** `pagado` → `ToggleSwitch` (G2.1). Método de pago → `FloatingSelect`. Campos numéricos → `FloatingField type=number`.
5. **(dirty)** `useDirty`. **(Tailwind)** migrar campos, summary/diff y `.fd-*`.
6. **(clean)** Extraer `tipoHoja` default y `metodosPago` a constantes nombradas (evitar string mágico repetido).

## Componentes/utils que consume
`DrawerShell`, `ToggleSwitch`, `FloatingField`, `FloatingSelect`, `BaseButton`, `ConfirmDialog`, stores, `formatMoney`. Posible reuso de `SignedAmountInput` (de G6.2) si encaja.

## Criterios de aceptación
- `vue-tsc` ok; alta/edición de orden, validación (temática requerida, no negativos), diferencia, pagado y datalist funcionan igual.
- Usa `DrawerShell`; sin `services/api` directo.

## Riesgos / notas
- Nombres de campos del modelo algo confusos (`valorUnitario`/`valorTotal` ↔ `valorNuestro`/`valorPatri` en el form). Mantener el mapeo actual al payload; documentar para no invertirlos.
- Coordinar con `MovimientoDrawer` para reusar componentes comunes (ambos drawers comparten estructura de finanzas).
