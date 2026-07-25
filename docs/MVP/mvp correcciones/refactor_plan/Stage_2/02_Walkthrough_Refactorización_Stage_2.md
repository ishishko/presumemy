# Walkthrough — Fix 02 Refactorización Stage 2

> Registro del trabajo realizado sobre el plan [`02_Plan_Fix_Refactor.md`](02_Plan_Fix_Refactor.md), que cierra la deuda arquitectónica que la ronda `01` dejó explícitamente sin ejecutar (§6 de [`01_Walkthrough_Refactorización_Stage_2.md`](01_Walkthrough_Refactorización_Stage_2.md)).
> Fecha: 2026-07-24/25 · Verificación: `vue-tsc -b` + `npm run build` + `npm run test` + inspección de tokens en navegador.

---

## 1. Objetivo

Ejecutar los Pasos 5, 6 y 7 diferidos, bajo el encuadre nuevo: **el refactor termina en Stage 2**. Lo que se había rotulado "Stage 3" se absorbe acá; no hay fase posterior.

De los tres, en esta sesión se completó el **Paso 6 (DIP)** más dos trabajos de higiene que aparecieron al auditar el código. Los Pasos 5 y 7 quedan planificados y pendientes.

---

## 2. Nota de proceso (para el registro)

Los tres pasos ejecutados se hicieron **en una sola corrida, sin punto de control del usuario entre medio**. Eso contradice la recomendación que el propio `01` §6 había dejado registrada ("módulo por módulo, verificando el guardado real en el navegador después de cada uno, no en batch") y contradice también el principio §3.1 del plan `02`.

Consecuencia práctica: al cierre de esta bitácora, **la validación funcional del CRUD está pendiente** y es el gate para commitear. Los pasos que siguen (P4 y P5) se ejecutan con validación intermedia, sin excepción.

Nada de este trabajo fue commiteado: el árbol quedó sobre `7773891 Testing E2E start`.

---

## 3. Auditoría previa: dos correcciones al diagnóstico heredado

Antes de tocar código se midió el estado real. El report de la second review estaba desactualizado en dos puntos:

| Lo que decía el report | Lo que se midió |
|---|---|
| `editorMode` vive en `App.vue`, `router.ts`, `AppHeader.vue`, 3 overlays **y 3 páginas** | **7 archivos, sin las páginas.** Las páginas solo usan `createTrigger`. El Paso 5 es más chico de lo estimado |
| "11 archivos importan `shared/api/client`" | 11 archivos de UI **más** el composable `useGlobalSearch`. Los `store.ts` también lo importaban, pero eso es legítimo |

Y aparecieron tres cosas que no estaban registradas en ningún documento:

1. **CSS legacy muerto:** `src/style.css` (300 líneas), `src/assets/css/main.css` y `src/assets/css/tokens.css` (105 líneas) **no los importa nadie**. El único entrypoint real es `src/app/styles/main.css`. Eran restos del rename de tokens de la ronda `01`.
2. **Contratos globales sin colocar:** `src/types/index.ts` (249 líneas) y `src/schemas/*.ts` seguían fuera de los módulos, y **ningún** módulo tenía barrel `index.ts` — pese a que la convención C14/C15 de Stage 1 lo exigía.
3. **Cobertura de tests menor a la declarada:** el `Audit_Report` de Stage 1 declaraba 26 tests en 3 archivos (`stock.test.ts` 11, `format.test.ts` 7, `ConfirmDialog.test.ts` 8). En el repo hay **un solo** archivo de test versionado en `web/` (`format.test.ts`, 5 tests). Los otros dos no están. **No se tocó nada de esto** — queda anotado para decidir en P6.

---

## 4. P1 — Higiene de CSS legacy muerto

Eliminados los 3 archivos sin importador y el directorio vacío `src/utils/`.

**Verificación en navegador** (antes/después del borrado, sobre el dev server):

```
--color-surface : #FFFFFF      (token @theme vivo)
--surface       : (vacío)      (token legacy, ya muerto de antes)
body background : rgb(247, 245, 243)   = --page-bg
font-family     : Onest, ui-sans-serif, …
```

El pipeline de tokens quedó intacto: lo borrado no participaba del render.

---

## 5. P2 — Barrels y colocación de contratos

- `src/types/index.ts` repartido en `modules/<m>/types.ts` (auth, insumos, productos, clientes, presupuestos, finanzas, ajustes, dashboard). `PaginationResult`, único tipo genuinamente transversal, quedó en `shared/types.ts`.
- `src/schemas/*.ts` movidos a `modules/<m>/schema.ts` con `git mv` (preserva historial).
- `index.ts` creado en los 9 módulos.
- 27 sitios de import reescritos. Los directorios `src/types/` y `src/schemas/` ya no existen.

