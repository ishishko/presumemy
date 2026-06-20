# G3.8 — `components/layout/TheSidebar.vue`

> **Ubicación (modular, rev.2):** shell de app → `app/shell/AppSidebar.vue`.

| | |
|---|---|
| **Ruta** | `web/src/components/layout/TheSidebar.vue` |
| **Grupo / orden** | G3 (base + shell) · 8º |
| **LOC actuales** | 110 |
| **Tipo** | migrar |
| **Dependencias** | G0 |
| **Consumidores** | `App.vue` |

## Estado actual
Sidebar fijo 240px violeta. Arrays `navOperacion`/`navDatos` (data-driven, bien). Clases globales `.sidebar`, `.sidebar-brand`, `.sidebar-section`, `.sidebar-section-label`, `.nav-item`(+`.active`), `.sidebar-foot`, `.sidebar-foot-user`, `.avatar`, `.who`, `.spacer` (`components.css` ~6-173). Lee `useAuthStore` para nombre/iniciales. **Smell:** `:style` inline en el botón logout (línea 101).

## Objetivo
Shell de navegación 100% Tailwind, con mapa activo/inactivo para `.nav-item`. Sin estilos inline.

## Plan de acción paso a paso
1. **(Tailwind/C1)** `.sidebar` → `w-60 h-screen sticky top-0 bg-violet-700 text-white flex flex-col` (240px = `w-60`). Brand card blanco (`bg-white rounded-lg p-...`). Secciones con label eyebrow.
2. **(OCP/C3)** `.nav-item` base + estado activo por clase condicional (no string concat): activo `bg-violet-900/borde activo + texto blanco`, inactivo `text-white/80 hover:bg-violet-900/50` (ajustar al prototipo).
3. **(Tailwind)** Quitar el `:style` inline del logout → utilidades (`p-1.5 w-7 h-7 grid place-items-center` o `BaseButton variant="ghost" icon`).
4. **(Vue)** Mantener arrays de nav, `userName`/`userInitials` computed, emits `navigate`/`logout`.

## Mapeo Tailwind (parcial)
| Antes | Después |
|---|---|
| `.sidebar` | `w-60 h-screen sticky top-0 bg-violet-700 text-white flex flex-col p-4 gap-...` |
| `.nav-item` | `flex items-center gap-3 px-3 py-2 rounded-md text-white/85 hover:bg-violet-900/50 transition-colors` |
| `.nav-item.active` | `bg-violet-900 text-white` |
| `.sidebar-section-label` | `text-11 uppercase tracking-[.06em] text-white/60 px-3` |
| logout `:style` inline | `p-1.5 w-7 h-7 grid place-items-center rounded-md hover:bg-violet-900/50` |

## Criterios de aceptación
- `vue-tsc` ok; navegación y highlight activo idénticos.
- Logo en card blanco a 120px; texto siempre legible sobre violeta.
- Sin `:style` inline.

## Riesgos / notas
- Texto sobre `violet-700` siempre blanco (regla DS). Verificar contrastes del estado activo contra el prototipo.
- Confirmar medidas exactas (padding, gaps) en `components.css` (`.sidebar*`).
