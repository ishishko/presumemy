# Auditoría de implementación — Refactor frontend `web/`

> Revisión del commit `f5c9f78` (*refactor(web): modular architecture + Tailwind primitives per refactor plan*) contra el plan documentado en este directorio (`00_Arquitectura_Modular.md`, `01_Indice_y_Seguimiento.md` y los docs `Gx_yy_*`).
> Fecha: 2026-06-28.

## 1. Veredicto general

La **fase estructural** del refactor se aplicó razonablemente: el scaffolding modular (`app/ + shared/ + modules/`), la mayoría de barrels, el UI kit en `shared/ui`, los stores con `del()` absorbido y el módulo `search/` están en su lugar. Esto coincide con lo que el propio mensaje de commit describe como *"arquitectura lista, falta el refactor visual pieza por pieza"*.

Sin embargo, **tres invariantes del plan están incumplidas y no son cosméticas** (DIP por construcción, `shared` sin dominio, DRY de catálogos), y el enforcement de ESLint —que era la garantía de la invariante más importante— no la hace cumplir. Además, el mensaje de commit afirma cambios que no se materializaron.

**Conclusión:** el refactor **no** puede considerarse "aplicado según el plan" hasta cerrar al menos los puntos críticos (P1–P3 de §3).

## 2. Lo que se aplicó correctamente

| Ítem del plan | Estado |
|---|---|
| Scaffolding `app/ shared/ modules/` (G0.0) | ✅ |
| `main.css` con `@theme` + `@layer base` (G0.1) | ✅ |
| Tokens faltantes `--color-teal-600` / `--color-violet-600` (C9) | ✅ agregados a `@theme` |
| `shared/lib`: `format`, `useToast`, `useDirty`, `usePagination`, `editorMode`, `createTrigger` | ✅ |
| `EDITOR_STATUS_SLOT_ID` en `shared/lib/editorSlot.ts` (C11) | ✅ ubicación correcta |
| `shared/ui` con los 19 primitivos | ✅ |
| `CategoriaPills` / `CategoriaDeleteDialog` en **una** copia (C17 / DRY) | ✅ |
| Stores con `del()` absorbido (G1.3) | ✅ |
| `stock.ts` único de 4 niveles + test (C8) | ✅ |
| `modules/search/` con `search-api.ts` (G3.14) | ✅ |
| ESLint boundaries configurado (flat config) | ⚠️ presente pero incompleto (ver P1) |

## 3. Problemas y desviaciones (por severidad)

### P1 — 🔴 DIP roto y enforcement que no lo cubre
**Invariantes violadas:** #3 (DIP por construcción), C4, C15, C16.

La invariante central del plan es: *"la UI de un módulo **no importa `shared/api`**; el acceso a datos pasa por `store.ts`/`api.ts` del módulo"*. Nueve componentes la violan importando el cliente HTTP directo:

```
modules/clientes/ClienteDrawer.vue
modules/dashboard/DashboardPage.vue
modules/finanzas/ImprentaDrawer.vue
modules/finanzas/MovimientoDrawer.vue
modules/insumos/InsumoDetalle.vue
modules/presupuestos/PresupuestoEditor.vue
modules/presupuestos/PresupuestosPage.vue
modules/productos/ProductoDetalle.vue
modules/productos/ProductosPage.vue
```
todos con `import { get, post, put, ... } from '@/shared/api/client'`.

**Causa de que pase desapercibido:** la regla de `eslint.config.js` `{ from: 'module-*', allow: ['shared', 'shared-*', 'module-*'] }` permite `shared-api` al por mayor. C16 pedía explícitamente **prohibir `shared/api` desde la UI de un módulo**. El `lint` da 0 errores justamente porque la regla que debía atrapar esto no existe.

**Impacto:** todo el plan se justifica en *"DIP por construcción, no por disciplina"*. Sin el enforcement correcto, la disciplina ya se rompió en 9 archivos.

### P2 — 🔴 Tipos de dominio dentro de `shared`
**Invariante violada:** #1 (*"shared no conoce el dominio"*); C13.

`web/src/shared/config/types.ts` contiene ~250 líneas con `Insumo`, `CategoriaInsumo`, `Producto`, `Cliente`, `Presupuesto`, `Transaccion`, `OrdenImprenta`, `ConfiguracionNegocio`, etc. El plan exige que cada módulo tenga su propio `types.ts` y que `shared/config` solo aloje genéricos (`PaginationResult`). Hoy `shared` conoce todo el modelo de negocio.

### P3 — 🟠 Catálogos y reglas de dominio duplicados (lo opuesto a C12/C17)
**Convenciones violadas:** C12 (audit de catálogos), C17 (DRY rector).

