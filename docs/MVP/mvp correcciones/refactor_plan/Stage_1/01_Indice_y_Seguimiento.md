# Índice y seguimiento — Refactor frontend `web/`

> Documento maestro de navegación. El plan global está en [`00_Plan_Refactor_Completo.md`](00_Plan_Refactor_Completo.md).
> **Este índice es el único registro de cambios del plan** (changelogs + convenciones). Los ajustes provienen de dos rondas de revisión: una primera revisión SOLID/Vue (consolidada en el **Changelog rev.1** y en las convenciones C8–C12) y la reestructuración modular (**Changelog rev.2**, C13–C17). No hay documentos de revisión separados.
> **Arquitectura de carpetas:** modular por dominio — ver [`00_Arquitectura_Modular.md`](00_Arquitectura_Modular.md) (**rev.2**). Cada Grupo escribe directamente en su destino modular (Opción A). La "Ubicación modular por archivo" está al final de este índice.
> Cada archivo a modificar/crear/borrar tiene su propio doc de acción. Se ejecutan **en el orden de construcción corregido** (abajo).

## Changelog rev.1 (primera revisión SOLID/Vue — consolidada aquí)

- **`useStockLevel` → `utils/stock.ts`** (era un util puro mal etiquetado como composable). Doc: `G1_02_stock-util.md`.
- **Modelo único de semáforo de stock** (C8): se unifica el de 4 niveles (`InsumoDetalle`) como canónico; `InsumosView` lo consume colapsado. Resuelve el conflicto de umbrales (`0.2` vs `0.5`).
- **`BaseButton` se construye primero** (orden corregido): es primitivo hoja consumido por `ConfirmDialog` y `DrawerShell`. Sigue documentado en `G3_01` pero su build va tras G1.
- **`FilterChips`** y **`OverlayShell`** ahora tienen doc propio (`G3_11`, `G3_12`); dejan de "nacer dentro de una vista" / "ser posibles".
- **Tokens faltantes** (C9): `--teal-600`/`--violet-600` (usados por `ToastContainer`) no existen → se agregan a `@theme` o se remapean en G0.1. (`--orange-*` ya fueron agregados al `tokens.css`.)
- **`DataTable` se compromete con la opción A** (slots + `columns`).
- **Store de ajustes: se CREA** (verificado: no existe ninguno) — destraba G5.9.
- **Service de fetch público obligatorio** en G5.8 (motivo: consistencia + testabilidad, no dogma DIP). En la arquitectura modular es **`modules/presupuestos/public-api.ts`** (rev.2; antes `services/public.ts`).
- **Convención de error handling** (C10): store re-lanza, vista hace try/catch + toast. **Sin** `useAsyncAction` por ahora (YAGNI).
- **Dark mode de `LoginView`: se elimina** (dead code de facto; no hay estrategia dark global).
- **Contrato del Teleport** `#editor-header-status` como **constante compartida** (C11).
- **Tests añadidos**: `presupuestoEstado.ts` (FSM).
- **Checkpoint PDF/Puppeteer** explícito entre G4.3 y G5.8.
- **Audit de catálogos duplicados** (C12): barrido general además de `statusTones`/`tipoMovs`.

## Changelog rev.2 (arquitectura modular por dominio)

