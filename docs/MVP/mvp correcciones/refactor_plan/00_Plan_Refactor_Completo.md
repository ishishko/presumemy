# Refactor frontend `web/` — Tailwind puro + componentización SOLID (plan archivo por archivo)

## Context

El frontend de Presumemi (`web/`, Vue 3 + Vite + Tailwind v4) tiene el estilado fragmentado en tres lugares — `tokens.css` (152 líneas), un `components.css` monolítico de **3.382 líneas**, y 19/28 SFCs con `<style scoped>` + estilos inline `var()` — y varias vistas concentran demasiadas responsabilidades (fetch + CRUD + reglas de negocio + formato + presentación).

Esta sesión migra todo a **Tailwind puro** (se elimina `components.css` y los `<style scoped>`) y **rediseña la componentización con SOLID**. Se ejecuta **bottom-up** (decisión tomada): fundación → primitivos hoja → shell → vistas → drawers/overlays/editor pesados al final, para que las piezas reutilizables existan antes de tocar los archivos grandes. Implementación grande **guiada archivo por archivo**; referencia visual pixel-perfect = prototipo en `docs/MVP/design-system/project/ui_kits/presumemi/`.

## Arquitectura modular por dominio (rev.2)

Además del refactor de estilado/componentización, el frontend se **reorganiza a una estructura modular por dominio** (`app/ + shared/ + modules/<dominio>/`): todo lo de un dominio en una sola carpeta. La fuente de verdad es **[`00_Arquitectura_Modular.md`](00_Arquitectura_Modular.md)**. Reemplaza el `package-by-layer` actual y la adaptación FSD por capas (que dispersaba cada dominio). Invariantes que se conservan: `shared` sin dominio, regla de dependencia `app→modules→shared`, public API por barrel, **DIP por construcción** (la UI de un módulo no importa `shared/api`). Convivencia con este refactor = **Opción A (relocalizar al tocar)**: cada Grupo escribe directamente en su destino modular. La metadata de ubicación por archivo está en el índice (`01_Indice_y_Seguimiento.md`, "Ubicación modular por archivo") y en cada doc de archivo.

## Convenciones globales del refactor

- **DRY (principio rector):** cada conocimiento —UI, regla, catálogo, tipo, estilo— tiene **una** representación canónica. Antes de duplicar: ¿es *dominio*? → su módulo; ¿es *forma sin dominio*? → `shared`, una copia (aunque hoy lo usen varios dominios). Detalle y matices (Regla de Tres vs duplicación literal) en `00_Arquitectura_Modular.md` §1 y C17 del índice. Es el motor de casi todas las extracciones de abajo (`formatMoney`, `getNivel` único, catálogos centralizados, shells reutilizados, `CategoriaPills`/`Dialog` no duplicados).
- **Tokens → `@theme`** en `main.css` (Tailwind v4): los design tokens de `tokens.css` se vuelven la fuente de verdad dentro de Tailwind (genera `bg-violet-700`, `text-ink-muted`, `rounded-lg`, `shadow-2`…). No es CSS vanilla; lo vanilla a borrar es `components.css`.
- **Variantes → mapa de estrategia** (OCP): `Record<Variant, string>` de clases, nunca cadenas `if/else`/inline.
- **Props segregadas** (ISP): cada componente recibe lo mínimo (`{ stock, minimo }`, no el `Insumo` entero).
- **DIP**: componentes/vistas **no importan `services/api`**; el acceso a datos vive en el store; el formato/reglas en `utils/`/composables.
- **Vue idiomático**: `<script setup lang="ts">`, props tipadas, `defineModel` donde aplique, componentes presentacionales delgados.
- **Transiciones**: las pocas animaciones (`drawer`, `toast`, `confirm`) se conservan como `<style scoped>` mínimo o `@utility`; no se fuerzan a Tailwind si pierden claridad.

### Checklist universal por archivo (se aplica a cada SFC, no se repite abajo)
1. Reemplazar clases de `components.css` y `var()` inline por utilidades Tailwind.
2. Eliminar `<style scoped>` (salvo transiciones irreductibles).
3. Extraer presentación repetida a componentes `ui/`; lógica de negocio a `utils/`/composables.
4. Quitar imports de `services/api`; delegar en el store.
5. Verificar tipos (`vue-tsc`) y comparar visualmente con el prototipo.

