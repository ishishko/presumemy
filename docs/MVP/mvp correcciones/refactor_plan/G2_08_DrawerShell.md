# G2.8 — `components/ui/DrawerShell.vue`

| | |
|---|---|
| **Ruta** | `web/src/components/ui/DrawerShell.vue` |
| **Grupo / orden** | G2 (primitivos) · 8º (último del grupo) |
| **LOC actuales** | 151 |
| **Tipo** | migrar |
| **Dependencias** | G0 |
| **Consumidores** | **G6**: `ClienteDrawer`, `MovimientoDrawer`, `ImprentaDrawer` (por eso va antes que ellos) |

## Estado actual
Shell de panel lateral: `Teleport to body` + `Transition name="drawer"`. Scrim + panel `grid-template-rows: auto 1fr auto` (head / body scrollable / foot). Slots: `head-actions`, `body`, `foot`. Props `open/title/eyebrow/width`. Escape cierra. `<style scoped>` extenso (container, scrim, panel, head, body, foot, transición slide).

## Objetivo
Base reutilizable de drawers, estilada con Tailwind salvo la transición `drawer` (excepción C6). API de slots intacta (los 3 drawers pesados dependen de ella).

## Plan de acción paso a paso
1. **(Tailwind)** Migrar layout:
   - container `fixed inset-0 z-[80] pointer-events-none`.
   - scrim `absolute inset-0 bg-[rgba(28,26,30,.40)] pointer-events-auto`.
   - panel `absolute top-0 right-0 bottom-0 w-[520px] bg-surface border-l border-border grid grid-rows-[auto_1fr_auto] pointer-events-auto shadow-2 z-[81]` (ancho default 520, override por prop `width`).
   - head `flex items-center gap-3.5 px-[22px] py-[18px] border-b border-border`; eyebrow `text-11 uppercase tracking-[.08em] text-ink-muted font-medium`; `h3` `text-[17px] font-medium`.
   - body `flex-1 overflow-y-auto p-[22px]`.
   - foot `flex items-center gap-2.5 px-[22px] py-3.5 border-t border-border justify-end`.
2. **(C6 excepción)** Conservar `<style scoped>` SOLO para la transición `drawer` (panel `translateX(100%)` 220ms cubic-bezier + scrim fade).
3. **(Vue)** Mantener slots (`head-actions`/`body`/`foot`), `$slots.foot` condicional, Escape, prop `width` aplicada por `:style`.

## Mapeo Tailwind
| Antes (scoped) | Después |
|---|---|
| `.drawer-container` | `fixed inset-0 z-[80] pointer-events-none` |
| `.drawer-scrim` | `absolute inset-0 bg-[rgba(28,26,30,.40)] pointer-events-auto` |
| `.drawer-panel` | `absolute top-0 right-0 bottom-0 w-[520px] bg-surface border-l border-border grid grid-rows-[auto_1fr_auto] shadow-2 z-[81] pointer-events-auto` |
| `.drawer-head` | `flex items-center gap-3.5 px-[22px] py-[18px] border-b border-border` |
| `.drawer-body` | `flex-1 overflow-y-auto p-[22px]` |
| `.drawer-foot` | `flex items-center gap-2.5 px-[22px] py-3.5 border-t border-border justify-end` |
| transición `drawer` | **scoped** (excepción C6) |

## Criterios de aceptación
- `vue-tsc` ok; slots renderizan; Escape y scrim cierran.
- Slide-in idéntico; ancho override por `width` funciona.
- Los 3 drawers (aún sin migrar) siguen abriéndose bien (consumen los slots, no el estilo interno).

## Riesgos / notas
- Migrarlo **antes** que los drawers de G6 evita rehacer su layout.
- El botón cerrar usa `.icon-btn` global → al migrar, usar `BaseButton variant="ghost" icon` (G3.1, ya construido primero — rev.1).
