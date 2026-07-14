# Auditoría de ejecución — Refactor frontend `web/`

> Informe de revisión de los intentos de ejecución del plan de refactor (`refactor_plan/`).
> Fecha: 2026-06-28 · Alcance: comparación del código real en dos worktrees contra el plan documentado.
> Estado del plan documental: bien construido y coherente; **ninguna ejecución lo completó**.

## Resumen ejecutivo

Existen **dos intentos** de ejecutar el refactor, en worktrees separados, ambos sobre el commit base `a8e1676`:

| Worktree | Commit | Naturaleza | Veredicto |
|---|---|---|---|
| `refactor-qwen` | `92cece7` (commiteado) | Mover + borrar viejos (consolidado) | Base estructural más sana, pero **incompleta** y con **una regresión funcional** |
| `refactor-mvp-plan-execution` | sin commit (working tree) | Copiar + shims (transicional) | Duplicación masiva; la app sigue corriendo sobre el código viejo |

**Ninguno de los dos completó el plan.** Ambos hicieron la mitad "relocalización modular + Tailwind" y **saltaron casi toda la mitad "componentización SOLID"** (división de archivos pesados, barrels, enforcement). Cada uno además cae en distintos gaps del propio plan.

---

## A. Problemas comunes a ambos intentos

Estas desviaciones aparecen en los dos worktrees:

### A1 — Componentización SOLID no realizada (Grupo 6 completo)
Los archivos pesados **no se dividieron** en subcomponentes. En `refactor-qwen` incluso **crecieron** (el `<style scoped>` se volvió clases Tailwind inline):

| Archivo | LOC original | LOC en `refactor-qwen` |
|---|---|---|
| `InsumoDetalle` | 1.344 | 1.504 |
| `ProductoDetalle` | 984 | 1.527 |
| `PresupuestoEditor` | 1.421 | 1.427 |

No se extrajo ninguno de los subcomponentes que el plan exige (G6 + arquitectura §2): `BomEditor`, `ProveedoresEditor`, `LinesSpreadsheet`, `EditorTotals`, `EstadoDropdown`, `ContactosEditor`, `Avatar`, `FinTabs`, `SignedAmountInput`, `WeeklyChart`, `SettingsBlock`. La deuda de responsabilidad única — uno de los **objetivos centrales** del refactor — sigue intacta.

### A2 — Sin barrels `index.ts` (viola C14 e invariantes #4/#5)
Ningún módulo expone su API pública por `index.ts`. El plan lo marca como **invariante no-negociable** (public API y cross-module *solo por barrel*). Sin esto, los imports van por path profundo y la regla de dependencia no es verificable ni real.

### A3 — Gaps de cobertura del propio plan, arrastrados a la ejecución
La ejecución cayó justo en los huecos que el plan documental no cubría:
- **`types/index.ts`** sigue siendo global; nunca se planificó el split a `modules/<x>/types.ts`.
- **`schemas/`** sigue como carpeta global; el plan los quería en `modules/<x>/schema.ts`.
- **`modules/search/`** quedó incompleto: falta `search-api.ts` y `types.ts` (G3.14).

---

## B. `refactor-qwen` (commit `92cece7`)

### B1 — Lo correcto ✅
- **Consolidación real:** movió todo y **borró** `views/`, `components/`, `stores/`, `services/`, `composables/`. Neto **−1.696 líneas**. Sin duplicación.
- **Sin imports legacy colgando** (`@/views/*`, `@/components/*`, etc.): no hay rutas muertas.
- Estructura `app/ + shared/ + modules/` correcta; `shared/ui` completo (`BaseButton`, `DataTable`, `BaseCard`, `BaseKpi`, `StatusBadge`, `FilterChips`, `OverlayShell`, `RowActions`…).
- `useToast` / `useDirty` movidos a `shared/lib` (cierra un gap que el otro worktree dejó abierto).
- Arranque correcto: `app/main.ts`, `app/router.ts`, `app/pinia.ts`.

### B2 — 🔴 Regresión funcional: CRUD de categorías perdido
`CategoriaPills.vue` y `CategoriaDeleteDialog.vue` **desaparecieron** (no están en `shared/ui` ni en ningún módulo). En `ProductosPage.vue` solo sobrevive el **filtro** por categoría (`p.categoriaId === catFilter`); el **CRUD inline** (crear / renombrar / eliminar con reasignación) ya **no está en la UI**. Esto es pérdida de funcionalidad, no refactor. Contradice C17 y la decisión DRY de "una copia en `shared/ui`".

