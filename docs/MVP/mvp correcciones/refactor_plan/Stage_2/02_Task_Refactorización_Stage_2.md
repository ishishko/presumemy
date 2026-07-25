# Lista de Tareas — Fix 02 Refactorización Stage 2

> Plan: [`02_Plan_Fix_Refactor.md`](02_Plan_Fix_Refactor.md) · Bitácora: [`02_Walkthrough_Refactorización_Stage_2.md`](02_Walkthrough_Refactorización_Stage_2.md)
> Leyenda: `[x]` hecho y verificado por typecheck/build/tests · `[ ]` pendiente · **Validación funcional del usuario en navegador: se marca aparte.**

---

## Fase 0: Encuadre

- [x] **Paso 0: Cancelar Stage 3 y absorber su alcance en Stage 2**
    - [x] Eliminar la carpeta `Stage_3/` y su plan.
    - [x] Reencuadrar los Pasos 5, 6 y 7 diferidos como P4, P3 y P5 de esta ronda.
    - [x] Congelar el testing E2E hasta nuevo aviso.

---

## Fase 1: Higiene y contratos (bajo riesgo)

- [x] **P1: Borrar CSS legacy muerto**
    - [x] Verificar por `grep` que ningún entrypoint importa `style.css`, `assets/css/main.css` ni `assets/css/tokens.css`.
    - [x] Eliminar los 3 archivos y el directorio vacío `src/utils/`.
    - [x] Confirmar en navegador que los tokens `@theme` siguen vivos (`--color-surface`, `--page-bg`, fuente Onest).
- [x] **P2: Barrels y colocación de contratos**
    - [x] Repartir `src/types/index.ts` en `modules/<m>/types.ts` (8 módulos).
    - [x] Mover `PaginationResult` a `shared/types.ts`.
    - [x] Mover `src/schemas/*.ts` a `modules/<m>/schema.ts` (5 archivos).
    - [x] Crear `index.ts` en los 9 módulos.
    - [x] Reescribir los 27 sitios de import y eliminar `src/types/` y `src/schemas/`.

---

## Fase 2: DIP (Paso 6 heredado del plan 00/01)

- [x] **P3: Sacar `shared/api/client` de la UI**
    - [x] Crear `modules/<m>/api.ts` en los 8 módulos con datos.
    - [x] **insumos** — store gana `fetchCatalogos`, `createProveedor`, `removeProveedor` y el estado `proveedores`; limpiar `InsumoDetalle.vue` y `ProveedoresEditor.vue`; eliminar el `v-model:proveedoresList` entre padre e hijo.
    - [x] **productos** — store gana `fetchCategorias` y `toggleFavorito`; limpiar `ProductoDetalle.vue` y `ProductosPage.vue`.
    - [x] **clientes** — store gana `create` y `update`; limpiar `ClienteDrawer.vue`.
    - [x] **finanzas** — store gana `createTransaccion`, `updateTransaccion`, `createOrden`, `updateOrden`; limpiar `MovimientoDrawer.vue` e `ImprentaDrawer.vue`.
    - [x] **presupuestos** — store gana `fetchById` y `getPdfUrl`; limpiar `PresupuestoEditor.vue` y `PresupuestosPage.vue`.
    - [x] **ajustes** — crear `api.ts` y `store.ts` (no existía store); limpiar `AjustesPage.vue`.
    - [x] **dashboard** — reemplazar el huérfano `stats-api.ts` por `api.ts`; limpiar `DashboardPage.vue`.
    - [x] **search** — mover `SearchResult` a `types.ts` y el HTTP a `api.ts`.
    - [x] Verificar `grep "shared/api/client" --include=*.vue` → vacío.

---

## 🎯 Punto de Control (en curso)

- [ ] **P3-V: Validación funcional del usuario en navegador**
    - [ ] Insumos — crear, editar, borrar; catálogo de proveedores inline (alta y baja); categorías.
    - [ ] Productos — crear, editar, borrar; favorito; BOM; categorías.
    - [ ] Clientes — crear y editar desde el drawer.
    - [ ] Finanzas — alta y edición de movimiento y de orden de imprenta.
    - [ ] Presupuestos — abrir editor, guardar, cambiar estado, PDF, link público.
    - [ ] Ajustes — guardar identidad del negocio y distribución de socios.
    - [ ] Dashboard — KPIs y widgets cargan.

---

## Fase 3: Pendientes heredados

- [ ] **P4: Desacople de `editorMode` (Paso 5 heredado)**
    - [ ] `InsumoDetalle.vue` autocontenido (barra de acciones propia) + validación en navegador.
    - [ ] `ProductoDetalle.vue` autocontenido + validación en navegador.
    - [ ] `PresupuestoEditor.vue` autocontenido (incluye el badge de estado hoy teletransportado) + validación en navegador.
    - [ ] Limpiar `AppHeader.vue` (props `editorMode`/`editorTitle`/`editorDirty` y `#editor-header-status`).
    - [ ] Limpiar `App.vue` y `router.ts`; eliminar `shared/lib/editorMode.ts`.
- [ ] **P5: CSS de overlays y borrado de `components.css` (Paso 7 heredado)**
    - [ ] Migrar el `<style scoped>` de `InsumoDetalle.vue` a Tailwind + validación visual.
    - [ ] Migrar el de `ProductoDetalle.vue` + validación visual.
    - [ ] Migrar el de `PresupuestoEditor.vue` + validación visual.
    - [ ] Purgar las 85 clases muertas de `components.css`.
    - [ ] Migrar los consumidores restantes (`FloatingField`, `DrawerShell`, `LinesSpreadsheet`, `PresupuestoDoc`…).
    - [ ] Borrar `components.css` y su `@import` en `app/styles/main.css`.

---

## Fase 4: Cierre

- [ ] **P6: Documentación y verificación final**
    - [ ] Actualizar `AGENTS.md` con la arquitectura modular resultante.
    - [ ] Decidir con el usuario si se recuperan los tests ausentes (`stock.test.ts`, `ConfirmDialog.test.ts`).
    - [ ] `npx vue-tsc -b`, `npm run build` y `npm run test` en `web/`; `npm run test` en `api/`.
    - [ ] Cerrar el walkthrough con la evidencia final.

> **Testing E2E:** fuera de alcance hasta nuevo aviso. El material de `docs/MVP/testing/` queda como está.