---

## Grupo 0 — Fundación (sin esto no compila nada migrado)

- **`app/styles/main.css`** (desde `assets/css/main.css`) — definir bloque `@theme` con todos los tokens (colores, `--font-sans` Onest, escala `--text-*`, `--radius-*`, `--shadow-*`, focus rings). Mover estilos base de elementos (headings violeta peso 500, body, links, `::selection`) a `@layer base`. Mantener `@import "./components.css"` **temporalmente** (se borra en Grupo 7).
- **`assets/css/tokens.css`** — origen del mapeo; se vacía/borra cuando todo migró a `@theme`.
- Mapeo de espaciado: grid 4px = escala default Tailwind (`--s-4`=16px → `p-4`, `--s-2`=8px → `gap-2`); documentar, sin escala custom.

## Grupo 1 — Capa de datos y utils (DIP/SRP, antes de tocar UI)

- **`shared/lib/format.ts`** (nuevo) — `formatMoney()` único (hoy duplicado como `money()` en `InsumosView` y otras vistas). Posible `formatDate()`.
- **`modules/insumos/stock.ts`** (nuevo) — extraer `getNivel()`, umbrales y `nivelMeta` hoy embebidos en `InsumosView` (líneas 34-73). Testeable de forma aislada.
- **`modules/<dominio>/store.ts`** (insumos, productos, clientes, finanzas, presupuestos) — **absorber el `del()`**: que `remove(id)` haga `await del(...)` + filtro local, en vez de filtrar solo y dejar la llamada a la vista. Las vistas dejan de importar `shared/api`.
- **`shared/api/client.ts`** (desde `services/api.ts`) — ya es un adapter funcional limpio; sin cambios salvo que sea el único punto que conozca `ofetch`.
- Composables existentes (`useToast`, `useEditorMode`, `useCreateTrigger`, `useDirty`) — OK; `useEditorMode`/`useCreateTrigger` son singletons globales (event-bus): se mantienen, anotado como deuda menor. Se reubican en **`shared/lib/`** (no `app`: los consumen vistas/overlays que pasan a `modules`, y `modules` no puede importar `app`).

## Grupo 2 — Primitivos hoja (orden de implementación)

1. **`shared/ui/ToggleSwitch.vue`** (31) — clase `.toggle-switch`→Tailwind; migrar a `defineModel`. Bajo riesgo, fija convención de switch.
2. **`shared/ui/PageHead.vue`** (18) — clases `.page-head/.title/.sub`→utilidades; slot de acciones intacto.
3. **`shared/ui/SegmentedControl.vue`** (61) — `.segmented/.seg-btn`→Tailwind con mapa activo/inactivo; conservar a11y (radiogroup, flechas).
4. **`shared/ui/FloatingSelect.vue`** (90) y **`shared/ui/FloatingField.vue`** (130) — comparten la animación "wave" del label (`components.css` ~3231-3382). Migrar control/estado a Tailwind; **la animación escalonada del label queda como `<style scoped>` mínimo o `@utility`** (es la excepción justificada). Unificar la lógica de estado compartida si conviene.
5. **`shared/ui/ConfirmDialog.vue`** (102) — cuerpo→Tailwind; botones via `BaseButton` (Grupo 3). Conservar `Teleport`+transición `confirm`. **Tiene test** → mantener API/props.
6. **`shared/ui/ToastContainer.vue`** (117) — `.toast*`→Tailwind con mapa por `type` (success/error/info) (OCP); conservar `TransitionGroup`.
7. **`shared/ui/DrawerShell.vue`** (151) — layout `grid-rows: auto 1fr auto`→Tailwind; conservar transición `drawer`. Es la base de los 3 drawers pesados → migrarlo antes que ellos.

## Grupo 3 — Componentes base nuevos + shell

