# G3.4 — `components/ui/BaseKpi.vue` (nuevo)

| | |
|---|---|
| **Ruta** | `web/src/components/ui/BaseKpi.vue` |
| **Grupo / orden** | G3 (base + shell) · 4º |
| **LOC actuales** | 0 (nuevo) |
| **Tipo** | crear |
| **Dependencias** | G0; G3.3 (`BaseCard`) opcional como base |
| **Consumidores** | `DashboardView` (G5.1), `FinanzasView` (G5.6) |

## Estado actual
No existe. Clase global `.kpi` (`components.css` ~408-439). `DashboardView` arma KPIs con `<div class="kpi" style="margin-top:6px">` y markup repetido (label, valor grande tabular, delta).

## Objetivo (DRY/SRP)
Tarjeta KPI reutilizable: label (eyebrow), valor (número tabular grande), delta/sub opcional. Usada por Dashboard y Finanzas con la misma estructura.

## Plan de acción paso a paso
1. **(ISP)** Props: `label: string`, `value: string` (ya formateado con `formatMoney`), `sub?: string`, `tone?: 'ok'|'danger'|'neutral'` (para delta).
2. **(Tailwind)** Sobre `BaseCard`: label `text-12 uppercase tracking-[.06em] text-ink-muted`; value `text-28 font-medium text-ink num` (tabular-nums); sub `text-12` con color por tone.
3. **(DIP)** No recibe objetos de dominio crudos: la vista formatea y pasa strings (ISP). El número ya viene de `formatMoney`.

## Antes → Después
```vue
<BaseKpi label="Ingresos del mes" :value="formatMoney(kpis.ingresos)" :sub="`+${kpis.deltaPct}%`" tone="ok" />
```

## Criterios de aceptación
- `vue-tsc` ok; KPIs idénticos al prototipo (número tabular grande, eyebrow, delta coloreado).

## Riesgos / notas
- Confirmar la estructura real de KPI al leer `DashboardView`/`FinanzasView` (G5); ajustar props si hay iconos o gráficos sparkline embebidos (en ese caso, slot).
- No mezclar el gráfico semanal del dashboard aquí (es otra responsabilidad → su propio componente al migrar G5.1).