- **Estructura modular** (`app/ + shared/ + modules/<dominio>/`) reemplaza el `package-by-layer` y la adaptación FSD por capas (que dispersaba cada dominio). Fuente de verdad: `00_Arquitectura_Modular.md`. El marco FSD original se **eliminó** (absorbido).
- **Convivencia Opción A** (relocalizar al tocar): cada Grupo escribe en su destino modular en la misma pasada. No cambia ninguna decisión de rev.1; solo *dónde vive* cada archivo.
- **Nuevo `G0_00_Estructura_Modular.md`** (scaffolding, corre primero) y **`G7_02_Enforcement.md`** (ESLint boundaries por módulo; **Steiger no aplica**).
- **Reubicaciones clave:** `views/`→`modules/<x>/*Page.vue`; `stores/`→`modules/<x>/store.ts`; `services/api`→`shared/api/client.ts`; UI kit→`shared/ui`; `utils/stock`→`modules/insumos/stock.ts`; `login`→`modules/auth`, vista pública de presupuesto→`modules/presupuestos`; singletons de orquestación (`useEditorMode`/`useCreateTrigger`)→`shared/lib` (los consumen módulos, así que **no** pueden ir a `app`).
- **Convenciones nuevas:** C13 (árbol de decisión), C14 (barrels), C15 (regla de dependencia + cross-module por barrel), C16 (enforcement).
- **DIP reforzado por construcción:** la UI de un módulo no importa `shared/api`; pasa por su `store.ts`/`api.ts`.
- **DRY como principio rector (C17):** se revierte la duplicación de `CategoriaPills`/`CategoriaDeleteDialog` — son presentacionales puros (sin store/api) → **una** copia en `shared/ui`. Solo el *dominio* de categorías (CRUD/endpoints) sigue en el store/api de cada módulo. Corrige la decisión previa de duplicar (basada en suponer, erróneamente, que los componentes conocían el dominio).
- **Correcciones de auditoría de consistencia (rev.2):** (1) **`useEditorMode`/`useCreateTrigger` y `EDITOR_STATUS_SLOT_ID` → `shared/lib`** (no `app/state`/`app/shell`): los consumen módulos y `modules` no puede importar `app`; `app/state` se elimina. (2) **`main.css`** en `app/styles` corrige el `@import` del `components.css` legacy a ruta relativa (`../../assets/css/...`) hasta G7. (3) **`stock.ts`** unificado a `modules/insumos/stock.ts` en C8/G5.4/G6.5/G3.6 (estaba como `utils/stock.ts`). (4) **`CategoriaPills`/`Dialog`** propagado a G5.3/G5.4 (`shared/ui` + `allLabel`, no `variant`). (5) **vista pública** unificada a `modules/presupuestos/public-api.ts` (C4 + changelog; antes 3 nombres). (6) **G7.2** ahora instala ESLint desde cero (no existía en `package.json`).
- **Integración Epic D (archivos que el inventario original no contemplaba):** `usePagination` → `shared/lib` (G1.4); `Pagination.vue` → `shared/ui` (G3.13); `useGlobalSearch` → nuevo `modules/search/` con `search-api.ts` (deja de tocar `services/api` directo) (G3.14). Documentada también la ubicación de assets/config/tests (ver "Ubicación modular por archivo").

## Orden de construcción corregido (gobierna la ejecución)

El número de grupo es **temático**; este es el orden real de implementación:

0. **G0.0** — scaffolding modular (`app/ shared/ modules/`, mover arranque) — **antes que todo** (`G0_00_Estructura_Modular.md`).
1. **G0** — fundación (`main.css` `@theme` + tokens) → escribe en `app/styles`.
2. **G1** — datos/utils: `shared/lib/format.ts`, `modules/insumos/stock.ts`, stores→`modules/<x>/store.ts` (absorben `del()`), `services/api`→`shared/api`.
3. **`G3_01` BaseButton** — ⚠️ adelantado: primitivo hoja que consumen `ConfirmDialog`/`DrawerShell`.
4. **Resto de G2** — primitivos (ToggleSwitch, PageHead, SegmentedControl, Floating*, ConfirmDialog, ToastContainer, DrawerShell).
5. **Resto de G3** — StatusBadge, BaseCard, BaseKpi, DataTable, StockBar, RowActions, **FilterChips**, **OverlayShell**, shell (Sidebar/Header/App).
6. **G4** — medianos.
7. **G5** — vistas (piloto: InsumosView). **Checkpoint PDF tras G4.3, antes de G5.8.**
8. **G6** — pesados.
9. **G7** — limpieza.

## Cómo usar esta documentación

1. Seguir el **orden de construcción corregido** (arriba).
2. Antes de tocar un archivo, abrir **solo su doc** (`Gx_yy_*.md`) y seguir el plan paso a paso.
3. Tras terminar: `vue-tsc`, comparar visual con el prototipo, marcar estado en la tabla.
4. Un archivo migrado = idealmente un commit lógico.

## Estado de cada archivo

Leyenda: ⬜ pendiente · 🟦 en curso · ✅ hecho · 🔎 verificado (typecheck + visual)

