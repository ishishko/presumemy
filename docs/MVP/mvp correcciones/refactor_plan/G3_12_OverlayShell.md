# G3.12 — `components/ui/OverlayShell.vue` (nuevo)

> **Ubicación (modular, rev.2):** destino `shared/ui/OverlayShell.vue` · import `@/shared/ui`.

> **rev.1:** decidido como **creación** (antes "posible/evaluar"). Dos overlays fullscreen reales lo justifican.

| | |
|---|---|
| **Ruta** | `web/src/components/ui/OverlayShell.vue` |
| **Grupo / orden** | G3 (base + shell) · 12º |
| **LOC actuales** | 0 (nuevo) |
| **Tipo** | crear |
| **Dependencias** | G0; relación con `useEditorMode` (modo editor del topbar) |
| **Consumidores** | `ProductoDetalle` (G6.4), `InsumoDetalle` (G6.5). Evaluar si `PresupuestoEditor` (G6.6) puede reusarlo (es split, quizá variante). |

## Estado actual
No existe. `ProductoDetalle` (`pd-overlay`) e `InsumoDetalle` reimplementan **el mismo shell de overlay fullscreen**: `fixed top:56 left:240 right:0 bottom:0`, grid `1fr auto` (body scrollable + footer), transición `overlay` (`overlay-in/out`), toggle `body.no-scroll`, e integración con el "modo editor" del topbar (`update:header` + `editorDirty` de `useEditorMode`). Todo duplicado en scoped.

## Objetivo (DRY/SRP)
Shell reutilizable de overlay fullscreen (análogo a `DrawerShell` pero a pantalla completa dentro del área de contenido), con slots `body`/`foot` y la integración del modo editor encapsulada.

## Plan de acción paso a paso
1. **(API/slots)** Props: `open`, `title`/`code` (para el header del topbar), y manejo del ciclo (emite `close`). Slots `body` y `foot`. Internamente:
   - Layout `fixed top-14 left-60 right-0 bottom-0 z-30 bg-page-bg grid grid-rows-[1fr_auto] overflow-hidden`.
   - Toggle `body.no-scroll` en open/unmount.
   - Transición `overlay` (excepción C6).
2. **(SRP/DIP)** Encapsular la integración con `useEditorMode` (emitir `update:header` con `onSave`/`onClose`, sincronizar `editorDirty`) **o** exponerla por props/slots para que el overlay hijo controle save/dirty. Decisión: el hijo pasa `:dirty` y un handler `onSave`; `OverlayShell` orquesta `update:header`. Mantener el contrato actual.
3. **(reuso)** Footer estándar (volver / eliminar / guardar) por slot `foot` con `BaseButton`.
4. **(C6)** Conservar `@keyframes overlay-in/out`.

## Reemplaza
El shell `pd-overlay`/equivalente duplicado en `ProductoDetalle` e `InsumoDetalle` (y, si aplica, parte del de `PresupuestoEditor`).

## Criterios de aceptación
- `vue-tsc` ok; ambos overlays abren/cierran, scroll del body, footer, `no-scroll`, modo editor del topbar y transición idénticos.
- Sin shell de overlay duplicado entre G6.4 y G6.5.

## Riesgos / notas
- **`PresupuestoEditor` es split (form+preview)**, no un overlay simple — evaluar si usa `OverlayShell` como contenedor externo + layout split adentro, o si queda fuera. No forzar (Regla de Tres: 2 consumidores claros bastan; el editor es un tercero *posible*).
- La integración con `useEditorMode` (Teleport del badge incluido, ver C11) es la parte delicada: definir el contrato del slot/props antes de migrar G6.4/G6.5.
- Posición depende del shell (sidebar 240px / topbar 56px); si esos valores cambian en G3.8/G3.10, `OverlayShell` debe referenciar los mismos tokens/medidas.
