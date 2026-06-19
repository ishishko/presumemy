# G3.5 — `components/ui/DataTable.vue` (nuevo)

| | |
|---|---|
| **Ruta** | `web/src/components/ui/DataTable.vue` |
| **Grupo / orden** | G3 (base + shell) · 5º |
| **LOC actuales** | 0 (nuevo) |
| **Tipo** | crear |
| **Dependencias** | G0 |
| **Consumidores** | `InsumosView`, `ProductosView`, `ClientesView`, `PresupuestosView`, `FinanzasView` |

## Estado actual
No existe. Cada vista repite `<table class="data-table …">` con `thead`/`tbody` y estilos globales `.data-table`/`.table-wrap` (`components.css` ~752-827). Reglas DS: headers uppercase 11px `ink-muted` `tracking .06em`; celdas 13px; hover de fila `page-bg`; números `tabular-nums`.

## Objetivo (DRY/ISP)
Tabla presentacional reutilizable basada en **slots** (no en objetos de dominio): la vista define columnas y el render de cada fila; la tabla aporta el chrome (wrap, header styling, hover, empty state). El componente no sabe qué es un `Insumo` (ISP).

## Plan de acción paso a paso
1. **(ISP/diseño de API)** Dos enfoques posibles; elegir según ergonomía al migrar Insumos (piloto):
   - **A (slots, recomendado):** prop `columns: { key; label; align?; width? }[]`; slot `row` (scoped por item) y slot `empty`. La vista pasa los datos y pinta cada celda.
   - **B (headless):** solo provee wrapper + clases via slots `head`/`body`. Más flexible, menos guía.
   Recomendado **A**; mantenerla mínima (YAGNI: sin sort/paginación hasta que se pidan).
2. **(Tailwind)** `table-wrap` → `overflow-x-auto`; `table` → `w-full border-collapse`; `th` → `text-left text-11 uppercase tracking-[.06em] text-ink-muted font-medium px-3 py-2 border-b border-border`; `td` → `text-13 px-3 py-2 border-b border-border`; fila hover → `hover:bg-page-bg`. Alineación num via columna `align:'right'` + `num` (tabular).
3. **(slots)** `row` scoped: `<slot name="row" :item="item" :index="i" />`. `empty`: mensaje centrado (`colspan`).

## Antes → Después
```vue
<DataTable :columns="cols" :rows="filtered">
  <template #row="{ item }">
    <td class="font-medium">{{ item.nombre }}</td>
    <td class="text-ink-muted">{{ item.categoria?.nombre }}</td>
    …
  </template>
  <template #empty>Sin resultados con los filtros actuales.</template>
</DataTable>
```

## Reemplaza
`.data-table`, `.table-wrap` globales y los `<th>`/celdas con estilos inline de las vistas.

## Criterios de aceptación
- `vue-tsc` ok (columns tipadas).
- Header uppercase, hover de fila, números tabulares, empty state: idénticos al prototipo.
- Funciona en el piloto (Insumos) antes de propagar.

## Riesgos / notas
- **Diseñar la API contra el caso real de Insumos primero** (que tiene celdas complejas: stock bar, badge, row-actions). Si los slots por columna no alcanzan, usar el slot `row` completo. No sobre-diseñar.
- Acciones de fila (editar/borrar) van por `RowActions` (G3.7) dentro del slot.