| Orden | Doc | Archivo | Tipo | Estado |
|---|---|---|---|---|
| — | `01_Indice_y_Seguimiento.md` | (este) | — | — |
| — | `00_Arquitectura_Modular.md` | (arquitectura) | — | — |
| **G0.0** | `G0_00_Estructura_Modular.md` | scaffolding `app/ shared/ modules/` + arranque | crear (**primero**) | ⬜ |
| G0.1 | `G0_01_main-css.md` | `assets/css/main.css` → `app/styles/main.css` | migrar | ⬜ |
| G0.2 | `G0_02_tokens-css.md` | `assets/css/tokens.css` | migrar→borrar | ⬜ |
| G1.1 | `G1_01_utils-format.md` | `utils/format.ts` | crear | ⬜ |
| G1.2 | `G1_02_stock-util.md` | `utils/stock.ts` → `modules/insumos/stock.ts` | crear | ⬜ |
| G1.3 | `G1_03_stores-dip-del.md` | `stores/{insumos,productos,clientes,finanzas,presupuestos}.ts` | migrar | ⬜ |
| G1.4 | `G1_04_usePagination.md` | `composables/usePagination.ts` → `shared/lib/usePagination.ts` | migrar | ⬜ |
| **G3.1** | `G3_01_BaseButton.md` | `components/ui/BaseButton.vue` | crear (**build primero**) | ⬜ |
| G2.1 | `G2_01_ToggleSwitch.md` | `components/ui/ToggleSwitch.vue` | migrar | ⬜ |
| G2.2 | `G2_02_PageHead.md` | `components/layout/PageHead.vue` | migrar | ⬜ |
| G2.3 | `G2_03_SegmentedControl.md` | `components/ui/SegmentedControl.vue` | migrar | ⬜ |
| G2.4 | `G2_04_FloatingField.md` | `components/ui/FloatingField.vue` | migrar | ⬜ |
| G2.5 | `G2_05_FloatingSelect.md` | `components/ui/FloatingSelect.vue` | migrar | ⬜ |
| G2.6 | `G2_06_ConfirmDialog.md` | `components/ui/ConfirmDialog.vue` | migrar | ⬜ |
| G2.7 | `G2_07_ToastContainer.md` | `components/ui/ToastContainer.vue` | migrar | ⬜ |
| G2.8 | `G2_08_DrawerShell.md` | `components/ui/DrawerShell.vue` | migrar | ⬜ |
| G3.2 | `G3_02_StatusBadge.md` | `components/ui/StatusBadge.vue` | crear | ⬜ |
| G3.3 | `G3_03_BaseCard.md` | `components/ui/BaseCard.vue` | crear | ⬜ |
| G3.4 | `G3_04_BaseKpi.md` | `components/ui/BaseKpi.vue` | crear | ⬜ |
| G3.5 | `G3_05_DataTable.md` | `components/ui/DataTable.vue` | crear | ⬜ |
| G3.6 | `G3_06_StockBar.md` | `components/ui/StockBar.vue` | crear | ⬜ |
| G3.7 | `G3_07_RowActions.md` | `components/ui/RowActions.vue` | crear | ⬜ |
| G3.8 | `G3_08_TheSidebar.md` | `components/layout/TheSidebar.vue` | migrar | ⬜ |
| G3.9 | `G3_09_AppHeader.md` | `components/layout/AppHeader.vue` | migrar | ⬜ |
| G3.10 | `G3_10_App.md` | `App.vue` | migrar | ⬜ |
| G3.11 | `G3_11_FilterChips.md` | `components/ui/FilterChips.vue` | crear | ⬜ |
| G3.12 | `G3_12_OverlayShell.md` | `components/ui/OverlayShell.vue` | crear | ⬜ |
| G3.13 | `G3_13_Pagination.md` | `components/ui/Pagination.vue` → `shared/ui/Pagination.vue` | migrar | ⬜ |
| G3.14 | `G3_14_GlobalSearch.md` | `composables/useGlobalSearch.ts` → `modules/search/` | migrar | ⬜ |
| G4.1 | `G4_01_CategoriaPills.md` | `components/ui/CategoriaPills.vue` → `shared/ui/` (una copia) | migrar | ⬜ |
| G4.2 | `G4_02_CategoriaDeleteDialog.md` | `components/ui/CategoriaDeleteDialog.vue` → `shared/ui/` (una copia) | migrar | ⬜ |
| G4.3 | `G4_03_PresupuestoDoc.md` | `components/presupuestos/PresupuestoDoc.vue` | migrar | ⬜ |
| — | **Checkpoint PDF/Puppeteer** | (verificar tras G4.3, antes de G5.8) | gate | ⬜ |
| G5.1 | `G5_01_DashboardView.md` | `views/DashboardView.vue` | migrar | ⬜ |
| G5.2 | `G5_02_ClientesView.md` | `views/ClientesView.vue` | migrar | ⬜ |
| G5.3 | `G5_03_ProductosView.md` | `views/ProductosView.vue` | migrar | ⬜ |
| G5.4 | `G5_04_InsumosView.md` | `views/InsumosView.vue` | migrar (piloto) | ⬜ |
| G5.5 | `G5_05_PresupuestosView.md` | `views/PresupuestosView.vue` | migrar | ⬜ |
| G5.6 | `G5_06_FinanzasView.md` | `views/FinanzasView.vue` | migrar | ⬜ |
| G5.7 | `G5_07_LoginView.md` | `features/auth/LoginView.vue` | migrar | ⬜ |
| G5.8 | `G5_08_PublicPresupuestoView.md` | `features/public/PublicPresupuestoView.vue` | migrar | ⬜ |
| G5.9 | `G5_09_AjustesView.md` | `views/AjustesView.vue` (+ `stores/ajustes.ts` **nuevo**) | migrar+crear | ⬜ |
| G6.1 | `G6_01_ClienteDrawer.md` | `components/drawers/ClienteDrawer.vue` | migrar | ⬜ |
| G6.2 | `G6_02_MovimientoDrawer.md` | `components/drawers/MovimientoDrawer.vue` | migrar | ⬜ |
| G6.3 | `G6_03_ImprentaDrawer.md` | `components/drawers/ImprentaDrawer.vue` | migrar | ⬜ |
| G6.4 | `G6_04_ProductoDetalle.md` | `components/overlays/ProductoDetalle.vue` | migrar | ⬜ |
| G6.5 | `G6_05_InsumoDetalle.md` | `components/overlays/InsumoDetalle.vue` | migrar | ⬜ |
| G6.6 | `G6_06_PresupuestoEditor.md` | `components/editors/PresupuestoEditor.vue` | migrar | ⬜ |
| G7.1 | `G7_01_Limpieza-Final.md` | `components.css`, `tokens.css`, `style.css` | borrar | ⬜ |
| **G7.2** | `G7_02_Enforcement.md` | instalar ESLint (no existe) + boundaries por módulo + barrido imports profundos | instalar+configurar | ⬜ |

