# G3.6 — `components/ui/StockBar.vue` (nuevo)

| | |
|---|---|
| **Ruta** | `web/src/components/ui/StockBar.vue` |
| **Grupo / orden** | G3 (base + shell) · 6º |
| **LOC actuales** | 0 (nuevo) |
| **Tipo** | crear |
| **Dependencias** | G0; G1.2 (`utils/stock.ts`) |
| **Consumidores** | `InsumosView` (G5.4), `InsumoDetalle` (G6.5) |

## Estado actual
No existe. `InsumosView` (líneas 259-263) arma la barra inline:
```vue
<div :class="['stock-bar', nivelMeta[getNivel(i)].barClass]">
  <div :style="{ width: Math.min(100, (stock/max(min,1))*100)+'%' }"></div>
</div>
```
Clase global `.stock-bar` + `.low/.warn/.ok` (`components.css` ~994-1019). El cálculo del % y la clase de color están en la vista.

## Objetivo (SRP/ISP)
Componente que recibe **solo** `{ stock, minimo }` (ISP), calcula el % y el color internamente (vía `useStockLevel`), y renderiza la barra. Saca ese cálculo de la vista.

## Plan de acción paso a paso
1. **(ISP)** Props: `stock: number`, `minimo: number`. Nada más.
2. **(SRP/DIP)** `const nivel = computed(() => getNivel(stock, minimo))` (de G1.2). `const pct = computed(() => Math.min(100, (stock / Math.max(minimo,1)) * 100))`.
3. **(OCP/C3 + C8)** Mapa `nivel → color de relleno` (4 niveles canónicos): `{ sin_unidades:'bg-coral-700', critico:'bg-coral-500', bajo:'bg-yellow', ok:'bg-teal-500' }`. `getNivel` y los niveles vienen de `utils/stock.ts` (G1.2).
4. **(Tailwind)** Track `h-1.5 w-full rounded-pill bg-page-bg overflow-hidden`; relleno `h-full rounded-pill` + color + `:style="{ width: pct+'%' }"`.

## Antes → Después
```vue
<StockBar :stock="Number(i.stock)" :minimo="Number(i.stockMinimo)" />
```

## Reemplaza
`.stock-bar`/`.low`/`.warn`/`.ok` + el cálculo inline de `InsumosView`.

## Criterios de aceptación
- `vue-tsc` ok; ancho y color de relleno coinciden con el comportamiento actual por nivel.
- Bordes: `stock=0`, `stock>min`, `min=0` no rompen (clamp a 100%, `max(min,1)`).

## Riesgos / notas
- Confirmar altura/colores reales de `.stock-bar` en `components.css`.
- El % de relleno usa la misma fórmula actual; no cambiarla para no alterar lo que ve el usuario.
