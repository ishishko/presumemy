# G2.6 — `shared/ui/ConfirmDialog.vue`

> **Ubicación (modular, rev.2):** destino `shared/ui/ConfirmDialog.vue` · import `@/shared/ui`.

| | |
|---|---|
| **Ruta destino** | `web/src/shared/ui/ConfirmDialog.vue` |
| **Grupo / orden** | G2 (primitivos) · 6º |
| **LOC actuales** | 102 |
| **Tipo** | migrar |
| **Dependencias** | G0; idealmente G3.1 (`BaseButton`) para los botones |
| **Consumidores** | `InsumosPage`, `ProductosPage`, `ClientesPage`, etc. (confirmaciones de borrado) |
| **⚠️ Tiene test** | `shared/ui/__tests__/` → **no cambiar API/props** |

## Estado actual
`Teleport to body` + `Transition name="confirm"`. Props `open/title/message/confirmLabel/cancelLabel/variant`. Emits `confirm/cancel`. Escape cierra. Botones con clases globales `.btn .btn-secondary` / `.btn .btn-danger|.btn-primary`. Estilos en `<style scoped>` (mask, dialog, actions, transición).

## Objetivo
Mismo comportamiento y **misma API** (los tests dependen de ella). Migrar el scoped a Tailwind salvo la transición `confirm` (excepción C6); botones vía `BaseButton`.

## Plan de acción paso a paso
1. **(API)** No tocar props ni emits (test los usa). Conservar `Teleport`, Escape, click en mask = cancel, `@click.stop` en el dialog.
2. **(Tailwind)** Migrar scoped:
   - `.confirm-mask` → `fixed inset-0 grid place-items-center z-[90] bg-[rgba(28,26,30,.30)]`.
   - `.confirm-dialog` → `bg-surface rounded-lg p-[22px] w-[380px] shadow-2 border border-border flex flex-col gap-3.5`.
   - `h4`/`p` → `text-ink`/`text-13 text-ink-muted`.
   - `.confirm-actions` → `flex gap-2 justify-end`.
3. **(C6 excepción)** Conservar `<style scoped>` SOLO para la transición `confirm-enter/leave` (opacity 140ms).
4. **(reuso/G3.1)** Reemplazar botones por `<BaseButton variant="secondary">` / `<BaseButton :variant="variant==='danger'?'danger':'primary'">`. Mantener labels por defecto ('Cancelar'/'Confirmar').

## Antes → Después
```vue
<div class="fixed inset-0 grid place-items-center z-[90] bg-[rgba(28,26,30,.30)]" @click="emit('cancel')">
  <div class="bg-surface rounded-lg p-[22px] w-[380px] shadow-2 border border-border flex flex-col gap-3.5" @click.stop>
    <h4 class="text-ink text-[17px] font-medium">{{ title }}</h4>
    <p class="text-13 text-ink-muted leading-snug">{{ message }}</p>
    <div class="flex gap-2 justify-end"> … BaseButton … </div>
  </div>
</div>
```

## Mapeo Tailwind
| Antes (scoped) | Después |
|---|---|
| `.confirm-mask` | `fixed inset-0 grid place-items-center z-[90] bg-[rgba(28,26,30,.30)]` |
| `.confirm-dialog` | `bg-surface rounded-lg p-[22px] w-[380px] shadow-2 border border-border flex flex-col gap-3.5` |
| `.confirm-actions` | `flex gap-2 justify-end` |
| transición `confirm` | **scoped** (excepción C6) |

## Criterios de aceptación
- **El test existente sigue verde** (no cambió API).
- `vue-tsc` ok; Escape y click-fuera cierran; visual idéntico.

## Riesgos / notas
- Riesgo principal: romper el test al alterar estructura/props. Revisar el spec antes de tocar el template.
- **(rev.1)** `BaseButton` (G3.1) se construye **primero** en el orden corregido, así que ya está disponible aquí — usarlo directamente para los botones (sin clases temporales).