---

## Convenciones compartidas (referenciadas por todos los docs)

### C1 — Tokens en `@theme` (Tailwind v4)
Los tokens de `tokens.css` se definen en `@theme` dentro de `main.css`. Tailwind genera utilidades a partir del prefijo del token:

| Token actual (`var(--x)`) | Definición `@theme` | Utilidades generadas |
|---|---|---|
| `--violet-700` | `--color-violet-700` | `bg-violet-700`, `text-violet-700`, `border-violet-700` |
| `--teal-500` | `--color-teal-500` | `bg-teal-500`, `text-teal-500`, … |
| `--coral-500` | `--color-coral-500` | idem |
| `--ink`, `--ink-muted` | `--color-ink`, `--color-ink-muted` | `text-ink`, `text-ink-muted` |
| `--page-bg`, `--surface` | `--color-page-bg`, `--color-surface` | `bg-page-bg`, `bg-surface` |
| `--border`, `--border-strong` | `--color-border`, `--color-border-strong` | `border-border` |
| pasteles (`--lavender`, `--mint`, `--yellow`, `--orange-*`…) | `--color-*` | `bg-lavender`, `bg-orange-50`, etc. |
| `--r-sm/md/lg/xl/pill` | `--radius-sm/md/lg/xl/pill` | `rounded-md`, `rounded-lg`, `rounded-pill` |
| `--shadow-1/2/pop` | `--shadow-1/2/pop` | `shadow-1`, `shadow-2`, `shadow-pop` |
| `--font-sans` (Onest) | `--font-sans` | `font-sans` (default del body) |
| escala `--fs-12…48` | `--text-12…48` | `text-12`, `text-14`, … |

### C2 — Espaciado (grid 4px = escala default Tailwind)
No se crea escala custom. `--s-1`=4px→`1` · `--s-2`→`2` · `--s-4`=16px→`4` · `--s-6`→`6` · `--s-8`=32px→`8` … Ej.: `padding: var(--s-6)` → `p-6`.

