# G2.7 — `components/ui/ToastContainer.vue`

> **Ubicación (modular, rev.2):** destino `shared/ui/ToastContainer.vue` · import `@/shared/ui`.

| | |
|---|---|
| **Ruta** | `web/src/components/ui/ToastContainer.vue` |
| **Grupo / orden** | G2 (primitivos) · 7º |
| **LOC actuales** | 117 |
| **Tipo** | migrar |
| **Dependencias** | G0; usa `useToast` (sin cambios) |
| **Consumidores** | `App.vue` (montado una vez global) |

## Estado actual
`Teleport to body` + `TransitionGroup name="toast"`. Renderiza `toasts` de `useToast` con tipo `success/error/info`, icono, mensaje, botón undo, botón close. `<style scoped>` extenso: contenedor fijo, toast card, iconos por tipo, undo, close, transiciones. Usa colores `--teal-600`/`--violet-600` que **no están en tokens.css** (posible token faltante a revisar).

## Objetivo
Toasts presentacionales con Tailwind y **mapa por tipo** (OCP). Conservar `TransitionGroup` (excepción C6).

## Plan de acción paso a paso
1. **(Tailwind)** Migrar contenedor (`fixed bottom-5 right-5 z-[100] flex flex-col gap-2`) y card (`flex items-center gap-2.5 px-4 py-3 bg-surface border border-border rounded-md shadow-2 min-w-[300px] max-w-[420px]`).
2. **(OCP/C3)** Estilo del icono por tipo con **mapa**:
   ```ts
   const ICON_TONE: Record<Toast['type'], string> = {
     success: 'bg-teal-100 text-teal-700',
     error:   'bg-coral-50 text-coral-500',
     info:    'bg-violet-100 text-violet-700',
   }
   ```
   (Reemplaza `.toast-success .toast-icon` etc.; **corregir** `--teal-600`/`--violet-600` por tokens existentes `teal-700`/`violet-700` o agregarlos a `@theme`.)
3. **(C6 excepción)** Conservar transiciones `toast-enter/leave/move` en `<style scoped>` (slide + fade).
4. **(Vue)** Sin cambios de lógica; sigue leyendo `toasts/dismiss/undo` de `useToast`.

## Mapeo Tailwind
| Antes (scoped) | Después |
|---|---|
| `.toast-container` | `fixed bottom-5 right-5 z-[100] flex flex-col gap-2` |
| `.toast` | `flex items-center gap-2.5 px-4 py-3 bg-surface border border-border rounded-md shadow-2 min-w-[300px] max-w-[420px]` |
| `.toast-icon` | `shrink-0 w-6 h-6 rounded-full grid place-items-center` |
| `.toast-{type} .toast-icon` | mapa `ICON_TONE` |
| `.toast-message` | `flex-1 text-13 text-ink min-w-0` |
| `.toast-undo` / `.toast-close` | `flex items-center gap-1 text-12 ...` / `text-ink-muted hover:bg-page-bg` |
| transiciones | **scoped** (excepción C6) |

## Criterios de aceptación
- `vue-tsc` ok; aparición/desaparición y undo funcionan.
- Colores por tipo correctos (revisar el token de teal/violet usado).

## Riesgos / notas
- **Token faltante:** `--teal-600`/`--violet-600` se usan hoy pero no están en `tokens.css`. Resolver al migrar: usar `teal-700`/`violet-700` o agregar los 600 a `@theme`. Anotar la decisión.
