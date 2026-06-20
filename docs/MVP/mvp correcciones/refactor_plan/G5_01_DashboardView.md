# G5.1 — `views/DashboardView.vue`

> **Ubicación (modular, rev.2):** destino `modules/dashboard/DashboardPage.vue` (+ `components/WeeklyChart.vue`, `stats-api.ts`). Consume otros módulos por barrel (`@/modules/insumos`, etc.).

| | |
|---|---|
| **Ruta** | `web/src/views/DashboardView.vue` |
| **Grupo / orden** | G5 (vistas) · 1º |
| **LOC actuales** | 207 |
| **Tipo** | migrar |
| **Dependencias** | G1.1 (`formatMoney`), G3.3/3.4 (`BaseCard`/`BaseKpi`), G3.2 (`StatusBadge`), G3.6 (`StockBar`) |
| **Consumidores** | ruta `/dashboard` |

## Estado actual
KPIs (ingresos/por cobrar/insumos bajos), tabla de presupuestos recientes, lista de insumos bajos, y **gráfico de barras semanal con datos HARDCODEADOS** (`chartData = [3200, ...]`, `Mayo 2026`). Smells:
- `money()` + `moneyShort()` locales.
- `statusTones` duplicado (también en `PresupuestosView`).
- **Inline styles por todos lados** (`style="margin-bottom:16px"`, colores `var(--violet-700)`, el chart entero inline).
- Stock bar inline duplicada (líneas 171-173) con su propia lógica de nivel (`stock < min*0.5 ? 'low':'warn'`).
- Clases globales `.card`, `.grid-2/3`, `.eyebrow`, `.kpi`, `.badge`, `.data-table`, `.stock-bar`.
- Hace `preloadStores()` (precarga de otros stores) — lógica de orquestación aceptable, se mantiene.

## Objetivo
Dashboard compuesto por `BaseKpi`/`BaseCard`/`StatusBadge`/`StockBar`, sin inline styles, sin `money()` local, sin `statusTones` duplicado. El gráfico semanal se extrae a un componente propio.

## Plan de acción paso a paso
1. **(DRY)** `money`/`moneyShort` → `formatMoney` (con variante compacta `moneyShort` quizá a `utils/format`).
2. **(SRP)** Extraer el gráfico a `components/dashboard/WeeklyChart.vue` (presentacional; recibe `data`). **Nota:** los datos están hardcodeados — anotar como deuda (debería venir del store/stats); no se inventa backend aquí, pero se aísla.
3. **(reuso)** KPIs → `BaseKpi`; bloques → `BaseCard`; badges de estado → `StatusBadge` con el **mapa de estados FSM** (compartir con `PresupuestosView`, ver G5.5 — extraer `statusTones` a un módulo común `utils/presupuestoEstado.ts`).
4. **(reuso)** Lista de insumos bajos: usar `StockBar` (G3.6) en vez de la barra inline.
5. **(Tailwind)** Eliminar todos los `style="..."` inline → utilidades. `.grid-2/3` → `grid grid-cols-2/3 gap-4`.
6. **(DIP)** No usa `services/api` directo (usa stores) — OK.

## Componentes que crea/consume
Crea `WeeklyChart.vue`. Consume `BaseKpi`, `BaseCard`, `StatusBadge`, `StockBar`, `formatMoney`, módulo común de estados.

## Criterios de aceptación
- `vue-tsc` ok; KPIs, recientes, insumos bajos y gráfico idénticos.
- Sin inline styles; sin `money()`/`statusTones` local.

## Riesgos / notas
- **Deuda visible:** `chartData` y "Mayo 2026" están hardcodeados. Aislar en `WeeklyChart` y dejar TODO para alimentarlo del backend (fuera de alcance del refactor de estilos).
- El módulo común de estados (tone+label+transiciones FSM) se comparte con G5.5; definirlo una vez.