- **`shared/ui/BaseButton.vue`** (nuevo) — variantes `primary|secondary|ghost|danger` + `icon` via mapa de estrategia; estados hover/press/disabled. Reemplaza `.btn*` global en toda la app.
- **`shared/ui/StatusBadge.vue`** (nuevo) — `{ label, tone }`, pastel + override por mapa. Reemplaza `.badge`/badges inline.
- **`shared/ui/BaseCard.vue`**, **`BaseKpi.vue`** (nuevos) — surface/border/shadow.
- **`app/shell/AppSidebar.vue`** (desde `components/layout/TheSidebar.vue`, 110) — `.sidebar*`/`.nav-item`→Tailwind con mapa activo; quitar `:style` inline del botón logout (línea 101).
- **`app/shell/AppHeader.vue`** (desde `components/layout/AppHeader.vue`, 79) — `.app-header`/`.search`→Tailwind; quitar `:style` inline del botón guardar (usar `disabled:` + `BaseButton`). Nota: el `<input>` de búsqueda no tiene binding — confirmar si se cablea al search existente o queda fuera de alcance.
- **`app/App.vue`** (105) — `.app/.main` shell→Tailwind (grid sidebar 240px + main). Sin lógica nueva.

## Grupo 4 — Componentes medianos

- **`shared/ui/CategoriaPills.vue`** (350, **una copia** — DRY/C17) — pills + edición inline de categorías→Tailwind; presentacional puro (props + emits, sin store/api), por eso vive en `shared/ui` y la consumen insumos y productos. Generalizar `variant`→`allLabel`. Extraer el input inline si hay repetición.
- **`shared/ui/CategoriaDeleteDialog.vue`** (200, **una copia** — DRY/C17) — diálogo de borrado/reasignación→Tailwind sobre `ConfirmDialog`; presentacional puro. El borrado/reasignación los ejecuta el store de cada módulo (el diálogo solo emite `confirm`/`cancel`).
- **`modules/presupuestos/PresupuestoDoc.vue`** (158) — documento preview (`components.css` ~1760-2007)→Tailwind; presentacional puro.

## Grupo 5 — Vistas (small→large; cada una se audita al llegar)

Aplican el checklist universal + extracción de tabla/cards a componentes. Smell común esperado: `money()` duplicado (→ `formatMoney`), inline `var()`, posible CRUD que llama API directo (→ store).

- **`modules/dashboard/DashboardPage.vue`** (desde `views/DashboardView.vue`, 207) — KPIs + gráfico semanal + recientes → `BaseKpi`/`BaseCard`; revisar `stats-api.ts`.
- **`modules/clientes/ClientesPage.vue`** (desde `views/ClientesView.vue`, 216) — tabla + avatars → `DataTable` (nuevo, con slots) + `Avatar` si reaparece.
- **`modules/productos/ProductosPage.vue`** (desde `views/ProductosView.vue`, 253) — grid/lista + `CategoriaPills` → `ProductCard`/`DataTable`.
- **`modules/insumos/InsumosPage.vue`** (desde `views/InsumosView.vue`, 337) — **piloto del enfoque end-to-end**: queda como orquestador delgado usando `DataTable`, `StockBar` (nuevo, `{stock,minimo}`), `StatusBadge`, `RowActions` (nuevo), `formatMoney`, `stock.ts`; sin `shared/api`, sin scoped, sin inline.
- **`modules/presupuestos/PresupuestosPage.vue`** (desde `views/PresupuestosView.vue`, 353) — filtros + tabla + chips de estado (FSM) → `DataTable` + `StatusBadge` con mapa de estados.
- **`modules/finanzas/FinanzasPage.vue`** (desde `views/FinanzasView.vue`, 380) — KPIs mes + libro + tabs → `BaseKpi` + `DataTable`.
- **`modules/auth/LoginPage.vue`** (desde `features/auth/LoginView.vue`, 386) — ruta bare; logo + form → Tailwind + `FloatingField`/`BaseButton`.
- **`modules/presupuestos/PublicPresupuestoPage.vue`** (desde `features/public/PublicPresupuestoView.vue`, 208) — vista pública; reusa `PresupuestoDoc`.
- **`modules/ajustes/AjustesPage.vue`** (desde `views/AjustesView.vue`, 702) — 5 bloques con dirty-tracking → extraer cada bloque a su propio componente (SRP); `useDirty` por bloque ya existe.