### Dos decisiones de diseño

**Los barrels no exportan las páginas.** El router importa las páginas con `import()` dinámico; meterlas en el barrel habría colapsado el code splitting en un solo chunk. El barrel expone tipos, schema, store y componentes públicos; las páginas se siguen importando por ruta directa desde el router. Queda documentado en el encabezado de cada `index.ts`.

**Los imports cruzados entre módulos son `import type`.** Al ser type-only, TypeScript los borra en compilación: no generan import en runtime y por lo tanto **no crean ciclos** entre barrels (p. ej. `productos/types.ts` referencia `Insumo` de insumos, y `presupuestos/types.ts` referencia `Cliente` y `Producto`).

---

## 6. P3 — DIP completo *(Paso 6 heredado)*

Se creó `modules/<m>/api.ts` en los 8 módulos con datos. Ese archivo es ahora **el único punto del módulo que habla HTTP**, y solo el store lo consume; los componentes usan acciones del store.

| Módulo | Qué se agregó al store | UI liberada de HTTP |
|---|---|---|
| **insumos** | `fetchCatalogos`, `createProveedor`, `removeProveedor` + estado `proveedores` | `InsumoDetalle.vue`, `ProveedoresEditor.vue` |
| **productos** | `fetchCategorias`, `toggleFavorito` | `ProductoDetalle.vue`, `ProductosPage.vue` |
| **clientes** | `create`, `update` | `ClienteDrawer.vue` |
| **finanzas** | `createTransaccion`, `updateTransaccion`, `createOrden`, `updateOrden` | `MovimientoDrawer.vue`, `ImprentaDrawer.vue` |
| **presupuestos** | `fetchById`, `getPdfUrl` | `PresupuestoEditor.vue`, `PresupuestosPage.vue` |
| **ajustes** | store **nuevo** (`fetchConfig` cacheado, `fetchAll`, `saveConfig`, `saveDistribucion`) | `AjustesPage.vue` |
| **dashboard** | consume `api.ts` | `DashboardPage.vue` |
| **search** | `SearchResult` a `types.ts`, HTTP a `api.ts` | `useGlobalSearch.ts` |

### El nudo que el plan `01` había marcado como delicado

`ProveedoresEditor` recibía el catálogo global de proveedores por `v-model:proveedoresList` desde `InsumoDetalle`, y **ambos** hacían HTTP: el padre cargaba la lista, el hijo daba de alta y de baja sobre esa misma lista por referencia. Ese ida y vuelta era la razón por la que el Paso 6 se había diferido.

Se resolvió moviendo el catálogo al store de insumos: el hijo dejó de recibir el model y lee `store.proveedores` por `storeToRefs`; el alta y la baja pasan por `store.createProveedor` / `store.removeProveedor`, que mantienen el orden alfabético y la consistencia de la lista. El `defineModel` que queda en el componente es el de las filas del insumo en edición, que sí pertenece al padre.

### Cruces entre módulos

Donde un módulo necesita datos de otro, el cruce pasa por el **store** del otro módulo, no por HTTP propio:

- `ProductoDetalle` toma los insumos de `useInsumosStore`.
- Los drawers de finanzas toman el listado de presupuestos de `usePresupuestosStore`.
- `PresupuestoEditor` toma clientes, productos y configuración de sus tres stores.
- `DashboardPage` y `PresupuestoDoc` toman la configuración del nuevo store de ajustes.

### Hallazgo menor

`modules/dashboard/stats-api.ts` era **código huérfano**: exportaba `getDashboardStats()` y no lo importaba nadie (el store hacía la llamada por su cuenta). Se reemplazó por `api.ts`, ahora sí consumido por el store.

---

## 7. Verificación

| Chequeo | Resultado |
|---|---|
| `npx vue-tsc -b` | 0 errores |
| `npm run build` (`web/`) | OK — chunks por módulo intactos, sin colapso del code splitting |
| `npm run test` (`web/`) | 5/5 verdes |
| Consola del navegador y log de Vite | Sin errores nuevos |
| `grep -rn "shared/api/client" --include=*.vue web/src` | **vacío** |
| Tokens `@theme` en navegador | Vivos |
| **CRUD funcional en navegador** | **Pendiente — lo valida el usuario** |

---

## 8. Estado del alcance heredado

| Paso | Estado |
|---|---|
| **Paso 6 — DIP** | ✅ Ejecutado |
| **Paso 5 — desacople de `editorMode`** | ⏳ Pendiente (7 archivos; detalle en `02_Plan_Fix_Refactor.md` §P4) |
| **Paso 7 — CSS de overlays + borrar `components.css`** | ⏳ Pendiente (3 overlays de ~3.260 líneas + 3.536 de `components.css`, 66 clases aún en uso; detalle en §P5) |

