# G4.1 — `shared/ui/CategoriaPills.vue` (una sola copia — DRY)

> **Ubicación (modular, rev.2):** destino **`shared/ui/CategoriaPills.vue`** (una copia). Es **presentacional puro**: recibe `categorias`/`modelValue` por props y emite `update:modelValue`/`create`/`rename`/`remove`; **no importa store ni api** → es *forma sin dominio*, no se duplica (C17/DRY). El dominio de categorías (store/api) vive en `insumos`/`productos`; cada `*Page` instancia este componente con sus datos.

| | |
|---|---|
| **Ruta destino** | `web/src/shared/ui/CategoriaPills.vue` (única) |
| **Grupo / orden** | G4 (medianos) · 1º |
| **LOC actuales** | 350 |
| **Tipo** | migrar |
| **Dependencias** | G0; G2.4 (`FloatingField`) opcional para inputs inline |
| **Consumidores** | `InsumosPage` (G5.4), `ProductosPage` (G5.3) |

## Estado actual
Pills de categoría con filtro + edición inline avanzada: seleccionar (toggle a 'todas'), **long-press 500ms** para revelar acciones (lápiz/X), rename inline, create inline (máx 12), remove (emite a un dialog). v-model `number|'todas'`. Listener global de click para cerrar acciones. Clases globales `.insumos-cat-pill`/`.insumos-cat-row` (hardcodeadas incluso para variant `productos` — comentario "unificamos el estilo"). `<style scoped>` extenso (≈100 líneas): `.editable-pill`, `.pill-actions` (animación width), `.action-btn`, `.inline-edit-input`, `.add-pill`.

## Objetivo
Pills 100% Tailwind conservando toda la UX (long-press, inline edit/create), en **una sola** copia en `shared/ui`, **sin acoplamiento al dominio** (consumible por cualquier listado de categorías).

## Plan de acción paso a paso
1. **(DRY/C17 — clave)** Ubicar en `shared/ui/CategoriaPills.vue` (una copia). No duplicar en módulos. `InsumosPage`/`ProductosPage` lo importan de `@/shared/ui` y le pasan `:categorias` de su store + cablean los emits a su CRUD de categorías.
2. **(desacople de dominio)** Generalizar el prop `variant: 'insumos'|'productos'` → **`allLabel: string`** (hoy `variant` solo decide "Todas"/"Todos"). Así el componente deja de nombrar dominios. Generalizar `getCount`: en vez de `c._count.insumos ?? c._count.productos`, aceptar `count?: number` directo en la `Categoria` que recibe (o mantener el `??` como fallback). Quitar las clases hardcodeadas `insumos-cat-pill`/`insumos-cat-row` (que ya eran un nombre de dominio para estilo compartido — su migración a Tailwind borra el problema).
3. **(Tailwind)** Migrar `.insumos-cat-pill`/`.insumos-cat-row` (de `components.css`) y el `<style scoped>` a utilidades. La pill activa por **mapa/condicional** (`active` → `bg-violet-700 text-white`, inactiva → `bg-violet-50 text-violet-700`, ajustar al prototipo).
4. **(C6 excepción menor)** La animación de `.pill-actions` (width 0→32px + opacity) puede quedar como scoped mínima o resolverse con `grid-cols`/`max-w` + `transition-all`. Evaluar; si Tailwind lo expresa limpio, migrar; si no, scoped puntual.
5. **(SRP/DRY)** Extraer el input inline (idéntico en rename y create) a un subcomponente `InlinePillInput.vue` (o usar `FloatingField` minimal). Dos usos actuales + patrón claro → vale la extracción.
6. **(Vue/clean)** Conservar long-press (`handleMousedown/up/leave`, `pressTimer`, `isLongPress`), `toggleSelect`, listeners global mount/unmount, límite de 12. Mantener emits `update:modelValue/create/rename/remove`.
7. **(a11y)** Revisar: el long-press no es accesible por teclado → anotar como mejora futura (no romper lo existente, pero documentar el gap).

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
- **Una sola copia** en `shared/ui`; sin import de store/api; sin nombres de dominio en props/clases.

## Riesgos / notas
- Componente con bastante interacción: probar long-press y blur-save con cuidado.
- **Migración del consumo:** al mover a `shared/ui`, actualizar `InsumosPage`/`ProductosPage` para importar de `@/shared/ui` y pasar `allLabel` ("Todas"/"Todos") en vez de `variant`. Es el único cambio en los consumidores.
