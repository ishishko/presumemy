# Arquitectura del frontend `web/` — Modular por dominio

> Fuente de verdad de la arquitectura de carpetas del refactor. Acompaña a `00_Plan_Refactor_Completo.md` y al índice `01_Indice_y_Seguimiento.md`.
> Se partió de una adaptación de **Feature-Sliced Design**, pero se descartó su partición por capas porque dispersaba cada dominio en 3-4 carpetas. Se adopta una estructura **modular por dominio** (package-by-feature) que conserva las invariantes valiosas de FSD pero prioriza la **cohesión**: todo lo de un dominio en una sola carpeta.

---

## 1. Postura

- **DRY (Don't Repeat Yourself) es principio rector.** Cada pieza de conocimiento —UI, regla de negocio, catálogo, tipo, estilo— tiene **una sola representación canónica**. Antes de duplicar, se pregunta: ¿esto es *conocimiento de dominio* (vive en su módulo) o *forma reutilizable sin dominio* (vive en `shared`)? La duplicación solo se acepta cuando dos cosas se *parecen hoy por coincidencia* pero evolucionan por separado (falso DRY); nunca para esquivar una ubicación incómoda.
- **Cohesión por dominio primero.** Para tocar "insumos" se abre **una** carpeta (`modules/insumos/`), no varias.
- **Cómo se resuelve la tensión DRY ↔ cohesión:** un componente **presentacional puro** (recibe props, emite eventos, no importa store/api) es *forma sin dominio* aunque hoy lo usen dos dominios → va a `shared/ui`, **una** copia. El *conocimiento de dominio* que lo alimenta (store, api, reglas) vive en cada módulo. Así no se duplica la forma ni se mete dominio en `shared`. (Caso real: `CategoriaPills`/`CategoriaDeleteDialog` — ver §5.)
- **pages-first + Regla de Tres + YAGNI** (alineado con el plan de refactor): el código vive lo más cerca de su uso posible; se baja a `shared` solo cuando el reuso real lo justifica. **Matiz DRY:** "Regla de Tres" aplica a *abstracciones especulativas*, no a duplicación literal ya existente — si dos copias idénticas ya existen y no tienen dominio, se unifican aunque sean solo dos.
- Las **invariantes** que sí se conservan de FSD (ver §4) son no-negociables; el resto se relaja a propósito (ver §7).

## 2. Estructura objetivo de `web/src/`

```
web/src/
├── app/        # arranque + shell + glue global (NO-dominio)
│   ├── main.ts · App.vue
│   ├── router.ts · pinia.ts
│   ├── styles/main.css            (@theme + @layer base)
│   └── shell/   AppSidebar.vue · AppHeader.vue
│
├── shared/     # SIN dominio, reutilizable por cualquier módulo (app Y modules)
│   ├── ui/     BaseButton, BaseCard, BaseKpi, StatusBadge, DataTable, RowActions,
│   │           FilterChips, ConfirmDialog, DrawerShell, OverlayShell, ToggleSwitch,
│   │           SegmentedControl, FloatingField, FloatingSelect, ToastContainer, PageHead, Pagination,
│   │           CategoriaPills, CategoriaDeleteDialog   (presentacionales puros sin dominio)
│   ├── lib/    format.ts (formatMoney/formatDate) · useToast · useDirty · usePagination
│   │           · editorMode.ts · createTrigger.ts   (singletons de orquestación transversal — los consumen app/shell Y modules)
│   ├── api/    client.ts (ofetch — ÚNICO que lo conoce)
│   └── config/ tipos genéricos (PaginationResult…) · env
│
└── modules/    # UN dominio = UNA carpeta autocontenida (barrel index.ts)
    ├── insumos/
    │   ├── InsumosPage.vue                 (pantalla ruteada — orquesta CategoriaPills de shared/ui con su store)
    │   ├── InsumoDetalle.vue               (overlay)
    │   ├── components/{StockBar,ProveedoresEditor,InsumosTable}.vue
    │   ├── store.ts                        (pinia — incluye CRUD categorías de insumo)
    │   ├── api.ts                          (requests insumo + categorías insumo → usa shared/api)
    │   ├── stock.ts                        (getNivel/NIVEL_META · 4 niveles)
    │   ├── costeo.ts                       (useInsumoCosteo)
    │   ├── types.ts · schema.ts            (zod)
    │   └── index.ts                        (barrel = API pública)
    ├── productos/    Page · ProductoDetalle · components/{ProductCard,BomEditor} · store (incluye CRUD categorías) · api · pricing · types · schema · index
    ├── clientes/     Page · ClienteDrawer · components/{Avatar,ContactosEditor} · store · api · types · schema · index
    ├── presupuestos/ Page · PresupuestoEditor · PresupuestoDoc · PublicPresupuestoPage (vista pública) · components/{LinesSpreadsheet,EditorTotals,EstadoDropdown}
    │                 · store · api · public-api.ts (fetch público para Puppeteer) · estado.ts (FSM + Record<Estado,Tone>) · calc.ts · types · schema · index
    ├── finanzas/     Page · {Movimiento,Imprenta}Drawer · components/{FinTabs,SignedAmountInput} · store · api · tipos.ts (catálogo) · schema · index
    ├── ajustes/      Page · components/SettingsBlock · store · api · index
    ├── dashboard/    Page · components/WeeklyChart · stats-api.ts · index
    ├── search/       useGlobalSearch · search-api.ts · types (SearchResult) · index   (lo consume app/shell/AppHeader)
    └── auth/         LoginPage · session-store · index
```

> **Assets, config y tests** (no entran en la jerarquía de dominios):
> - **Estáticos:** `assets/hero.png` (hero del login) acompaña a su único consumidor → `modules/auth/` (o `public/` si se sirve sin bundling). `vite.svg`/`vue.svg` son scaffolding muerto de Vite → se borran en G7. El logo MemyDeni vive en `public/`.
> - **Entry:** `index.html` apunta el módulo a `/src/app/main.ts` (lo actualiza G0.0).
> - **Tests:** `vitest.config.ts` y `src/test/setup.ts` se quedan donde están (raíz de `web/` y `src/test/`); el `setupFiles` no cambia. Los tests **co-localizan** con su sujeto: `__tests__/` junto al componente en `shared/ui/` o dentro del módulo (ej. `modules/insumos/__tests__/stock.test.ts`). Ningún test vive en una carpeta `tests/` central de dominio.

## 3. Segmentos dentro de un módulo

Un módulo se organiza por **propósito técnico** (nombres que describen el propósito, no la esencia — nada de `helpers/`/`hooks/`):

| Archivo/carpeta | Contenido |
|---|---|
| `*Page.vue` / componentes grandes (`*Detalle`, `*Editor`, `*Drawer`) | UI del caso de uso del módulo |
| `components/` | subcomponentes presentacionales del módulo |
| `store.ts` | estado del dominio (Pinia) |
| `api.ts` | requests específicos del módulo (usan `shared/api/client`) |
| `<dominio>.ts` (`stock.ts`, `calc.ts`, `estado.ts`, `pricing.ts`, `costeo.ts`) | reglas de negocio puras / composables de dominio |
| `types.ts` · `schema.ts` | tipos e validación zod del dominio |
| `index.ts` | **barrel**: API pública del módulo |

## 4. Invariantes (no-negociables)

1. **`shared` no conoce el dominio.** Un componente de `shared/ui` importa solo Vue y libs externas. `format`/`useToast`/`useDirty` son transversales sin negocio.
2. **Regla de dependencia:** `app → modules → shared`. Nunca al revés.
3. **DIP por construcción:** la UI de un módulo **no importa `shared/api`/`ofetch`**; el acceso a datos pasa por el `store.ts`/`api.ts` del módulo. (Realiza el objetivo "vistas no tocan services/api" del plan sin depender de disciplina.)
4. **Public API por barrel:** cada módulo expone `index.ts`; se consume **solo** por ahí. Refactorizar el interior del módulo no rompe consumidores.
5. **Cross-module solo por barrel:** un módulo puede importar otro a través de su `index.ts` (`@/modules/clientes`), nunca por path profundo (`@/modules/clientes/store`). Ej. real: `presupuestos` → `clientes` + `productos`. (Las categorías **no** son cross-module: cada módulo tiene su propio store/api de categorías; el componente compartido `CategoriaPills` está en `shared/ui`.)

## 5. Árbol de decisión (dónde va cada cosa)

Primer "sí" gana:
1. ¿Genérico, sin negocio? (botón, input, `formatMoney`, cliente `ofetch`, **singleton de orquestación transversal** como `editorMode`/`createTrigger`) → **`shared`**.
2. ¿Arranque, shell, router/pinia, estilos globales? → **`app`**. ⚠️ **Solo si lo consume *exclusivamente* `app`.** Si un módulo también lo importa, **no puede vivir en `app`** (rompería `app → modules → shared`, porque `modules` no importa `app`) → va a `shared/lib`. Por eso `editorMode`/`createTrigger`, que los consumen vistas/overlays de módulos, están en `shared/lib`, no en `app`.
3. ¿Pertenece a un dominio (insumo, cliente, presupuesto…)? → **`modules/<dominio>`** (en el segmento que corresponda: UI, `store`, `api`, regla, `types`).
4. ¿Es un agregador con lógica de stats/agregación propia? → **módulo propio** (ej. `dashboard` tiene `stats-api.ts` con queries de agregación; no es solo orquestación).

**Nota sobre categorías (DRY):** No hay módulo `categorias/`. El **conocimiento de dominio** de categorías (CRUD, endpoints `/insumos/categorias` y `/productos/categorias`) vive en el `store.ts`/`api.ts` de **cada** módulo (`insumos`, `productos`) — eso es lo cohesivo y correcto, porque son entidades distintas con su propio backend. Pero los **componentes** `CategoriaPills` y `CategoriaDeleteDialog` son **presentacionales puros** (reciben `categorias`/`modelValue` por props, emiten `create`/`rename`/`remove`/`confirm`; no importan store ni api) → son *forma sin dominio* y viven **una sola vez** en `shared/ui`. **No se duplican** (sería violar DRY sin ganar nada). Cada página (`InsumosPage`/`ProductosPage`) los instancia pasándoles las categorías de su propio store y conectando los emits a su CRUD. El prop `variant: 'insumos'|'productos'` (que hoy solo cambia el label "Todas/Todos") se generaliza a `allLabel: string` para borrar hasta el acoplamiento nominal al dominio (ver G4.1).

## 6. Barrels (public API)

```ts
// modules/insumos/index.ts
export { useInsumosStore } from './store'
export { default as StockBar } from './components/StockBar.vue'
export { getNivel, NIVEL_META, type Nivel } from './stock'
export type { Insumo } from './types'
```
```ts
// ✅ consumo correcto
import { useInsumosStore, StockBar } from '@/modules/insumos'
// ❌ path profundo (lo prohíbe el enforcement)
import { useInsumosStore } from '@/modules/insumos/store'
```
`shared` se consume por segmento (`@/shared/ui`, `@/shared/lib`), sin barrel único.

## 7. Qué se conserva / se relaja respecto del marco FSD de origen

| Aspecto FSD | Decisión modular | Motivo |
|---|---|---|
| Capas `entities/widgets/features/pages` separadas | **Colapsadas dentro del módulo** | Cohesión: dominio en una carpeta. |
| `shared` sin dominio | **Se conserva** | UI kit + cliente HTTP reutilizables. |
| Regla de dependencia hacia abajo | **Se conserva** (`app→modules→shared`) | Mantiene DIP por construcción. |
| Public API por barrel | **Se conserva** | Abarata el próximo cambio. |
| No-import lateral entre slices | **Relajado**: cross-module permitido **vía barrel** | Los cruces de dominio (presupuesto↔cliente) son reales; el barrel da disciplina sin dispersión. |
| `features/` lazy | N/A (no hay capa features); el comportamiento reusable se sube a `shared` o a un módulo base por Regla de Tres | — |
| Steiger (linter FSD) | **No aplica**; se usa `eslint-plugin-boundaries` por módulo | El tooling FSD asume capas. |

## 8. Convivencia con el refactor Tailwind/SOLID (Opción A)

La relocalización y el refactor de estilado/componentización son **ortogonales** y se hacen en **una sola pasada**: cuando un Grupo del plan toca un archivo, se escribe **directamente en su destino modular**. Mapeo Grupo → destino:

| Grupo | Destino |
|---|---|
| G0 (tokens `@theme`, base, App, router, scaffolding) | `app/` + esqueleto `shared/`,`modules/` |
| G1 (format, stores, api, reglas) | `shared/lib`, `shared/api/client.ts`, y `store/api/<dominio>.ts` de cada módulo |
| G2 + base nuevos de G3 | `shared/ui` |
| G3 shell | `app/shell` (sidebar/header) + `app/App.vue` |
| G4 (CategoriaPills/Dialog, PresupuestoDoc) | `shared/ui/` (CategoriaPills/Dialog — presentacionales puros, una copia) + `modules/presupuestos/` (PresupuestoDoc) |
| G5 (vistas) | `modules/<x>/*Page.vue` (login → `modules/auth`; public presupuesto → `modules/presupuestos`) |
| G6 (drawers/overlays/editor) | componente grande + `components/` de su módulo |
| G7 (limpieza) | + barrido de imports profundos/cross-module + barrels + ESLint boundaries |

Validar typecheck (`vue-tsc -b`) tras cada grupo, igual que el plan. Esta decisión **no cambia** ninguna de rev.1 (stock 4 niveles, BaseButton primero, DataTable opción A, etc.); solo define **dónde vive** cada archivo. Las convenciones de ubicación están en C13–C16 del índice.

## 9. Justificación de módulos propios

### `dashboard/`
Merece módulo propio porque tiene **lógica de agregación propia** (`stats-api.ts` con queries que combinan datos de presupuestos, insumos, clientes). No es solo orquestación de otros módulos; tiene su propia capa de datos. Si en el futuro los stats se mueven al backend, `stats-api.ts` se simplifica pero el módulo sigue siendo el contenedor natural de la página y sus componentes (`WeeklyChart`).

### `auth/`
Contiene únicamente `LoginPage` y el `session-store`. `PublicPresupuestoPage` **no** vive aquí porque es una vista de presupuesto (aunque pública sin auth); su lugar natural es `modules/presupuestos/` junto con `PresupuestoDoc` y `public-api.ts` (el fetch público para Puppeteer).

### `search/`
La búsqueda global del topbar **cruza los 4 dominios** (insumo/producto/cliente/presupuesto) y tiene su propia capa de datos: el endpoint `/search` y el tipo `SearchResult`. Por el mismo criterio que `dashboard` (regla #4 del árbol de decisión: agregador con datos propios), merece módulo en vez de vivir en `app/`. Así `useGlobalSearch` deja de importar `services/api` directo (smell DIP actual) y pasa por `search-api.ts`. Lo **consume `app/shell/AppHeader`** vía barrel (`@/modules/search`) — es el único caso donde el shell (`app`) importa un módulo, lo cual respeta la regla `app → modules`. No se acopla a ningún dominio: solo conoce el contrato `SearchResult`, no los stores de cada módulo.
