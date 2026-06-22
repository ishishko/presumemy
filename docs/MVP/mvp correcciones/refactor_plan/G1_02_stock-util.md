# G1.2 — `modules/insumos/stock.ts` (nuevo)

> **Ubicación (modular, rev.2):** destino **`modules/insumos/stock.ts`** (es dominio insumo, no `shared`) · barrel `@/modules/insumos`.

> **rev.1:** antes `composables/useStockLevel.ts`. Era un util **puro** sin reactividad → renombrado a `utils/stock.ts` y sin prefijo `use*` (que implica reactividad en Vue). Además se unifica el **modelo de semáforo** (ver C8 del índice).

| | |
|---|---|
| **Ruta destino** | `web/src/modules/insumos/stock.ts` |
| **Grupo / orden** | G1 (datos/utils) · 2º |
| **LOC actuales** | 0 (no existe) |
| **Tipo** | crear |
| **Dependencias** | ninguna |
| **Consumidores** | `InsumosPage` (G5.4), `InsumoDetalle` (G6.5), `StockBar` (G3.6), `StatusBadge` (G3.2) |

## Estado actual
La lógica de nivel de stock está **duplicada y divergente** en dos lugares:
- `InsumosView.vue` (34-73): 3 niveles (`critico` si `stock < min*0.5`, `bajo` si `< min`, `ok`).
- `InsumoDetalle.vue` (60-76): **4 niveles** (`sin_unidades` si `stock=0`, `critico` si `≤ min*0.2`, `bajo` si `< min`, `ok`), con su `nivelMeta` (usa tokens `--orange-*`, ya existentes).

Es regla de negocio mezclada con presentación, repetida con umbrales distintos.

## Objetivo (SRP + testabilidad + modelo único)
Un único util puro, fuente de verdad del nivel de stock. Cambiar umbrales = un solo lugar. Sin reactividad (no es composable).

## Plan de acción paso a paso
1. **(SRP/C8)** Crear `modules/insumos/stock.ts` con el **modelo canónico de 4 niveles** (el de `InsumoDetalle`):
   ```ts
   export type Nivel = 'sin_unidades' | 'critico' | 'bajo' | 'ok'
   export function getNivel(stock: number, minimo: number): Nivel {
     if (stock <= 0) return 'sin_unidades'
     if (minimo > 0 && stock <= minimo * 0.2) return 'critico'
     if (minimo > 0 && stock < minimo) return 'bajo'
     return 'ok'
   }
   export const NIVEL_META: Record<Nivel, { label: string; tone: 'danger' | 'warning' | 'ok' | 'neutral' }> = {
     sin_unidades: { label: 'Sin unidades', tone: 'danger' },
     critico:      { label: 'Crítico',      tone: 'danger' },
     bajo:         { label: 'Bajo',         tone: 'warning' },
     ok:           { label: 'OK',           tone: 'ok' },
   }
   ```
2. **(ISP)** `getNivel` recibe primitivos (`stock`, `minimo`), no el `Insumo`.
3. **(compat lista)** Para la tabla de `InsumosPage` (que hoy maneja 3 chips), exponer `nivelColapsado(nivel): 'critico'|'bajo'|'ok'` que mapea `sin_unidades`→`critico`. Así la vista no pierde su UI de 3 estados pero comparte la regla.
4. **(sin colores crudos)** `NIVEL_META` usa `tone` semántico; la traducción tono→clase Tailwind vive en `StatusBadge`/`StockBar`.
5. **(fillPct)** Mover también el cálculo de relleno (`fillPct` de InsumoDetalle / fórmula de StockBar) a un helper `fillPct(stock, minimo)` si se reusa en ≥2 lugares.

## Antes → Después
- **Antes:** `getNivel`/`nivelMeta` embebidos y distintos en 2 archivos.
- **Después:** `modules/insumos/stock.ts` único; `StockBar`/`StatusBadge`/vistas lo consumen vía barrel `@/modules/insumos`.

## Criterios de aceptación
- `vue-tsc` ok.
- **Test unitario** (`modules/insumos/__tests__/stock.spec.ts`): `getNivel(0,10)='sin_unidades'`, `(2,10)='critico'`, `(8,10)='bajo'`, `(12,10)='ok'`; bordes `stock==min*0.2`, `minimo==0`.
- `nivelColapsado` cubierto.

## Riesgos / notas
- **Cambio de comportamiento a confirmar (C8):** `InsumosPage` hoy usa umbral `0.5`; el canónico adopta `0.2`. Validar en el piloto (G5.4) que la lista de insumos "bajos/críticos" sigue teniendo sentido para producto. Si se rechaza, parametrizar el umbral en `getNivel(stock, minimo, { criticoFactor })`.
- Verificar que los tokens `--orange-*` (usados por el nivel crítico) estén mapeados en `@theme` (G0.1).
- Mantener la fórmula de `fillPct` actual para no alterar lo que ve el usuario.
