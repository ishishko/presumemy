# G3.9 — `components/layout/AppHeader.vue`

> **Ubicación (modular, rev.2):** shell de app → `app/shell/AppHeader.vue`. La constante `EDITOR_STATUS_SLOT_ID` (C11) vive en `app/state`.

| | |
|---|---|
| **Ruta** | `web/src/components/layout/AppHeader.vue` |
| **Grupo / orden** | G3 (base + shell) · 9º |
| **LOC actuales** | 79 |
| **Tipo** | migrar |
| **Dependencias** | G0; G3.1 (`BaseButton`) |
| **Consumidores** | `App.vue` |

## Estado actual
Topbar 56px con: título de página, modo editor (título + guardar + cerrar), `#editor-header-status` (destino Teleport del badge de estado del editor), botón crear (`+`), search input, campana. Clases globales `.app-header`, `.icon-btn`, `.btn .btn-primary .btn-icon`, `.search`. `<style scoped>` para `.editor-mode-title` y `.header-status-slot:empty`. **Smells:** `:style` inline en el botón guardar (líneas 29-31, opacidad/cursor según `editorDirty`); el `<input>` de búsqueda **no tiene binding** (placeholder estático, no funcional).

## Objetivo
Topbar 100% Tailwind, botones via `BaseButton`, sin `:style` inline. Resolver el estado del input de búsqueda.

## Plan de acción paso a paso
1. **(Tailwind/C1)** `.app-header` → `h-14 sticky top-0 z-10 flex items-center gap-4 px-8 bg-surface/80 backdrop-blur-sm border-b border-border`.
2. **(reuso/G3.1)** Botón crear y los `icon-btn` (guardar/cerrar/campana) → `BaseButton variant="ghost" icon` / `variant="primary" icon`.
3. **(Tailwind)** Quitar `:style` inline del guardar → usar `:disabled="!editorDirty"` + `disabled:opacity-40 disabled:cursor-not-allowed` (que ya cubre `BaseButton`).
4. **(C6)** `#editor-header-status` con `:empty { display:none }` → se conserva como `<style scoped>` mínimo (selector `:empty` no existe en Tailwind) o `class="empty:hidden"` si la variante `empty:` está disponible en v4. Verificar; si no, scoped mínimo.
5. **(decisión abierta)** **Search input:** decidir — (a) cablearlo al search existente (memoria menciona composable de búsqueda con debounce) o (b) dejarlo fuera de alcance y solo migrar estilos. Anotar la decisión aquí al implementar. Por defecto: **solo migrar estilos**, no cambiar funcionalidad en este refactor (YAGNI respecto al objetivo del refactor).

## Mapeo Tailwind
| Antes | Después |
|---|---|
| `.app-header` | `h-14 sticky top-0 z-10 flex items-center gap-4 px-8 bg-surface/80 backdrop-blur-sm border-b border-border` |
| `.icon-btn` | `BaseButton variant="ghost" icon` |
| `.btn .btn-primary .btn-icon` | `BaseButton variant="primary" icon` |
| `.search` | `flex items-center gap-2 bg-page-bg rounded-md px-3 h-9 ...` |
| `:style` guardar | `disabled:opacity-40 disabled:cursor-not-allowed` |
| `.editor-mode-title` | `text-[18px] font-semibold text-violet-700 tracking-[-.01em]` |
| `.header-status-slot:empty` | scoped mínimo o `empty:hidden` |

## Criterios de aceptación
- `vue-tsc` ok; modo editor (guardar/cerrar/Teleport del badge) funciona igual.
- Backdrop blur y altura 56px idénticos; sin `:style` inline.

## Riesgos / notas
- **(C11, rev.1) Contrato del Teleport:** el id del slot se define como constante compartida `EDITOR_STATUS_SLOT_ID = 'editor-header-status'` (importada por `AppHeader` y por `PresupuestoEditor` G6.6), para que el acoplamiento sea explícito y refactor-safe. El `<div :id="EDITOR_STATUS_SLOT_ID">` debe seguir existiendo en el header; `PresupuestoEditor` teletransporta ahí su badge.
- Registrar la decisión sobre el search (cuestión abierta del plan maestro).
