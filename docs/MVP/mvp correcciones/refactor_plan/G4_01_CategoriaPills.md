# G4.1 — `components/ui/CategoriaPills.vue`

> **Ubicación (modular, rev.2):** destino `modules/categorias/CategoriaPills.vue` · barrel `@/modules/categorias` (lo consumen insumos y productos por barrel).

| | |
|---|---|
| **Ruta** | `web/src/components/ui/CategoriaPills.vue` |
| **Grupo / orden** | G4 (medianos) · 1º |
| **LOC actuales** | 350 |
| **Tipo** | migrar |
| **Dependencias** | G0; G2.4 (`FloatingField`) opcional para inputs inline |
| **Consumidores** | `InsumosView` (G5.4), `ProductosView` (G5.3) |

## Estado actual
Pills de categoría con filtro + edición inline avanzada: seleccionar (toggle a 'todas'), **long-press 500ms** para revelar acciones (lápiz/X), rename inline, create inline (máx 12), remove (emite a un dialog). v-model `number|'todas'`. Listener global de click para cerrar acciones. Clases globales `.insumos-cat-pill`/`.insumos-cat-row` (hardcodeadas incluso para variant `productos` — comentario "unificamos el estilo"). `<style scoped>` extenso (≈100 líneas): `.editable-pill`, `.pill-actions` (animación width), `.action-btn`, `.inline-edit-input`, `.add-pill`.

## Objetivo
Pills 100% Tailwind conservando toda la UX (long-press, inline edit/create). Reducir duplicación entre input de edición e input de creación.

## Plan de acción paso a paso
1. **(Tailwind)** Migrar `.insumos-cat-pill`/`.insumos-cat-row` (de `components.css`) y el `<style scoped>` a utilidades. La pill activa por **mapa/condicional** (`active` → `bg-violet-700 text-white`, inactiva → `bg-violet-50 text-violet-700`, ajustar al prototipo).
2. **(C6 excepción menor)** La animación de `.pill-actions` (width 0→32px + opacity) puede quedar como scoped mínima o resolverse con `grid-cols`/`max-w` + `transition-all`. Evaluar; si Tailwind lo expresa limpio, migrar; si no, scoped puntual.
3. **(SRP/DRY)** Extraer el input inline (idéntico en rename y create) a un subcomponente `InlinePillInput.vue` (o usar `FloatingField` minimal). Dos usos actuales + patrón claro → vale la extracción.
4. **(Vue/clean)** Conservar long-press (`handleMousedown/up/leave`, `pressTimer`, `isLongPress`), `toggleSelect`, listeners global mount/unmount, límite de 12. Mantener emits `update:modelValue/create/rename/remove`.
5. **(a11y)** Revisar: el long-press no es accesible por teclado → anotar como mejora futura (no romper lo existente, pero documentar el gap).

## Mapeo Tailwind (parcial)
| Antes | Después |
|---|---|
| `.insumos-cat-pill` | `inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-13 font-medium bg-violet-50 text-violet-700 transition-colors` |
| `.insumos-cat-pill.active` | `bg-violet-700 text-white` |
| `.cat-count` | `text-11 opacity-60 num` |
| `.inline-edit-input` | `text-13 font-medium text-ink bg-surface border border-teal-500 rounded-pill px-2.5 h-7 w-[100px] outline-none shadow-[var(--focus-ring)]` |
| `.action-btn` / `.danger:hover` | `p-0.5 rounded-sm opacity-70 hover:bg-border` / `hover:bg-coral-50 hover:text-coral-500` |
| `.pill-actions` (anim) | `transition-all` + `max-w`/`grid` o scoped mínimo |

## Criterios de aceptación
- `vue-tsc` ok; long-press, rename, create (límite 12), remove y toggle funcionan igual.
- Visual de pills idéntico en Insumos y Productos.

## Riesgos / notas
- Componente con bastante interacción: probar long-press y blur-save con cuidado.
- `variant` hoy no cambia el estilo (solo el label 'Todas/Todos'); mantener.
