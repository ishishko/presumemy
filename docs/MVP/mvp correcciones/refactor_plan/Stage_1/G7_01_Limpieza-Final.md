# G7.1 — Limpieza final

> **Ubicación (modular, rev.2):** además del CSS, borrar las carpetas legacy vacías tras la relocalización (`views/`, `components/`, `stores/`, `services/`, `composables/`, `utils/`, `schemas/`, `types/` si quedaron sin contenido). El enforcement de barrels/imports profundos está en `G7_02_Enforcement.md`.

| | |
|---|---|
| **Rutas** | `web/src/assets/css/components.css`, `tokens.css`, `web/src/style.css` |
| **Grupo / orden** | G7 (limpieza) · último |
| **Tipo** | borrar / depurar |
| **Dependencias** | **todos** los grupos G0–G6 completos y verificados |
| **Consumidores** | — |

## Estado actual
Tras migrar todo a Tailwind, deberían quedar sin uso:
- `components.css` (3.382 líneas) — UI kit vanilla, ya reemplazado por utilidades/componentes.
- `tokens.css` `:root` — tokens duplicados en `@theme` (puente de transición de G0.2).
- `web/src/style.css` — huérfano (no importado por `main.ts`).
- `<style scoped>` residuales no justificados por C6.
- Helpers/funciones duplicadas centralizadas (`money()`/`getNivel`/`statusTones`).

## Objetivo
Eliminar todo el CSS vanilla y el código muerto, dejando solo `@theme` + `@layer base` en `main.css` y los `<style scoped>` justificados (animaciones C6).

## Plan de acción paso a paso
1. **(barrido de clases huérfanas)** Antes de borrar `components.css`, buscar en `web/src` que ninguna clase del kit siga referenciada:
   - `grep -rE "class=.*(btn|card|kpi|badge|data-table|sidebar|nav-item|drawer-|ff-|fin-|pd-|aj-|prod-|clientes-|insumos-|status-|filter-chip|stock-bar|segmented|seg-btn|toggle-switch|page-head|eyebrow|grid-2|grid-3)" web/src` → debe volver vacío (o solo coincidencias dentro de `@theme`/comentarios).
2. **(borrar)** Eliminar `@import "./components.css";` de `main.css` y borrar el archivo.
3. **(borrar)** Confirmar que ningún `var(--legacy)` sin `@theme` se usa; borrar el `:root` de `tokens.css` y el `@import "./tokens.css";` (los estilos base ya viven en `@layer base`). Borrar el archivo si queda vacío.
4. **(borrar)** Borrar `web/src/style.css` (verificar que `main.ts` no lo importe — hoy no).
5. **(scoped)** Revisar cada `<style scoped>` restante: debe ser solo animación irreductible (wave de `FloatingField`/`FloatingSelect`, transiciones `drawer`/`toast`/`confirm`/`overlay`, `card-appear` login, `aj-grow`, `@page`/`@media print` de la vista pública). Borrar cualquier otro.
6. **(duplicados)** Confirmar que `money()`/`getNivel`/`nivelMeta`/`statusTones`/`TRANSITIONS`/`formatDate` locales fueron eliminados de todas las vistas (centralizados en `shared/lib`/`modules/<dominio>/`).
7. **(carpetas legacy)** Borrar carpetas vacías tras la relocalización modular: `views/`, `components/`, `stores/`, `services/`, `composables/`, `utils/`, `schemas/`, `types/` (si quedaron sin contenido). Verificar que no queden archivos huérfanos antes de borrar.
8. **(assets muertos)** Borrar `src/assets/vite.svg` y `src/assets/vue.svg` (scaffolding de Vite sin uso real — verificar que ningún componente los importe). `hero.png` **no** se borra: viaja a `modules/auth`/`public/` (G0.0).

## Criterios de aceptación
- `cd web && npx vue-tsc -b` sin errores.
- `cd web && npm run build` ok (sin CSS faltante).
- `npm run test` verde.
- **Barrido de clases huérfanas vacío.**
- Revisión visual final completa de las 7 páginas + login + vista pública + drawers/overlays/editor contra el prototipo.
- **PDF de Puppeteer** verificado (coordina con G4.3/G5.8).
- `components.css`, `tokens.css` (`:root`) y `style.css` eliminados; `main.css` = `@theme` + `@layer base` + import de Tailwind y fuente.

## Riesgos / notas
- No borrar `components.css`/`tokens.css` hasta que el barrido de huérfanas esté **realmente** vacío — un borrado prematuro rompe en cascada.
- Si queda alguna clase huérfana imprescindible (raro), migrarla a `@utility` antes de borrar el archivo, nunca dejar el kit completo por una clase.
- Medir el tamaño del bundle CSS antes/después como sanity check (debería bajar bastante).
