# Auditoría de la refactorización — desviaciones respecto del plan

> Revisión del estado real de `web/src/` contra el plan modular documentado en
> [`00_Arquitectura_Modular.md`](00_Arquitectura_Modular.md) y
> [`01_Indice_y_Seguimiento.md`](01_Indice_y_Seguimiento.md).
> Base de comparación: rama `claude/quizzical-hopper-c88742` vs `master`
> (commit de refactor: `862269b` "Primer prueba refactorizacion").

## Veredicto

La refactorización aplicó **bien la fase estructural** (creación de carpetas, `shared/ui`,
`shared/lib`, DRY de categorías, limpieza CSS), pero **quedó a medio camino**: es en gran
parte un *"mover de lugar"* de archivos, no el refactor modular/SOLID que describe el plan.
Las **invariantes que daban valor al refactor** (DIP por construcción, capa `api.ts`,
descomposición de componentes pesados, barrels reales, enforcement) **no se cumplieron**.

Equivalencia aproximada con el plan: **G0–G4 mayormente hechos; G5/G6/G7 incompletos o salteados**.

---

## Lo que sí se aplicó correctamente

| Ítem | Estado |
|---|---|
| Esqueleto `app/ + shared/ + modules/<dominio>/` (G0.0) | ✅ |
| `shared/ui` con todos los primitivos (BaseButton, DataTable, OverlayShell, FilterChips, StatusBadge, BaseCard, BaseKpi, RowActions, etc.) | ✅ |
| `shared/lib` (`format`, `useDirty`, `useToast`, `usePagination`, `editorMode`, `createTrigger`) — ubicación correcta (C11/rev.2) | ✅ |
| DRY de categorías (C17): `CategoriaPills`/`CategoriaDeleteDialog` en **una** copia en `shared/ui` | ✅ |
| `modules/insumos/stock.ts` con test co-localizado | ✅ |
| `modules/search/` propio con `search-api.ts` + `types.ts` (ya no toca `services/api`) | ✅ |
| `shared/api/client.ts` único punto con `ofetch`; sin imports a `@/services`, `@/views`, `@/components`, `@/composables` | ✅ |
| Limpieza CSS (G7.1): `style.css`, `components.css`, `tokens.css` legacy borrados; `main.css` con `@theme` sin `@import` legacy | ✅ |

---

## Desviaciones detectadas

### P1 — Invariante DIP rota (CRÍTICO)
**Plan:** C4 / C15 / invariante #3 — *"la UI de un módulo no importa `shared/api`; el dato pasa por `store.ts`/`api.ts`"*.
**Realidad:** 9 componentes/páginas importan `@/shared/api/client` directamente y hacen `get/post/put/del/patch`:

- `modules/clientes/components/ClienteDrawer.vue`
- `modules/finanzas/components/ImprentaDrawer.vue`
- `modules/finanzas/components/MovimientoDrawer.vue`
- `modules/insumos/components/InsumoDetalle.vue`
- `modules/productos/components/ProductoDetalle.vue`
- `modules/presupuestos/components/PresupuestoEditor.vue`
- `modules/dashboard/DashboardPage.vue`
- `modules/presupuestos/PresupuestosPage.vue`
- `modules/productos/ProductosPage.vue`

**Impacto:** se pierde el objetivo principal del refactor (desacoplar la UI del acceso a datos). Es el punto de mayor prioridad.

### P2 — No existe ningún `api.ts` de módulo (CRÍTICO, causa raíz de P1)
**Plan:** cada `modules/<x>/api.ts` encapsula los requests del dominio sobre `shared/api/client`.
**Realidad:** no se creó ninguno. Stores y UI llaman a `shared/api` directo. Sin esta capa, P1 no se puede cerrar.

### P3 — Componentes pesados nunca se descompusieron (G6 incompleto)
**Plan:** subcomponentes en `modules/<x>/components/`.
**Realidad:** faltan **todos** los siguientes:

| Módulo | Subcomponentes faltantes |
|---|---|
| clientes | `Avatar`, `ContactosEditor` |
| productos | `ProductCard`, `BomEditor` |
| presupuestos | `LinesSpreadsheet`, `EditorTotals`, `EstadoDropdown` |
| finanzas | `FinTabs`, `SignedAmountInput` |
| ajustes | `SettingsBlock` |
| dashboard | `WeeklyChart` |

Las vistas grandes siguen siendo monolíticas (solo se renombraron `*View.vue` → `*Page.vue`).

### P4 — Reglas/catálogos de dominio no centralizados (C12)
**Plan:** extraer reglas puras y catálogos a archivos de dominio (con tests donde aplica).
**Realidad:** solo sobrevivió `insumos/stock.ts`. Faltan:

- `presupuestos/estado.ts` (FSM + `Record<Estado,Tone>`, **con test** de `getAvailableTransitions`)
- `presupuestos/calc.ts` · `presupuestos/public-api.ts` (fetch público Puppeteer, G5.8)
- `productos/pricing.ts` · `insumos/costeo.ts` · `finanzas/tipos.ts` (catálogo de movimientos)

### P5 — Barrels incompletos y violación de path profundo (C14 / invariantes #4–5)
- Faltan `index.ts` en `modules/ajustes`, `modules/auth`, `modules/dashboard`.
- Los barrels existentes son mínimos (casi solo el store).
- **Violación cross-module por path profundo** en `modules/dashboard/DashboardPage.vue`:
  ```
  import { useClientesStore } from '@/modules/clientes/store'
  import { useFinanzasStore } from '@/modules/finanzas/store'
  import { useInsumosStore } from '@/modules/insumos/store'
  import { usePresupuestosStore } from '@/modules/presupuestos/store'
  import { useProductosStore } from '@/modules/productos/store'
  import StockBar from '@/modules/insumos/components/StockBar.vue'
  ```
  C15 exige consumir por barrel (`@/modules/clientes`), nunca por `@/modules/<x>/store`.

### P6 — Migración de `stores/` sin terminar
- `web/src/stores/` sigue existiendo: 6 archivos son shims re-export (`export … from '@/modules/x/store'`).
- **`stores/auth.ts` es el store real todavía** (no migró). El módulo `auth` tiene `LoginPage` pero **no `session-store`** (plan §9).
- `app/App.vue`, `app/router.ts`, `app/shell/AppSidebar.vue` y `modules/auth/LoginPage.vue` siguen importando `@/stores/auth`.
- Los shims son deuda transicional que G7 debía eliminar.

### P7 — `schemas/` y `types/` siguen centralizados
**Plan:** `schema.ts`/`types.ts` por módulo; tipos genéricos a `shared/config`.
**Realidad:** persisten `web/src/schemas/*.ts` y `web/src/types/index.ts` centralizados.

### P8 — Enforcement no implementado (G7.2)
No hay ESLint instalado ni `eslint-plugin-boundaries`/`no-restricted-imports`.
Sin esto, nada impide reincidir en P1 y P5 (de hecho ya ocurrieron).

### P9 — Assets muertos sin borrar (G7)
`src/assets/vite.svg` y `src/assets/vue.svg` (scaffolding de Vite) siguen presentes.

---

## Resumen por grupo del plan

| Grupo | Alcance | Estado |
|---|---|---|
| G0 (scaffolding, tokens `@theme`, CSS) | carpetas + `main.css` | ✅ |
| G1 (format, stores, api, reglas) | format/lib ✅ · **`api.ts` por módulo ❌** · reglas ❌ (salvo stock) | 🟡 parcial |
| G2 (primitivos) | `shared/ui` | ✅ |
| G3 (base + shell) | base ✅ · shell ✅ · **barrels ❌** | 🟡 parcial |
| G4 (CategoriaPills/Dialog, PresupuestoDoc) | DRY categorías ✅ · PresupuestoDoc movido ✅ | ✅ |
| G5 (vistas → Pages) | renombradas ✅ · **DIP ❌ · public-api ❌ · ajustes/auth store ❌** | 🟡 parcial |
| G6 (descomposición pesados) | **no hecho** (monolitos renombrados) | ❌ |
| G7 (limpieza + enforcement) | CSS ✅ · **shims/schemas/types/assets/ESLint ❌** | 🟡 parcial |

---

## Prioridad de cierre sugerida

1. **P2 + P1** — crear `modules/<x>/api.ts` y mover todos los `get/post/put/del` de la UI ahí (mayor impacto arquitectónico).
2. **P5** — completar barrels y eliminar el path profundo en `DashboardPage`.
3. **P6 + P7** — migrar `auth` a `session-store`, borrar shims de `stores/`, mover `schemas`/`types` a sus módulos / `shared/config`.
4. **P4** — extraer FSM/calc/pricing/costeo/tipos + `public-api.ts` (con tests).
5. **P3** — descomponer componentes pesados (G6).
6. **P8 + P9** — instalar ESLint boundaries (cierra la puerta a reincidencias) y borrar assets muertos.

> **Pendiente de verificación:** no se pudo correr `vue-tsc -b` en el worktree (faltan `node_modules`:
> errores de `vite/client` y `node`, ajenos al refactor). Ejecutar `npm install` + typecheck antes de commit.
