# G0.2 — `assets/css/tokens.css`

> **Ubicación (modular, rev.2):** los tokens se absorben en `app/styles/main.css` (`@theme`); el archivo se borra en G7.

| | |
|---|---|
| **Ruta** | `web/src/assets/css/tokens.css` |
| **Grupo / orden** | G0 (fundación) · 2º |
| **LOC actuales** | 152 |
| **Tipo** | migrar → borrar (en G7) |
| **Dependencias** | G0.1 (`main.css` debe recibir los tokens) |
| **Consumidores** | toda la app vía `var(--*)` |

## Estado actual
Dos bloques:
1. `:root { … }` (líneas 6-92) — todos los design tokens como custom properties: colores brand/neutros/pasteles/tints, type stack, escala `--fs-*`, line-heights, espaciado `--s-*`, radios `--r-*`, sombras, focus rings.
2. Estilos base de elementos (líneas 94-152) — `html/body`, `h1..h6`, `p`, `a`, `label`, `hr`, `::selection`, helpers `.num`/`.text-mono`/`.text-muted`/`.text-hint`.

## Objetivo
Desaparecer. Su contenido se reparte entre `@theme` (tokens) y `@layer base` (estilos de elemento) de `main.css`. Mientras queden `var(--*)` legacy sin migrar en archivos pendientes, el `:root` puede sobrevivir temporalmente; el objetivo final es borrarlo en G7.

## Plan de acción paso a paso
1. **(C1)** Trasladar cada token de `:root` a `@theme` en `main.css` con el nombre namespaced correspondiente. Mantener los valores hex idénticos (cero cambio visual).
2. **Decisión de doble-nombre durante transición:** los archivos aún no migrados siguen usando `var(--violet-700)`. Para no romperlos, opción simple: en `@theme` Tailwind ya expone la variable como `--color-violet-700`; **mantener `tokens.css` con el `:root` original hasta G7** y solo mover los estilos base de elemento ahora. Así `var(--violet-700)` legacy sigue resolviendo y las nuevas utilidades también funcionan.
3. **(base)** Mover los estilos de elemento (líneas 94-152) a `@layer base` de `main.css`; eliminar esa sección de `tokens.css`.
4. En G7: confirmado que ya nadie usa `var(--legacy)` → borrar `tokens.css` completo y su import.

## Antes → Después
- **Ahora:** `tokens.css` = tokens + base.
- **Tras G0:** `tokens.css` = solo `:root` con tokens legacy (puente). `main.css` = `@theme` + `@layer base`.
- **Tras G7:** `tokens.css` borrado.

## Mapeo Tailwind
Tabla **C1** del índice (1:1 token→utilidad).

## Criterios de aceptación
- App idéntica visualmente tras mover los estilos base.
- No quedan reglas de elemento duplicadas entre `tokens.css` y `main.css`.

## Riesgos / notas
- **No borrar el `:root` todavía**: ~20 archivos siguen usando `var(--*)` hasta migrarse. Borrarlo antes = colores rotos en cascada.
- Verificar que ningún token quede solo en `tokens.css` sin equivalente en `@theme` antes de G7.