### B3 — Otras desviaciones
- **Sin ESLint / enforcement** (G7.2 no hecho).
- `modules/search/` solo tiene `useGlobalSearch.ts` (ver A3).
- `schemas/` y `types/index.ts` sin migrar (ver A3).
- Sin barrels (ver A2) y sin división SOLID (ver A1).

---

## C. `refactor-mvp-plan-execution` (sin commit)

### C1 — Estrategia transicional (copiar, no mover)
En vez de la "Opción A (relocalizar al tocar = **mover**)" del plan, **copió** a la estructura modular y dejó los archivos viejos como puentes. Consecuencias:
- **Duplicación masiva:** cada componente existe dos veces (ej. `components/ui/ConfirmDialog.vue` *y* `shared/ui/ConfirmDialog.vue`).
- **La app en runtime sigue usando el código viejo.** El router **no se tocó**: apunta a `@/views/*` y `@/stores/auth`. Las `views/*` quedaron como shims de una línea (`import InsumosPage from '@/modules/insumos/InsumosPage.vue'`). Los módulos nuevos cuelgan como código muerto parcialmente conectado.

### C2 — Imports inconsistentes en el piloto
En `modules/insumos/InsumosPage.vue` (el piloto del plan) quedaron referencias a ubicaciones viejas pese a existir la nueva:
- `import InsumoDetalle from '@/components/overlays/InsumoDetalle.vue'` → importa el viejo, aunque creó `modules/insumos/components/InsumoDetalle.vue` (duplicado sin usar).
- `import { useToast } from '@/composables/useToast'` → sigue en `composables/` (no migrado a `shared/lib`).
- `import type { Insumo } from '@/types'` → tipo global sin split.

### C3 — Lo que conservó mejor que `refactor-qwen`
- **Mantuvo `CategoriaPills` / `CategoriaDeleteDialog`** en `shared/ui` (sin la regresión B2).
- **Instaló ESLint** (`.eslintrc.json`, G7.2).
- Dejó scaffolding de los componentes base nuevos.

### C4 — Desviaciones
- Sin commit (todo en working tree, frágil).
- Duplicación sin consolidar (ver C1).
- Sin barrels (ver A2), sin división SOLID (ver A1), gaps A3 presentes.

---

## D. Tabla comparativa

| Criterio | `refactor-qwen` | `refactor-mvp-plan-execution` |
|---|---|---|
| Commiteado | ✅ sí, limpio | ⚠️ no (working tree) |
| Estrategia | Mover + borrar (consolidado) | Copiar + shims (duplicado) |
| App en runtime usa | estructura **nueva** | estructura **vieja** vía shims |
| Duplicación | ninguna | masiva (×2 por archivo) |
| Imports legacy rotos | ninguno | varios (apuntan a viejo y nuevo) |
| Barrels `index.ts` (C14) | ❌ | ❌ |
| CRUD categorías | 🔴 perdido | ✅ conservado |
| División SOLID pesados (G6) | ❌ | ❌ |
| `useToast`/`useDirty` → `shared/lib` | ✅ | ❌ |
| ESLint / enforcement (G7.2) | ❌ | ✅ |
| `schemas` / `types` migrados (A3) | ❌ | ❌ |
| `search-api.ts` (G3.14) | ❌ | ❌ |

---

## E. Recomendación

`refactor-qwen` es la **base estructural más sana** (consolidado, sin duplicación, sin imports rotos). Para llevarlo a "plan completo" haría falta:

1. **Recuperar el CRUD de categorías** (B2) — bloqueante: es una regresión funcional. Reintroducir `CategoriaPills`/`CategoriaDeleteDialog` en `shared/ui` y cablearlos en `ProductosPage`/`InsumosPage`.
2. **Agregar barrels** `index.ts` por módulo (A2) y migrar imports a path por barrel.
3. **Ejecutar el Grupo 6** real: dividir `InsumoDetalle`, `ProductoDetalle`, `PresupuestoEditor` en los subcomponentes del plan (A1).
4. **Completar A3:** `search-api.ts` + `types.ts` en `search/`; mover `schemas/` a `modules/<x>/schema.ts`; split de `types/index.ts`.
5. **Instalar enforcement** (G7.2) — acá `refactor-mvp-plan-execution` ya tiene un `.eslintrc.json` reutilizable.
6. **Verificar typecheck** (`vue-tsc -b`) y revisión visual contra el prototipo antes de dar por cerrado cualquier grupo.

> Pendiente sugerido: correr `vue-tsc -b` en `refactor-qwen` (tiene `node_modules`) para confirmar que al menos compila pese a las desviaciones.