### C3 — Variantes con mapa de estrategia (OCP)
Nunca `if/else` ni concatenación para variantes. Patrón:
```ts
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-teal-500 text-white hover:brightness-95',
  secondary: 'bg-surface border border-border-strong text-ink',
  ghost: 'bg-transparent text-violet-700 hover:bg-violet-50',
  danger: 'bg-coral-500 text-white',
}
// uso: :class="VARIANTS[variant]"
```

### C4 — DIP (acceso a datos)
Componentes y vistas **no importan `services/api`**. El store es el único que conoce el API. La vista pública (G5.8) usa **`modules/presupuestos/public-api.ts`** (no `ofetch` crudo; nombre canónico — antes citado como `services/public.ts`). Ver C15 (DIP por construcción reemplaza/realiza este punto en la arquitectura modular).

### C5 — Vue idiomático
`<script setup lang="ts">`, props tipadas, `defineModel()` para v-model, `defineEmits<…>()`. Componentes presentacionales sin fetch propio. A11y existente intacta.

### C6 — Excepción de `<style scoped>`
Solo animaciones irreductibles: wave del label (`FloatingField`/`FloatingSelect`), transiciones `drawer`/`toast`/`confirm`/`overlay`, `card-appear` (login), `aj-grow`, `@page`/`@media print` (vista pública). Todo lo demás → utilidades.

### C7 — Verificación por archivo
- `cd web && npx vue-tsc -b` sin errores.
- `npm run dev` → comparar con `docs/MVP/design-system/project/ui_kits/presumemi/index.html` (pixel-perfect).
- Si el archivo tiene test (`ConfirmDialog`), mantener API y test verde.

### C8 — Modelo único de semáforo de stock (rev.1; ruta rev.2)
Fuente única en **`modules/insumos/stock.ts`** (es dominio insumo; se consume vía barrel `@/modules/insumos`). **Modelo canónico de 4 niveles** (el de `InsumoDetalle`):
`sin_unidades` (stock=0) · `critico` (stock ≤ min·0.2) · `bajo` (stock < min) · `ok`.
- `getNivel(stock, minimo): Nivel` puro; `NIVEL_META: Record<Nivel,{ label; tone }>` con `tone` semántico (no color crudo).
- `InsumosPage` (lista) puede **colapsar** `sin_unidades`→`critico` si la UI de la tabla solo maneja 3 chips, vía un helper `nivelColapsado()`.
- ⚠️ **Decisión a confirmar con producto:** hoy `InsumosView` usa umbral `0.5` y `InsumoDetalle` `0.2`. Se adopta `0.2` (más granular) como canónico; es un cambio de comportamiento menor en la lista — validar visualmente en el piloto (G5.4).

### C9 — Tokens a agregar/remapear en G0 (rev.1)
`ToastContainer` usa `--teal-600`/`--violet-600` que **no existen** (hoy resuelven a color heredado). En G0.1: agregarlos a `@theme` **o** remapear a `teal-700`/`violet-700`. `--orange-*` ya existen en `tokens.css`.

### C10 — Convención de error handling (rev.1)
- El **store** ejecuta la operación y **re-lanza** el error (no lo traga).
- La **vista** envuelve en `try/catch` y muestra el `toast` (decide la UX).
- **No** se introduce `useAsyncAction` todavía (la duplicación es de ~3 líneas; aplica YAGNI / Regla de Tres). Reconsiderar solo si tras el piloto la repetición molesta.

### C11 — Contrato del Teleport del badge de estado (rev.1; ubicación corregida rev.2)
El id `#editor-header-status` (destino en `AppHeader` de `app/shell`, origen en `PresupuestoEditor` de `modules/presupuestos`) se define como **constante compartida** (`const EDITOR_STATUS_SLOT_ID = 'editor-header-status'`) importada por ambos. **Vive en `shared/lib`** (junto a `editorMode.ts`), **no** en `AppHeader`: como la importa un módulo y `modules` no puede importar `app`, ubicarla en `app/shell` violaría la regla de dependencia (mismo motivo que los singletons de orquestación). Documentar en G3.9 y G6.6.

### C12 — Audit de catálogos duplicados (rev.1)
Antes de migrar G5/G6, barrido de catálogos repetidos para centralizarlos en `utils/`:
- `statusTones` + `TRANSITIONS` (Dashboard, PresupuestosView, PresupuestoEditor) → `utils/presupuestoEstado.ts` (**con test** de `getAvailableTransitions`).
- `tipoMovs` (FinanzasView, MovimientoDrawer) → `modules/finanzas/tipos.ts`.
- Revisar también: `cuentas`, `metodosPago`, `canalLabels`/`canalColors`, `MONEDAS`, `tipoHoja` default.

