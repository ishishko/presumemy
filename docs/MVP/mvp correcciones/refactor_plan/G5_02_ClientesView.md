# G5.2 — `views/ClientesView.vue`

| | |
|---|---|
| **Ruta** | `web/src/views/ClientesView.vue` |
| **Grupo / orden** | G5 (vistas) · 2º |
| **LOC actuales** | 216 |
| **Tipo** | migrar |
| **Dependencias** | G1.1, G1.3 (store `del`), G3.5 (`DataTable`), G3.7 (`RowActions`), nuevo `Avatar` |
| **Consumidores** | ruta `/clientes` |

## Estado actual
Tabla de clientes con avatar determinístico (paleta por hash del nombre), contacto principal (canal+valor con dot de color), código, pedidos, total facturado. Drawer de edición + ConfirmDialog de borrado. Smells:
- `import { del } from '@/services/api'` + `handleDeleteConfirm` llama `del` y `store.remove` (**DIP**).
- `money()` local.
- **Lógica de avatar inline** (`avatarPalette`, `getAvatarPalette`, `getInitials`) con colores `var()` crudos → candidata a componente `Avatar`.
- `canalColors`/`canalLabels` con hex crudos.
- `<style scoped>` `.row-action*` (idéntico a Insumos/Productos/Presupuestos → `RowActions`).
- Clases globales `.data-table`, `.clientes-*`, `.table-wrap`.

## Objetivo
Vista orquestadora delgada: `DataTable` + `Avatar` + `RowActions`, sin `services/api`, sin `money()` local, sin scoped.

## Plan de acción paso a paso
1. **(DIP)** Quitar `import { del }`; `handleDeleteConfirm` → `await store.remove(c.id)` (store ya absorbe el `del`, G1.3).
2. **(SRP/DRY)** Extraer `components/ui/Avatar.vue` (props `name` → calcula iniciales + paleta determinística). Mover `avatarPalette/getAvatarPalette/getInitials` ahí. **Reutilizable** (el sidebar también pinta un avatar). Paleta con tokens, no hex crudos.
3. **(reuso)** Tabla → `DataTable` (slot `row`); acciones → `RowActions`; `money` → `formatMoney`.
4. **(Tailwind)** `.clientes-name-cell/.clientes-avatar/.clientes-code/.canal-*` → utilidades. Dots de canal: mapa `canal → clase` (no hex inline) — definir tokens si faltan colores de canal, o usar los existentes.
5. **(limpieza)** Quitar inline styles de celdas (`style="width:..."` → columnas de `DataTable`).

## Componentes que crea/consume
Crea `Avatar.vue`. Consume `DataTable`, `RowActions`, `formatMoney`.

## Criterios de aceptación
- `vue-tsc` ok; avatar (color por nombre), contacto principal, totales idénticos.
- Sin `services/api` en la vista; borrado funciona.
- `<style scoped>` eliminado (vía `RowActions`).

## Riesgos / notas
- Avatar determinístico: conservar el mismo hash para que los colores no cambien respecto al actual.
- Columna "Último pedido" hoy muestra `—` (placeholder); mantener.
