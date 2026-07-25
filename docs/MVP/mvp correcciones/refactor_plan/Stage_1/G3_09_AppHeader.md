# G3.9 — `app/shell/AppHeader.vue`

> **Ubicación (modular, rev.2):** destino `app/shell/AppHeader.vue` (topbar del shell).

| | |
|---|---|
| **Ruta destino** | `web/src/app/shell/AppHeader.vue` |
| **Grupo / orden** | G3 (base + shell) · 9º |
| **LOC actuales** | 79 |
| **Tipo** | migrar |
| **Dependencias** | G0; G3.1 (`BaseButton`); G3.14 (`modules/search` si se cablea el input) |
| **Consumidores** | `app/App.vue` |

## Estado actual
Topbar 56px con: título de página, modo editor (título + guardar + cerrar), `#editor-header-status` (destino Teleport del badge de estado del editor), botón crear (`+`), search input, campana. Clases globales `.app-header`, `.icon-btn`, `.btn .btn-primary .btn-icon`, `.search`. `<style scoped>` para `.editor-mode-title` y `.header-status-slot:empty`. **Smells:** `:style` inline en el botón guardar (líneas 29-31, opacidad/cursor según `editorDirty`); el `<input>` de búsqueda **no tiene binding** (placeholder estático, no funcional).

## Objetivo
Topbar 100% Tailwind, botones via `BaseButton`, sin `:style` inline. Resolver el estado del input de búsqueda.

## Plan de acción paso a paso
1. **(Tailwind/C1)** `.app-header` → `h-14 sticky top-0 z-10 flex items-center gap-4 px-8 bg-surface/80 backdrop-blur-sm border-b border-border`.
2. **(reuso/G3.1)** Botón crear y los `icon-btn` (guardar/cerrar/campana) → `BaseButton variant="ghost" icon` / `variant="primary" icon`.
3. **(Tailwind)** Quitar `:style` inline del guardar → usar `:disabled="!editorDirty"` + `disabled:opacity-40 disabled:cursor-not-allowed` (que ya cubre `BaseButton`).
4. **(C6)** `#editor-header-status` con `:empty { display:none }` → se conserva como `<style scoped>` mínimo (selector `:empty` no existe en Tailwind) o `class="empty:hidden"` si la variante `empty:` está disponible en v4. Verificar; si no, scoped mínimo.
5. **(decisión abierta)** **Search input:** existe `useGlobalSearch` (Epic D, debounce 300ms + dropdown) que en la arquitectura modular pasa a `modules/search/` (**G3.14**). Decidir — (a) cablear el input a `useGlobalSearch` del barrel `@/modules/search` o (b) solo migrar estilos. Por defecto: **solo migrar estilos**, no cambiar funcionalidad en este refactor (YAGNI). Si ya estaba cableado en código y el inventario lo reportó "sin binding", reconciliar al implementar. **(C15) Import permitido `app → module`:** si se cablea, `AppHeader` importa `{ useGlobalSearch, type SearchResult } from '@/modules/search'` — único caso del shell que importa un módulo; el enforcement (G7.2) lo trata como excepción esperada, no como import lateral.

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
- **(C11, rev.1; ubicación rev.2) Contrato del Teleport:** el id del slot se define como constante compartida `EDITOR_STATUS_SLOT_ID = 'editor-header-status'` **en `shared/lib`** (junto a `editorMode.ts`), importada por `AppHeader` (`app/shell`) y por `PresupuestoEditor` (G6.6, módulo). No se define en `AppHeader`: como la importa un módulo y `modules` no puede importar `app`, debe vivir en `shared/lib`. El `<div :id="EDITOR_STATUS_SLOT_ID">` debe seguir existiendo en el header; `PresupuestoEditor` teletransporta ahí su badge.
- Registrar la decisión sobre el search (cuestión abierta del plan maestro).
