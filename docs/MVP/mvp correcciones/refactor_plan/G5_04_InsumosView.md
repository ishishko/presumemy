# G5.4 — `views/InsumosView.vue` (PILOTO)

| | |
|---|---|
| **Ruta** | `web/src/views/InsumosView.vue` |
| **Grupo / orden** | G5 (vistas) · 4º — **piloto del enfoque end-to-end** |
| **LOC actuales** | 337 |
| **Tipo** | migrar |
| **Dependencias** | G1.1 (`formatMoney`), G1.2 (`useStockLevel`), G1.3 (store `del`), G3.5 (`DataTable`), G3.6 (`StockBar`), G3.2 (`StatusBadge`), G3.7 (`RowActions`), nuevo `FilterChips` (de G5.3), G4.1/4.2 (categorías) |
| **Consumidores** | ruta `/insumos` |

## Estado actual (la "God view" testigo)
Hace: fetch, CRUD de insumos + de categorías, filtros (estado + categoría), cálculo de nivel de stock (`getNivel`/`counts`/`nivelMeta`), formato moneda, y una tabla densa con badge/stock-bar/row-actions inline. Smells concretos:
- `import { del } from '@/services/api'` (líneas 5, 108) → **DIP**.
- `getNivel`/`nivelMeta`/`Nivel` (34-73) → regla de negocio en la vista.
- `money()` (58-60) → duplicado.
- Stock bar + badge inline con colores crudos (240-271).
- `<style scoped>` `.row-action*` (idéntico a otras 3 vistas).
- Chips `.insumos-state-pill` (mismos que Productos).

## Objetivo
**Orquestador delgado**: estado de filtros + handlers que delegan al store; toda la presentación en componentes y toda la regla en composables/utils. Es la validación end-to-end de G0–G4 antes de propagar.

## Plan de acción paso a paso
1. **(DIP)** Quitar `import { del }`; `handleDeleteConfirm` → `await store.remove(i.id)`.
2. **(SRP)** Borrar `getNivel`/`nivelMeta`/`Nivel` locales → importar de `useStockLevel` (G1.2). `counts` se recalcula con `getNivel(stock, min)`.
3. **(DRY)** `money` → `formatMoney`.
4. **(reuso)** Tabla → `DataTable` (slot `row`): celdas usan `StockBar` (`:stock :minimo`), `StatusBadge` (`:tone="NIVEL_META[nivel].tone"`), `RowActions` (`@edit @delete`).
5. **(DRY)** Chips de estado → `FilterChips` (compartido con Productos).
6. **(Tailwind)** Eliminar todos los inline `style="..."` y `<style scoped>`.
7. **(categorías)** `CategoriaPills` + `CategoriaDeleteDialog` ya migrados; el `CategoriaDeleteDialog` reemplaza el `ConfirmDialog` de categoría actual (hoy usa un `ConfirmDialog` con mensaje condicional — homogeneizar con Productos que ya usa `CategoriaDeleteDialog`).

## Antes → Después (esqueleto del template)
```vue
<FilterChips v-model="stateFilter" :chips="stateChips" />
<CategoriaPills v-model="catFilter" variant="insumos" :categorias="store.categorias" @create @rename @remove />
<DataTable :columns="cols" :rows="filtered">
  <template #row="{ item }">
    <td>… nombre/código …</td>
    <td><StockBar :stock="Number(item.stock)" :minimo="Number(item.stockMinimo)" /></td>
    <td><StatusBadge :label="NIVEL_META[getNivel(...)].label" :tone="NIVEL_META[...].tone" /></td>
    <td><RowActions @edit="handleEdit(item)" @delete="handleDeleteClick(item)" /></td>
  </template>
  <template #empty>Sin resultados con los filtros actuales.</template>
</DataTable>
```

## Criterios de aceptación
- `vue-tsc` ok; filtros, niveles, stock bar, badges, doble-click editar, CRUD insumos y categorías idénticos.
- Vista sin `services/api`, sin `<style scoped>`, sin reglas de negocio embebidas.
- **Test:** `getNivel`/`formatMoney` cubiertos por sus unit tests (G1).

## Riesgos / notas
- **Es el piloto:** si la API de `DataTable`/`FilterChips` no resulta ergonómica aquí, ajustarla **antes** de propagar a las demás vistas. No avanzar a G5.5+ hasta validar Insumos visualmente.
- Homogeneizar el borrado de categoría con `CategoriaDeleteDialog` (hoy Insumos usa `ConfirmDialog`; Productos ya usa el dialog dedicado).
