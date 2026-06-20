# G3.11 — `components/ui/FilterChips.vue` (nuevo)

> **rev.1:** promovido a primitivo con doc propio. Antes "nacía dentro de `ProductosView`" y lo consumían Insumos/Finanzas sin dueño claro.

| | |
|---|---|
| **Ruta** | `web/src/components/ui/FilterChips.vue` |
| **Grupo / orden** | G3 (base + shell) · 11º |
| **LOC actuales** | 0 (nuevo) |
| **Tipo** | crear |
| **Dependencias** | G0 |
| **Consumidores** | `InsumosView` (G5.4), `ProductosView` (G5.3), `FinanzasView` (G5.6, filtros tipo/cuenta) |

## Estado actual
No existe. El patrón de chips de filtro está **triplicado** con clases globales distintas:
- `InsumosView`/`ProductosView`: `.insumos-state-pill` (+ `.active`, dot, contador `.k`).
- `FinanzasView`: `.fin-pill` (filtros de tipo y cuenta, con dot de color).

Cada vista repite el `v-for` de botones + estado activo + dot + contador.

## Objetivo (DRY/ISP/OCP)
Un primitivo presentacional de chips de filtro, reutilizable, con v-model del valor activo. La vista solo pasa los chips.

## Plan de acción paso a paso
1. **(ISP/API)** Props: `chips: { id: string|number; label: string; count?: number; dotTone?: Tone }[]`, v-model del id activo. Emite el cambio. Sin lógica de dominio.
2. **(OCP/C3)** Estado activo/inactivo por mapa de clases; el `dotTone` (si existe) se traduce a clase Tailwind por mapa (no hex crudo — hoy Finanzas usa `#2E6F70`/`#EA5F3C`).
3. **(Tailwind)** Base del chip: `inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-13 font-medium transition-colors`; activo `bg-violet-700 text-white` / inactivo `bg-violet-50 text-violet-700` (ajustar al prototipo de cada uso — unificar el estilo de pill).
4. **(comportamiento)** Soportar el toggle "click en activo → deselecciona" que usa `ProductosView` (vía prop `deselectable?` o que la vista maneje el valor). Mantener contador opcional.

## Antes → Después
```vue
<FilterChips v-model="stateFilter" :chips="stateChips" />
```
donde `stateChips = [{ id:'todos', label:'Todos', count: n }, { id:'critico', label:'Crítico', count, dotTone:'danger' }, …]`.

## Reemplaza
`.insumos-state-pill` / `.fin-pill` + el `v-for` repetido en 3 vistas.

## Criterios de aceptación
- `vue-tsc` ok (chips tipados).
- Chips activos/contadores/dots idénticos a los actuales en Insumos, Productos y Finanzas.
- Sin hex crudos para los dots (tono semántico).

## Riesgos / notas
- **Diseñar la API contra los 3 casos reales** antes de propagar; Finanzas tiene dos filas de chips (tipo y cuenta) y dots de color — confirmar que el mismo componente sirve a ambas.
- El toggle-deselect de Productos vs selección simple de Insumos: resolver con una prop, no con dos componentes.
- Coordinar con `G5_04` (piloto) para fijar la API antes de Productos/Finanzas.
