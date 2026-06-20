# G4.2 — `components/ui/CategoriaDeleteDialog.vue`

> **Ubicación (modular, rev.2):** destino `modules/categorias/CategoriaDeleteDialog.vue` · barrel `@/modules/categorias`. Reusa `ConfirmDialog` de `@/shared/ui`.

| | |
|---|---|
| **Ruta** | `web/src/components/ui/CategoriaDeleteDialog.vue` |
| **Grupo / orden** | G4 (medianos) · 2º |
| **LOC actuales** | 200 |
| **Tipo** | migrar |
| **Dependencias** | G0; G2.6 (`ConfirmDialog`), G3.1 (`BaseButton`), G2.5 (`FloatingSelect`) |
| **Consumidores** | `InsumosView`, `ProductosView` (al borrar categoría con elementos) |

## Estado actual
Diálogo de borrado de categoría con 3 casos: (1) sin asociados → confirmación simple; (2) con asociados y hay alternativas → select de reasignación; (3) con asociados sin alternativas → bloqueado. Emits `confirm(reasignarA?)`/`cancel`. **Duplica casi literal** el `<style scoped>` de `ConfirmDialog` (mask/dialog/transición `confirm`) + clases globales `.field`/`.select`/`.btn`. Lógica de casos en computeds (`count`, `otrasCategorias`, `canConfirm`).

## Objetivo (DRY/OCP)
Eliminar la duplicación del chrome de diálogo reutilizando `ConfirmDialog` como contenedor (extendido con slot), y migrar el cuerpo a Tailwind + componentes base. La lógica de 3 casos se mantiene.

## Plan de acción paso a paso
1. **(OCP/DRY)** Refactor recomendado: dar a `ConfirmDialog` (G2.6) un **slot default opcional** para el cuerpo (hoy solo acepta `message` string). Así `CategoriaDeleteDialog` reusa mask/dialog/transición/acciones de `ConfirmDialog` y solo aporta su cuerpo de 3 casos. Esto **abre** `ConfirmDialog` a extensión sin modificar su API existente (el `message` sigue funcionando).
   - *Alternativa más simple* si tocar `ConfirmDialog` es riesgoso por el test: migrar el scoped propio a Tailwind igual que G2.6 (mask/dialog idénticos) y dejarlo standalone. Decidir al implementar; preferir la reutilización si el test de `ConfirmDialog` lo permite.
2. **(Tailwind)** Cuerpo: `dialog-body` → `flex flex-col gap-2.5`; `warning-text` → `text-coral-700 font-medium`; `block-msg` → `px-3 py-2 bg-coral-50 rounded-sm border border-border`.
3. **(reuso)** Select de reasignación → `FloatingSelect` (G2.5) o select Tailwind; botones → `BaseButton variant="secondary"`/`"danger"` con `:disabled="!canConfirm"`.
4. **(Vue)** Conservar computeds (`count`, `otrasCategorias`, `canConfirm`), `watch(open)` que resetea `reasignarA`, Escape.

## Antes → Después
- **Antes:** diálogo autónomo con su propio mask/dialog/transición (copiado de ConfirmDialog).
- **Después:** `<ConfirmDialog :open variant="danger" @confirm @cancel>` + slot con el cuerpo de 3 casos.

## Criterios de aceptación
- `vue-tsc` ok; los 3 casos funcionan (simple / reasignación / bloqueado), `canConfirm` gobierna el botón.
- Sin duplicación del chrome de diálogo (si se eligió la vía de reutilización).
- El test de `ConfirmDialog` sigue verde (si se le agregó el slot, que sea retro-compatible).

## Riesgos / notas
- Tocar `ConfirmDialog` puede afectar su test → el slot debe ser **aditivo** (cuando no hay slot, usa `message`). Verificar el spec.
- Mantener el texto y la lógica de pluralización ("elemento/elementos asociados").
