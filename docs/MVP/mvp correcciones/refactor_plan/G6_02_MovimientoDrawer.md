# G6.2 — `components/drawers/MovimientoDrawer.vue`

> **Ubicación (modular, rev.2):** destino `modules/finanzas/MovimientoDrawer.vue` · `SignedAmountInput`/catálogo `tipos.ts` → `modules/finanzas`. Presupuestos para el datalist se traen vía `@/modules/presupuestos` (barrel).

| | |
|---|---|
| **Ruta** | `web/src/components/drawers/MovimientoDrawer.vue` |
| **Grupo / orden** | G6 (pesados) · 2º |
| **LOC actuales** | 530 (≈195 de `<style scoped>`) |
| **Tipo** | migrar (+ extracción) |
| **Dependencias** | G2.8 (`DrawerShell`), G2.4/2.5, G3.1 (`BaseButton`), G2.6 (`ConfirmDialog`), G1.1 (`formatMoney`), G1.3 (store finanzas), catálogo común de tipos |
| **Consumidores** | `FinanzasView` (G5.6) |

## Estado actual
Drawer de movimiento financiero: fecha, cuenta, tipo, signo (ingreso/egreso), valor (money input grande), detalle, nro factura, presupuesto (datalist). Resumen de impacto. Smells:
- **Reimplementa el shell de drawer inline** (líneas 336-530) en vez de `DrawerShell`.
- `import { post, put, get }` directo (**DIP**) — además **carga presupuestos por su cuenta** (`get('/presupuestos')`, líneas 175-184) → debería venir del store de presupuestos.
- `tipoMovs` con `sign` **duplicado** con `FinanzasView` (que tiene el mismo catálogo con `color`) → catálogo común.
- `money` inline (`moneyAbs`), hex `#2E6F70` crudo en summary y money-input.
- `dirty` manual; sign-toggle (`fd-sign-toggle`), money input (`fd-money-input`), summary (`fd-summary`) scoped.
- Mezcla `FloatingField`/`FloatingSelect` (bien) con `.field`/`.fd-row`/`label` globales.

## Objetivo
Drawer sobre `DrawerShell`, catálogo de tipos compartido, datos vía store, `formatMoney`, Tailwind. El sign-toggle y money-input se vuelven subcomponentes o utilidades.

## Plan de acción paso a paso
1. **(DRY)** Reescribir con `DrawerShell` (slots body/foot). Borra ~195 líneas duplicadas.
2. **(SRP/DRY)** Extraer catálogo `utils/movimientoTipos.ts`: `TIPOS_MOV: { id; label; sign }[]` + helper de signo + mapa tono (ingreso/egreso). Compartido con `FinanzasView` (G5.6). Elimina la duplicación del array.
3. **(DIP)** `post`/`put` → store finanzas (`createTransaccion`/`updateTransaccion`); la carga de presupuestos → `usePresupuestosStore` (no `get` directo).
4. **(SRP)** Extraer `SignedAmountInput.vue` (sign-toggle + money input grande con color por signo) — encapsula `fd-sign-toggle` + `fd-money-input`. Reusable también en `ImprentaDrawer`/otros si aplica.
5. **(DRY)** `moneyAbs` → `formatMoney`; quitar hex `#2E6F70` → tono teal del DS.
6. **(dirty)** `useDirty`. **(Tailwind)** migrar `fd-summary`, `.fd-row`, labels.

## Componentes que crea/consume
Crea `utils/movimientoTipos.ts`, `SignedAmountInput.vue`. Consume `DrawerShell`, `FloatingField`, `FloatingSelect`, `BaseButton`, `ConfirmDialog`, stores, `formatMoney`.

## Criterios de aceptación
- `vue-tsc` ok; tipo→signo automático, impacto, datalist de presupuestos, dirty+confirm-exit funcionan igual.
- Usa `DrawerShell`; catálogo de tipos único; sin `services/api` directo.

## Riesgos / notas
- El `watch(tipo)` que ajusta el signo según `tipoMovs.sign` debe preservarse (vive en el catálogo compartido).
- El datalist usa `folio` como valor pero guarda `presupuestoId` numérico — preservar el mapeo.
