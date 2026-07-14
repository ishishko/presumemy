# G3.10 — `app/App.vue`

> **Ubicación (modular, rev.2):** destino `app/App.vue` (shell raíz). El arranque vive en `app/` (main, router, pinia).

| | |
|---|---|
| **Ruta destino** | `web/src/app/App.vue` |
| **Grupo / orden** | G3 (base + shell) · 10º (cierra el shell) |
| **LOC actuales** | 105 |
| **Tipo** | migrar |
| **Dependencias** | G3.8 (`AppSidebar`), G3.9 (`AppHeader`), G2.7 (`ToastContainer`) |
| **Consumidores** | raíz de la app |

## Estado actual
Root: decide ruta "bare" (login/pública) vs shell (sidebar+main). Clases globales `.app` (grid) y `.main`. Lógica: título de página computed, `showCreate`, `editorMode` (vía `useEditorMode`), handlers de navegación/logout/create/editor, watch de ruta para reset del editor. Monta `ToastContainer` global.

## Objetivo
Migrar el layout del shell a Tailwind (grid sidebar 240px + main scrollable). Sin cambios de lógica.

## Plan de acción paso a paso
1. **(Tailwind/C1-C2)** `.app` → `grid grid-cols-[240px_1fr] min-h-screen` (o flex). `.main` → `flex flex-col min-h-screen` con contenido scrollable y padding `p-8` en el `RouterView` wrapper (revisar `components.css` ~173-297 "Main area").
2. **(Vue)** Mantener toda la lógica: `isBareRoute`, `pageTitle`, `showCreate`, integración con `useEditorMode`, handlers y `watch(route.path)`.
3. **(verificación de fondo)** Confirmar que el `--page-bg` se aplica al main (hoy lo da `body` desde tokens; mantener).

## Mapeo Tailwind
| Antes | Después |
|---|---|
| `.app` | `grid grid-cols-[240px_1fr] min-h-screen` |
| `.main` | `flex flex-col min-h-screen` |
| (padding contenido) | `p-8` en el wrapper del `RouterView` |

## Criterios de aceptación
- `vue-tsc` ok; rutas bare (login/pública) sin shell; resto con sidebar+topbar.
- Layout idéntico; scroll solo en el main; toasts globales funcionan.

## Riesgos / notas
- El `RouterView` del shell emite `@set-editor-mode` → mantener ese binding intacto.
- Cierra el shell: tras G3, sidebar/topbar/layout quedan en Tailwind y las vistas (G5) ya tienen el marco migrado.