## Grupo 6 — Pesados (drawers/overlays/editor; detalle al llegar)

Estos concentran la mayor parte de `components.css` y de la deuda de responsabilidad. Cada uno recibe su **sub-plan detallado al momento de implementarlo** (división de secciones en subcomponentes, extracción de lógica a composables, props segregadas). Se hacen al final porque dependen de todos los primitivos ya migrados.

- **`modules/clientes/ClienteDrawer.vue`** (506) — form + contactos (replace pattern). Extraer `ContactosEditor`.
- **`modules/finanzas/MovimientoDrawer.vue`** (530) y **`ImprentaDrawer.vue`** (534) — sobre `DrawerShell` + `FloatingField`/`FloatingSelect`/`BaseButton`.
- **`modules/productos/ProductoDetalle.vue`** (984) — overlay fullscreen + BOM. Extraer `BomEditor` y secciones; reglas de costeo a composable.
- **`modules/insumos/InsumoDetalle.vue`** (1.344) — overlay fullscreen + proveedores + costeo + flip switch. Extraer secciones (proveedores, costeo, stock) a subcomponentes; lógica a composables; reusar `stock.ts`.
- **`modules/presupuestos/PresupuestoEditor.vue`** (1.421) — el más grande; editor split form+preview, spreadsheet de líneas, totales, FSM, Teleport del badge de estado. Sub-plan propio: `LinesSpreadsheet`, `EditorTotals`, `EditorHeader` como subcomponentes; cálculos a composable; usa `PresupuestoDoc` para el preview.

## Grupo 7 — Limpieza final

- Borrar **`components.css`** y su `@import` en `main.css`.
- Borrar **`style.css`** (huérfano; `main.ts` no lo importa).
- Borrar **`tokens.css`** una vez todo en `@theme`.
- Eliminar `<style scoped>` y `money()`/`getNivel` residuales que quedaron centralizados.
- Búsqueda de clases globales huérfanas: confirmar que ninguna referencia sobrevive.
- Borrar carpetas legacy vacías tras la relocalización (`views/`, `components/`, `stores/`, `services/`, `composables/`, `utils/`, `schemas/`, `types/` si quedaron sin contenido).

---

## Archivos críticos
`app/styles/main.css` · `tokens.css` · `components.css` · `shared/lib/format.ts` (nuevo) · `modules/insumos/stock.ts` (nuevo) · `modules/<dominio>/store.ts` · `shared/ui/*` · `app/shell/*` · `modules/<dominio>/*Page.vue` · `modules/<dominio>/*Drawer.vue` · `modules/<dominio>/*Detalle.vue` · `modules/presupuestos/PresupuestoEditor.vue`.

## Verificación
- **Typecheck:** `cd web && npx vue-tsc -b` sin errores (correr tras cada grupo).
- **Build:** `cd web && npm run build`.
- **Tests:** `npm run test` — los de web siguen pasando; `ConfirmDialog` re-estilado mantiene API. Agregar tests unitarios para `formatMoney` y `useStockLevel` (reglas extraídas — beneficio de testabilidad de SOLID).
- **Visual:** `npm run dev`; comparar cada archivo migrado contra `docs/MVP/design-system/project/ui_kits/presumemi/index.html` (pixel-perfect): sidebar/topbar, tablas, badges, focus rings, hover, drawers.
- Al borrar `components.css`: barrido de clases huérfanas en todo `src/`.

## Notas de alcance y ejecución
Trabajo grande (28 SFCs, ~10k líneas .vue). La coexistencia temporal de `components.css` mantiene la app funcional entre grupos. Se aprueba el plan global y se ejecuta **grupo por grupo / archivo por archivo**, validando typecheck + visual antes de avanzar. SOLID se aplica donde abarata el próximo cambio; no se fuerzan patrones ni abstracciones prematuras (Regla de Tres, YAGNI). Los archivos del Grupo 6 reciben sub-plan propio al implementarlos.