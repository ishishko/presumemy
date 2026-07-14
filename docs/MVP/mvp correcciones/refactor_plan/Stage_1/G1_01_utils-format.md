# G1.1 — `shared/lib/format.ts` (nuevo)

> **Ubicación (modular, rev.2):** destino `shared/lib/format.ts` · import `@/shared/lib`.

| | |
|---|---|
| **Ruta destino** | `web/src/shared/lib/format.ts` |
| **Grupo / orden** | G1 (datos/utils) · 1º |
| **LOC actuales** | 0 (no existe; tampoco la carpeta `shared/`) |
| **Tipo** | crear |
| **Dependencias** | ninguna |
| **Consumidores** | `InsumosPage`, `FinanzasPage`, `PresupuestoEditor`, `PresupuestoDoc`, `ProductoDetalle`, y toda vista con montos |

## Estado actual
No existe utilidad de formato centralizada. `InsumosView.vue` define inline (líneas 58-60):
```ts
function money(v: number): string {
  return `$ ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
```
Este `money()` (o variantes) está **duplicado** en varias vistas/overlays → violación de DRY y de "una sola razón de cambio" para el formato de moneda (que CLAUDE.md define: `$ 1,250.00 MXN`).

## Objetivo (SRP)
Un único módulo de funciones puras de formato. Cambiar el formato de moneda = un solo lugar.

## Plan de acción paso a paso
1. **(SRP)** Crear `shared/lib/format.ts` con funciones puras exportadas:
   - `formatMoney(value: number, opts?: { mxn?: boolean }): string` — `$ 1,250.00` y, con `mxn:true`, sufijo ` MXN` (según contexto financiero vs tabla densa, ver CLAUDE.md).
   - `formatDate(value: string | Date): string` — formato es-MX consistente (revisar formatos usados hoy en presupuestos/finanzas al migrar esas vistas).
2. **(clean code)** Sin estado, sin dependencias de Vue ni del DOM. Nombres de dominio claros (no `fmt`, no `data`).
3. Documentar con JSDoc breve los casos (densa vs financiera).

## Antes → Después
```ts
// Antes: money() repetido en cada vista
// Después: shared/lib/format.ts
export function formatMoney(value: number, opts: { mxn?: boolean } = {}): string {
  const base = `$ ${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return opts.mxn ? `${base} MXN` : base
}
```
En las vistas: `import { formatMoney } from '@/shared/lib'` y reemplazar `money(x)` → `formatMoney(x)`.

## Componentes/utils que crea
`formatMoney`, `formatDate` (consumidos por G5/G6).

## Criterios de aceptación
- `vue-tsc` ok.
- **Test unitario** (`shared/lib/__tests__/format.spec.ts`): casos de enteros, decimales, cero, y sufijo MXN. (Beneficio de testabilidad SOLID.)

## Riesgos / notas
- Antes de fijar `formatDate`, revisar los formatos de fecha reales que usan presupuestos/finanzas para no cambiar la salida visible.
- Confirmar alias `@/shared/lib` en `tsconfig`/`vite` (ya se usa `@/` en todo el proyecto).