### C13 — Árbol de decisión de ubicación (rev.2)
Primer "sí" gana: (1) ¿genérico sin negocio? → `shared`. (2) ¿arranque/shell/router/estilos/estado global? → `app`. (3) ¿pertenece a un dominio? → `modules/<dominio>` (segmento: UI, `store`, `api`, regla `<dominio>.ts`, `types`, `schema`). (4) ¿cruza varios dominios con datos/agregación propia? → módulo propio (ej. `dashboard`, `search`). Detalle en `00_Arquitectura_Modular.md`. **Nota:** las categorías **no** son módulo propio — su *dominio* (store/api) vive en `insumos`/`productos`, pero los *componentes* `CategoriaPills`/`CategoriaDeleteDialog` (presentacionales puros) viven una sola vez en `shared/ui` (DRY).

### C14 — Public API por barrel (rev.2)
Cada `modules/<x>/index.ts` exporta la API pública del módulo; se consume **solo** por el barrel (`@/modules/insumos`), nunca por path profundo (`@/modules/insumos/store`). `shared` se consume por segmento (`@/shared/ui`, `@/shared/lib`).

### C15 — Regla de dependencia (rev.2)
`app → modules → shared` (nunca al revés). **Cross-module solo por barrel** (`presupuestos`→`@/modules/clientes`). La **UI de un módulo no importa `shared/api`**; el dato pasa por `store.ts`/`api.ts` del módulo → DIP por construcción. (Reemplaza/realiza C4.)

### C17 — DRY como principio rector (rev.2)
Cada conocimiento (UI, regla, catálogo, tipo, estilo) tiene **una sola** representación canónica. Antes de duplicar, clasificar: ¿es *conocimiento de dominio*? → su módulo. ¿es *forma reutilizable sin dominio* (componente presentacional puro, util genérico)? → `shared`, **una** copia, aunque hoy lo usen varios dominios. Solo se admite duplicación cuando dos piezas se parecen *por coincidencia* y evolucionarán por separado (falso DRY). La "Regla de Tres" frena abstracciones especulativas; **no** habilita conservar duplicación literal ya existente. Materializaciones en el plan: semáforo único (C8), catálogos centralizados (C12), shells reutilizados (`Drawer/Overlay/ConfirmDialog`), `format`/`useDirty`/`useToast` en `shared/lib`, y `CategoriaPills`/`CategoriaDeleteDialog` **no duplicados** (a `shared/ui`).

### C16 — Enforcement (rev.2)
`eslint-plugin-boundaries` / `no-restricted-imports` configurados por módulo (G7.2): prohíben import hacia arriba, lateral por path profundo, y `shared/api` desde UI de módulo. **Steiger no aplica** (es de capas FSD). Correr en CI junto a `vue-tsc`.

---

## Ubicación modular por archivo (vista de cohesión)

> Qué docs/archivos viven en cada módulo. Para "ver todo lo de insumos", mirá `modules/insumos/`.

**`app/`** — arranque + shell + glue (no-dominio)
- `app/styles/main.css` ← G0.1 · `app/App.vue` ← G3.10 · `app/router.ts` + `app/pinia.ts` ← (router actual)
- `app/shell/AppSidebar.vue` ← G3.8 · `app/shell/AppHeader.vue` ← G3.9
- _(no hay `app/state`: los singletons de orquestación van a `shared/lib` — los consumen módulos y `app` no puede ser importado por módulos)_

**`shared/ui/`** — UI kit sin dominio
- G3.1 BaseButton · G3.2 StatusBadge · G3.3 BaseCard · G3.4 BaseKpi · G3.5 DataTable · G3.7 RowActions · G3.11 FilterChips · G3.12 OverlayShell · G3.13 Pagination
- G2.1 ToggleSwitch · G2.2 PageHead · G2.3 SegmentedControl · G2.4 FloatingField · G2.5 FloatingSelect · G2.6 ConfirmDialog · G2.7 ToastContainer · G2.8 DrawerShell
- G4.1 CategoriaPills · G4.2 CategoriaDeleteDialog _(presentacionales puros sin dominio — una sola copia, la consumen insumos y productos)_

