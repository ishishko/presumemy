# Arquitectura del frontend `web/` — Modular por dominio

> Fuente de verdad de la arquitectura de carpetas del refactor. Acompaña a `00_Plan_Refactor_Completo.md` y al índice `01_Indice_y_Seguimiento.md`.
> Se partió de una adaptación de **Feature-Sliced Design**, pero se descartó su partición por capas porque dispersaba cada dominio en 3-4 carpetas. Se adopta una estructura **modular por dominio** (package-by-feature) que conserva las invariantes valiosas de FSD pero prioriza la **cohesión**: todo lo de un dominio en una sola carpeta.

---

## 1. Postura

- **Cohesión por dominio primero.** Para tocar "insumos" se abre **una** carpeta (`modules/insumos/`), no varias.
- **pages-first + Regla de Tres + YAGNI** (alineado con el plan de refactor): el código vive lo más cerca de su uso posible; se baja a `shared` solo cuando el reuso real lo justifica.
- Las **invariantes** que sí se conservan de FSD (ver §4) son no-negociables; el resto se relaja a propósito (ver §7).

## 2. Estructura objetivo de `web/src/`

```
web/src/
├── app/        # arranque + shell + glue global (NO-dominio)
│   ├── main.ts · App.vue
│   ├── router.ts · pinia.ts
│   ├── styles/main.css            (@theme + @layer base)
│   ├── shell/   AppSidebar.vue · AppHeader.vue
│   └── state/   editorMode.ts · createTrigger.ts   (singletons de orquestación)
│
├── shared/     # SIN dominio, reutilizable por cualquier módulo
│   ├── ui/     BaseButton, BaseCard, BaseKpi, StatusBadge, DataTable, RowActions,
│   │           FilterChips, ConfirmDialog, DrawerShell, OverlayShell, ToggleSwitch,
│   │           SegmentedControl, FloatingField, FloatingSelect, ToastContainer, PageHead
│   ├── lib/    format.ts (formatMoney/formatDate) · useToast · useDirty
│   ├── api/    client.ts (ofetch — ÚNICO que lo conoce)
│   └── config/ tipos genéricos (PaginationResult…) · env
│
└── modules/    # UN dominio = UNA carpeta autocontenida (barrel index.ts)
    ├── insumos/
    │   ├── InsumosPage.vue                 (pantalla ruteada)
    │   ├── InsumoDetalle.vue               (overlay)
    │   ├── components/{StockBar,ProveedoresEditor,InsumosTable}.vue
    │   ├── store.ts                        (pinia)
    │   ├── api.ts                          (requests insumo → usa shared/api)
    │   ├── stock.ts                        (getNivel/NIVEL_META · 4 niveles)
    │   ├── costeo.ts                       (useInsumoCosteo)
    │   ├── types.ts · schema.ts            (zod)
    │   └── index.ts                        (barrel = API pública)
    ├── productos/    Page · ProductoDetalle · components/{ProductCard,BomEditor} · store · api · pricing · types · schema · index
    ├── clientes/     Page · ClienteDrawer · components/{Avatar,ContactosEditor} · store · api · types · schema · index
    ├── presupuestos/ Page · PresupuestoEditor · PresupuestoDoc · components/{LinesSpreadsheet,EditorTotals,EstadoDropdown}
    │                 · store · api · estado.ts (FSM + Record<Estado,Tone>) · calc.ts · types · schema · index
    ├── finanzas/     Page · {Movimiento,Imprenta}Drawer · components/{FinTabs,SignedAmountInput} · store · api · tipos.ts (catálogo) · schema · index
    ├── categorias/   CategoriaPills · CategoriaDeleteDialog · store · api · index     (lo consumen insumos + productos)
    ├── ajustes/      Page · components/SettingsBlock · store · api · index
    ├── dashboard/    Page · components/WeeklyChart · stats-api.ts · index
    └── auth/         LoginPage · PublicPresupuestoPage · session-store · index
```

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
5. **Cross-module solo por barrel:** un módulo puede importar otro a través de su `index.ts` (`@/modules/clientes`), nunca por path profundo (`@/modules/clientes/store`). Ej. real: `presupuestos` → `clientes` + `productos`; `insumos`/`productos` → `categorias`.

## 5. Árbol de decisión (dónde va cada cosa)

Primer "sí" gana:
1. ¿Genérico, sin negocio? (botón, input, `formatMoney`, cliente `ofetch`) → **`shared`**.
2. ¿Arranque, shell, router/pinia, estilos globales o estado de orquestación global? → **`app`**.
3. ¿Pertenece a un dominio (insumo, cliente, presupuesto…)? → **`modules/<dominio>`** (en el segmento que corresponda: UI, `store`, `api`, regla, `types`).
4. ¿Lo comparten dos dominios y tiene negocio? → **módulo propio** (ej. `categorias`) consumido por barrel.

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
| G4 (CategoriaPills/Dialog, PresupuestoDoc) | `modules/categorias`, `modules/presupuestos` |
| G5 (vistas) | `modules/<x>/*Page.vue` (login/public → `modules/auth`) |
| G6 (drawers/overlays/editor) | componente grande + `components/` de su módulo |
| G7 (limpieza) | + barrido de imports profundos/cross-module + barrels + ESLint boundaries |

Validar typecheck (`vue-tsc -b`) tras cada grupo, igual que el plan. Esta decisión **no cambia** ninguna de rev.1 (stock 4 niveles, BaseButton primero, DataTable opción A, etc.); solo define **dónde vive** cada archivo. Las convenciones de ubicación están en C13–C16 del índice.