- `statusTones` + `TRANSITIONS` + `getAvailableTransitions` están **copiados idénticos** en `PresupuestoEditor.vue` (línea ~34) y `PresupuestosPage.vue` (línea ~52).
- El commit afirma *"statusTones + TRANSITIONS → utils/presupuestoEstado.ts (con test)"* — **no existe** `estado.ts` ni su test.
- Tampoco existen las reglas de dominio puras que el plan pedía extraer: `presupuestos/calc.ts`, `productos/pricing.ts`, `insumos/costeo.ts`, `finanzas/tipos.ts`.
- El test de FSM `presupuestoEstado` (rev.1) no se creó.

### P4 — 🟠 `public-api.ts` ausente
**Doc violado:** G5.8, C4.

`modules/presupuestos/PublicPresupuestoPage.vue` usa `ofetch` directo en lugar del `modules/presupuestos/public-api.ts` que el plan exigía (fetch público para Puppeteer, por consistencia y testabilidad).

### P5 — 🟡 Módulos `auth` y `dashboard` incompletos
**Convención violada:** C14 (barrel obligatorio).

- Ninguno expone `index.ts`.
- `auth` no tiene `session-store`; sigue usando el legacy `src/stores/auth.ts`.
- `dashboard` no tiene `stats-api.ts` ni `WeeklyChart`; `DashboardPage` hace `get()` directo y consume `src/stores/dashboard.ts` legacy.
- La carpeta `src/stores/` legacy (`auth.ts`, `dashboard.ts`) sigue viva.

### P6 — 🟡 G7.1 (limpieza CSS) no terminado y commit inexacto
El mensaje de commit dice *"Borrados: assets/css/tokens.css, assets/css/components.css"* pero **ambos archivos siguen existiendo** y `app/styles/main.css` (líneas 17 y 22) aún los `@import`. Es coherente con que la migración visual esté pendiente, pero el texto del commit no refleja el estado real.

### P7 — 🟡 Descomposición de componentes (G6) casi sin hacer
Solo se extrajo `StockBar`. Faltan los subcomponentes del plan: `ProveedoresEditor`, `InsumosTable`, `ProductCard`, `BomEditor`, `Avatar`, `ContactosEditor`, `LinesSpreadsheet`, `EditorTotals`, `EstadoDropdown`, `FinTabs`, `SignedAmountInput`, `SettingsBlock`, `WeeklyChart`. Esto **sí** está reconocido como pendiente en el commit (no es una desviación oculta, pero el plan no está completo).

## 4. Discrepancias entre el mensaje de commit y la realidad

| Afirma el commit | Realidad |
|---|---|
| "Borrados: assets/css/tokens.css, assets/css/components.css" | Ambos existen y se siguen importando |
| "statusTones + TRANSITIONS → utils/presupuestoEstado.ts (con test)" | No existe el archivo ni el test; duplicado literal en 2 vistas |
| "las vistas ya no importan shared/api para DELETE" | Cierto para `del()`, pero 9 vistas importan `get/post/put/patch` de `shared/api` |
| "Tipos consolidados en shared/config/types.ts" | Hecho, pero **viola** la invariante "shared no conoce el dominio" |

## 5. Acciones recomendadas (priorizadas)

1. **P1 — Cerrar el DIP (crítico).** Mover el acceso a datos de las 9 vistas a sus `store.ts`/`api.ts`. Luego endurecer ESLint: separar `shared-api` y prohibirlo desde `module-*` (regla dedicada `no-restricted-imports` o ajuste de `boundaries`), de modo que la violación falle el `lint`/CI.
2. **P2 — Repatriar tipos de dominio** a `modules/<x>/types.ts`; dejar en `shared/config` solo genéricos (`PaginationResult`).
3. **P3 — Crear `modules/presupuestos/estado.ts`** con `statusTones`/`TRANSITIONS`/`getAvailableTransitions` + su test; consumirlo desde Editor y Page. Extraer el resto de catálogos (C12) y reglas (`calc`, `pricing`, `costeo`, `tipos`).
4. **P4 — Crear `public-api.ts`** y migrar `PublicPresupuestoPage`.
5. **P5 — Completar `auth` y `dashboard`** (barrels, `session-store`, `stats-api.ts`) y borrar `src/stores/` legacy.
6. **P6/P7 — Continuar G6/G7** (descomposición visual + limpieza de CSS legacy) una vez estabilizada la arquitectura.

> Nota: P1–P3 son violaciones de invariantes, no "refactor visual pendiente". Deben resolverse antes de dar el refactor por aplicado; P5–P7 pueden seguir el ritmo incremental previsto por el plan.