**`shared/lib|api|config/`**
- `shared/lib/format.ts` ← G1.1 · `shared/lib/{useToast,useDirty,usePagination}` · `shared/lib/{editorMode,createTrigger}.ts` ← `composables/use{EditorMode,CreateTrigger}` (singletons de orquestación transversal; deuda de naturaleza event-bus anotada) · `shared/api/client.ts` ← `services/api` · `shared/config/` ← tipos genéricos de `types/index.ts`

**`modules/insumos/`** — InsumosPage ← G5.4 · InsumoDetalle ← G6.5 · components/{StockBar ← G3.6, ProveedoresEditor, InsumosTable} · `stock.ts` ← G1.2 · `store.ts` ← G1.3(insumos, incluye CRUD categorías insumo) · `api.ts` (requests insumo + categorías insumo) · `costeo.ts` (useInsumoCosteo) · schema · _(usa `CategoriaPills`/`CategoriaDeleteDialog` de `shared/ui`)_
**`modules/productos/`** — ProductosPage ← G5.3 · ProductoDetalle ← G6.4 · components/{ProductCard, BomEditor} · `pricing.ts` (useProductoPricing) · `store.ts` ← G1.3(productos, incluye CRUD categorías producto) · schema · _(usa `CategoriaPills`/`CategoriaDeleteDialog` de `shared/ui`)_
**`modules/clientes/`** — ClientesPage ← G5.2 · ClienteDrawer ← G6.1 · components/{Avatar, ContactosEditor} · `store.ts` ← G1.3(clientes) · schema
**`modules/presupuestos/`** — PresupuestosPage ← G5.5 · PresupuestoEditor ← G6.6 · PresupuestoDoc ← G4.3 · PublicPresupuestoPage ← G5.8 · `public-api.ts` (fetch público para Puppeteer) · `estado.ts` (FSM + `Record<Estado,Tone>`) · `calc.ts` (usePresupuestoCalc) · components/{LinesSpreadsheet, EstadoDropdown, EditorTotals} · `store.ts` ← G1.3(presupuestos) · schema
**`modules/finanzas/`** — FinanzasPage ← G5.6 · MovimientoDrawer ← G6.2 · ImprentaDrawer ← G6.3 · components/{FinTabs, SignedAmountInput} · `tipos.ts` (catálogo movimientos) · `store.ts` ← G1.3(finanzas) · schema
**`modules/ajustes/`** — AjustesPage ← G5.9 · components/SettingsBlock · `store.ts` (**nuevo**)
**`modules/dashboard/`** — DashboardPage ← G5.1 · components/WeeklyChart · `stats-api.ts` ← `services/dashboard` (lógica de agregación propia, no solo orquestación)
**`modules/search/`** — `useGlobalSearch` ← G3.14 · `search-api.ts` (← deja de usar `services/api` directo) · `types.ts` (`SearchResult`) · index. Lo consume `app/shell/AppHeader` vía barrel (único caso `app`→`module`)
**`modules/auth/`** — LoginPage ← G5.7 · session-store

**`shared` (ampliado):** `shared/ui/Pagination.vue` ← G3.13 · `shared/lib/usePagination.ts` ← G1.4 (paginación client-side genérica, sin dominio)

**Assets / config / tests:** `index.html` → entry `/src/app/main.ts` (G0.0) · `vitest.config.ts` + `src/test/setup.ts` se quedan en su sitio · tests **co-localizados** (`__tests__/` junto al componente o dentro del módulo) · `assets/hero.png` → `modules/auth` o `public/` · `vite.svg`/`vue.svg` muertos → borrar en G7

**Nota sobre categorías (DRY):** No existe módulo `categorias/`. El **dominio** de categorías (CRUD + endpoints) vive en el store/api de cada módulo (`insumos`, `productos`) — son entidades distintas con su propio backend. Pero los **componentes** `CategoriaPills`/`CategoriaDeleteDialog` son **presentacionales puros** (props + emits, sin store/api) → viven **una sola vez** en `shared/ui`; **no se duplican**. Cada página los instancia con las categorías de su store. Detalle en `00_Arquitectura_Modular.md` §5.

**Cross-cutting:** G0.0 (scaffolding) · G7.1 (limpieza CSS + carpetas legacy) · G7.2 (enforcement).
