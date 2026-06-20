# G0.1 — `assets/css/main.css`

> **Ubicación (modular, rev.2):** destino `app/styles/main.css`.

| | |
|---|---|
| **Ruta** | `web/src/assets/css/main.css` |
| **Grupo / orden** | G0 (fundación) · 1º absoluto |
| **LOC actuales** | 4 |
| **Tipo** | migrar (ampliar) |
| **Dependencias** | ninguna — es el primer paso |
| **Consumidores** | toda la app (importado por `main.ts`) |

## Estado actual
```css
@import url("...Onest...");
@import "tailwindcss";
@import "./tokens.css";
@import "./components.css";
```
Solo orquesta imports. Tailwind v4 está activo pero sin tokens propios: las utilidades de color/spacing custom (`bg-violet-700`) **no existen** todavía, por eso el código usa `var(--violet-700)` a mano.

## Objetivo (responsabilidad única)
Ser la **fuente de verdad del design system dentro de Tailwind**: declarar todos los tokens en `@theme` (→ genera utilidades) y los estilos base de elementos en `@layer base`. Queda como único punto de entrada de estilos globales.

## Plan de acción paso a paso
1. **(Tailwind)** Mantener `@import "tailwindcss";` y la fuente Onest arriba.
2. **(Tailwind/C1)** Agregar bloque `@theme { … }` con todos los tokens migrados desde `tokens.css` usando los nombres que Tailwind reconoce (`--color-*`, `--radius-*`, `--shadow-*`, `--text-*`, `--font-sans`). Ver tabla C1 del índice.
3. **(C2)** No declarar escala de espaciado custom — se usa la default (4px). Documentar el mapeo en comentario.
4. **(base)** Migrar los estilos base de elementos hoy en `tokens.css` (headings violeta peso 500 + `letter-spacing`, `body`, `a`, `label`, `hr`, `::selection`, `.num`/`.text-mono`) a `@layer base { … }` en este archivo. Pueden quedar como CSS plano dentro del layer (no es "componente").
5. **(transición)** **Conservar** `@import "./components.css";` por ahora — se elimina en G7 cuando ninguna vista lo use.
6. Eliminar `@import "./tokens.css";` una vez que su contenido fue absorbido (ver G0.2).
7. **(rev.1 / C9)** Agregar los tokens **faltantes** `--color-teal-600` y `--color-violet-600` (hoy usados por `ToastContainer` pero **inexistentes** en `tokens.css` → resuelven a color heredado) **o** decidir remapear esos usos a `teal-700`/`violet-700`. Confirmar además que `--orange-*` (ya presentes en `tokens.css`) queden mapeados en `@theme`.

## Antes → Después
```css
/* Antes: tokens viven en :root de tokens.css, sin utilidades Tailwind */
/* Después */
@import "tailwindcss";
@theme {
  --color-violet-700: #8B2570;
  --color-teal-500:   #75CCCE;
  /* … */
  --radius-lg: 12px;
  --shadow-2: 0 2px 6px rgba(28,26,30,.06), 0 1px 2px rgba(28,26,30,.04);
  --text-22: 22px;
  --font-sans: "Onest", ui-sans-serif, system-ui, sans-serif;
}
@layer base {
  h1,h2,h3,h4,h5,h6 { color: var(--color-violet-700); font-weight: 500; letter-spacing: -.01em; }
  /* … */
}
@import "./components.css"; /* TEMP — borrar en G7 */
```

## Componentes/utils que crea o consume
Habilita todas las utilidades custom (`bg-*`, `text-*`, `rounded-*`, `shadow-*`, `text-12…48`) que el resto de docs asume disponibles.

## Mapeo Tailwind
Ver tabla **C1** y **C2** del índice (es exactamente este archivo el que las implementa).

## Criterios de aceptación
- `npm run dev` levanta sin error de CSS.
- Una clase nueva de prueba (`<div class="bg-violet-700 text-white rounded-lg">`) renderiza el violeta correcto.
- La app sigue viéndose igual (porque `components.css` aún está importado).

## Riesgos / notas
- Tailwind v4 exige nombres con namespace (`--color-`, `--radius-`, `--text-`…) para generar utilidades; un token mal nombrado simplemente no genera utilidad (no rompe, pero no aparece).
- No borrar `components.css` aquí: rompería todas las vistas no migradas.