La recomendación de `01` §6 —ejecutar módulo por módulo con verificación real de guardado en navegador— **se mantiene vigente para P4 y P5**, y esta vez se respeta.

---

## 9. Archivos tocados

### Eliminados
| Archivo | Motivo |
|---|---|
| `web/src/style.css` | Legacy sin importador (300 líneas) |
| `web/src/assets/css/main.css` | Entrypoint legacy sin importador |
| `web/src/assets/css/tokens.css` | Tokens legacy sin importador (105 líneas) |
| `web/src/types/index.ts` | Repartido en los módulos (249 líneas) |
| `web/src/modules/dashboard/stats-api.ts` | Huérfano; reemplazado por `api.ts` |
| `web/src/utils/` | Directorio vacío |

### Movidos
| Desde | Hacia |
|---|---|
| `web/src/schemas/{clientes,finanzas,insumos,presupuestos,productos}.ts` | `web/src/modules/<m>/schema.ts` |

### Creados
| Archivo | Qué es |
|---|---|
| `web/src/shared/types.ts` | `PaginationResult` |
| `web/src/modules/<m>/types.ts` | Tipos por dominio (8 módulos + search) |
| `web/src/modules/<m>/api.ts` | Capa HTTP por módulo (8 módulos) |
| `web/src/modules/<m>/index.ts` | Barrel por módulo (9) |
| `web/src/modules/ajustes/store.ts` | Store de ajustes (no existía) |

### Modificados
| Archivo | Cambio |
|---|---|
| `modules/insumos/store.ts` | Consume `api.ts` · `fetchCatalogos`, `createProveedor`, `removeProveedor`, estado `proveedores` |
| `modules/insumos/components/InsumoDetalle.vue` | Catálogos desde el store · sin HTTP · sin `v-model:proveedoresList` |
| `modules/insumos/components/ProveedoresEditor.vue` | Catálogo desde el store · alta y baja por acciones del store |
| `modules/productos/store.ts` | Consume `api.ts` · `fetchCategorias`, `toggleFavorito` |
| `modules/productos/components/ProductoDetalle.vue` | Categorías e insumos desde stores · sin HTTP |
| `modules/productos/ProductosPage.vue` | Favorito por `store.toggleFavorito` |
| `modules/clientes/store.ts` | Consume `api.ts` · `create`, `update` |
| `modules/clientes/components/ClienteDrawer.vue` | Guardado por acciones del store |
| `modules/finanzas/store.ts` | Consume `api.ts` · altas y ediciones de transacción y orden |
| `modules/finanzas/components/MovimientoDrawer.vue` | Guardado por store · presupuestos desde `usePresupuestosStore` |
| `modules/finanzas/components/ImprentaDrawer.vue` | Ídem |
| `modules/presupuestos/store.ts` | Consume `api.ts` · `fetchById`, `getPdfUrl` |
| `modules/presupuestos/components/PresupuestoEditor.vue` | Detalle, PDF, clientes, productos y config desde stores |
| `modules/presupuestos/PresupuestosPage.vue` | Cambio de estado por `store.updateStatus` |
| `modules/ajustes/AjustesPage.vue` | Config y socios desde el store nuevo |
| `modules/dashboard/store.ts` · `DashboardPage.vue` | Consumen `api.ts` y el store de ajustes |
| `modules/search/useGlobalSearch.ts` | HTTP a `api.ts` · tipo a `types.ts` |
| 27 archivos con imports de `@/types` o `@/schemas` | Reapuntados a `modules/<m>` o `shared/types` |

### Documentación
| Archivo | Cambio |
|---|---|
| `Stage_3/` | **Eliminada** — Stage 3 cancelado, alcance absorbido en Stage 2 |
| `Stage_2/02_Plan_Fix_Refactor.md` | Nuevo |
| `Stage_2/02_Task_Refactorización_Stage_2.md` | Nuevo |
| `Stage_2/02_Walkthrough_Refactorización_Stage_2.md` | Este documento |
| `Stage_2/01_Plan_Fix_Refactor.md` | Puntero al plan `02` en el bloque de pendientes (que había quedado desactualizado) |
| `.claude/launch.json` | Config para levantar API y web desde el editor |

---

## 10. Próximo paso

**Gate:** validación funcional del CRUD por el usuario (checklist P3-V en [`02_Task_Refactorización_Stage_2.md`](02_Task_Refactorización_Stage_2.md)). Recién con eso verde se commitea esta ronda y se arranca P4.
