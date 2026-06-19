# G3.7 — `components/ui/RowActions.vue` (nuevo)

| | |
|---|---|
| **Ruta** | `web/src/components/ui/RowActions.vue` |
| **Grupo / orden** | G3 (base + shell) · 7º |
| **LOC actuales** | 0 (nuevo) |
| **Tipo** | crear |
| **Dependencias** | G0 |
| **Consumidores** | `InsumosView`, `ProductosView`, `ClientesView`, `FinanzasView` (acciones de fila en tablas) |

## Estado actual
No existe. `InsumosView` lo tiene como `<style scoped>` propio (líneas 273-280 + 326-350): `.row-actions`, `.row-action-btn`, `.row-action-danger` (editar/eliminar con hover). El mismo patrón se repite en otras tablas.

## Objetivo (DRY/SRP)
Componente de acciones de fila editar/eliminar, presentacional, que emite eventos. Saca el `<style scoped>` repetido de las vistas.

## Plan de acción paso a paso
1. **(ISP/API)** Emits `edit` y `delete`. Props opcionales para títulos (`editLabel?`, `deleteLabel?`). Iconos `Pencil`/`Trash2` de lucide.
2. **(Tailwind)** Contenedor `flex gap-1 justify-end`. Botón base `p-1.5 rounded-sm grid place-items-center text-ink-muted transition-colors`; hover editar `hover:bg-page-bg hover:text-ink`; hover eliminar `hover:bg-coral-50 hover:text-coral-500`.
3. **(reuso)** Internamente puede usar `BaseButton variant="ghost" icon` o botones simples; mantener el hover diferenciado del borrar.

## Antes → Después
```vue
<!-- En el slot row de DataTable -->
<RowActions @edit="handleEdit(item)" @delete="handleDeleteClick(item)" />
```

## Reemplaza
El `<style scoped>` de `.row-action*` en `InsumosView` (y equivalentes en otras vistas).

## Criterios de aceptación
- `vue-tsc` ok; hover de editar (neutro) y eliminar (coral) idénticos al actual.
- Tooltips (`title`) presentes.

## Riesgos / notas
- Mantener el ícono a 14px (UI densa, según DS).
- Si alguna tabla tiene más acciones (ej. duplicar), usar slot extra en vez de inflar props (YAGNI/OCP).
