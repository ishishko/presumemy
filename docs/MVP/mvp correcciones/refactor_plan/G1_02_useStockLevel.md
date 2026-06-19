# G1.2 — `composables/useStockLevel.ts` (nuevo)

| | |
|---|---|
| **Ruta** | `web/src/composables/useStockLevel.ts` |
| **Grupo / orden** | G1 (datos/utils) · 2º |
| **LOC actuales** | 0 (no existe) |
| **Tipo** | crear |
| **Dependencias** | ninguna |
| **Consumidores** | `InsumosView` (G5.4), `InsumoDetalle` (G6.5), `StockBar` (G3.6), `StatusBadge` indirectamente |

## Estado actual
La lógica de "nivel de stock" vive embebida en `InsumosView.vue` (líneas 34-73):
```ts
type Nivel = 'critico' | 'bajo' | 'ok'
function getNivel(i: Insumo): Nivel {
  const stock = Number(i.stock); const min = Number(i.stockMinimo)
  if (stock < min * 0.5) return 'critico'
  if (stock < min) return 'bajo'
  return 'ok'
}
const nivelMeta: Record<Nivel, { label; color; bg; barClass }> = { … }
```
Es **regla de negocio** mezclada con presentación, dentro de una vista. No se puede testear ni reusar (la misma noción de nivel aparece en `InsumoDetalle`).

## Objetivo (SRP + testabilidad)
Extraer la regla pura (umbrales) y su metadata visual a un composable/util reutilizable y testeable. La vista solo consume.

## Plan de acción paso a paso
1. **(SRP)** Crear `composables/useStockLevel.ts` exportando:
   - tipo `Nivel = 'critico' | 'bajo' | 'ok'`.
   - `getNivel(stock: number, minimo: number): Nivel` — función **pura** (recibe primitivos, no el `Insumo` entero → **ISP**).
   - `NIVEL_META: Record<Nivel, { label: string; tone: ... }>` — metadata (label + tono). **OJO:** los colores hardcodeados de hoy (`#EA5F3C`, `var(--coral-50)`) se reemplazan por *tonos semánticos* que `StatusBadge`/`StockBar` traducen a clases Tailwind (no colores crudos aquí).
2. **(clean code)** Si no necesita reactividad, puede ser util puro (`utils/stock.ts`); se deja como composable solo si conviene exponer `computed`. Decisión: **util puro** `getNivel` + `NIVEL_META`, sin estado.
3. **(consumo)** `InsumosView` y `InsumoDetalle` importan `getNivel`; `StockBar`/`StatusBadge` reciben el `Nivel`/`tone` ya calculado.

## Antes → Después
```ts
// Después: composables/useStockLevel.ts  (o utils/stock.ts)
export type Nivel = 'critico' | 'bajo' | 'ok'
export function getNivel(stock: number, minimo: number): Nivel {
  if (stock < minimo * 0.5) return 'critico'
  if (stock < minimo) return 'bajo'
  return 'ok'
}
export const NIVEL_META: Record<Nivel, { label: string; tone: 'danger' | 'warning' | 'ok' }> = {
  critico: { label: 'Crítico', tone: 'danger' },
  bajo:    { label: 'Bajo',    tone: 'warning' },
  ok:      { label: 'OK',      tone: 'ok' },
}
```

## Componentes/utils que crea
`getNivel`, `NIVEL_META`, tipo `Nivel`.

## Criterios de aceptación
- `vue-tsc` ok.
- **Test unitario**: `getNivel(4,10)='critico'`, `getNivel(8,10)='bajo'`, `getNivel(12,10)='ok'`, bordes (`stock==min`, `stock==min*0.5`).

## Riesgos / notas
- No arrastrar colores crudos al composable: la traducción tono→clase Tailwind vive en los componentes de presentación (`StatusBadge` G3.2, `StockBar` G3.6). Mantiene el composable libre de UI.
- Confirmar los umbrales exactos contra el comportamiento actual (`< min*0.5` y `< min`).
