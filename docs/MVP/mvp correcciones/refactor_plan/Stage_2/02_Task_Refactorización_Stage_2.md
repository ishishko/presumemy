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

## 🎯 Punto de Control

- [ ] **P3-V: Validación funcional del usuario en navegador**
    - [x] Insumos — validado. Salieron 6 bugs, corregidos en la ronda de hotfix (abajo).
    - [x] Productos — validado. Salieron 3 bugs + pedidos de cambio, resueltos en la ronda de hotfix.
    - [ ] Clientes — crear y editar desde el drawer.
    - [ ] Finanzas — alta y edición de movimiento y de orden de imprenta.
    - [ ] Presupuestos — abrir editor, guardar, cambiar estado, PDF, link público.
    - [ ] Ajustes — guardar identidad del negocio y distribución de socios.
    - [ ] Dashboard — KPIs y widgets cargan.

---

## Fase 2-bis: Hotfix de la validación (no estaba en el plan original)

Bugs que aparecieron al validar P3 en el navegador. Ninguno lo introdujo el DIP:
son defectos preexistentes que la validación destapó.

- [x] **H1: Insumos** *(commit `b46b951`)*
    - [x] El radio "principal" de la tabla de proveedores no era clickeable: `.id-radio` vivía en el `<style scoped>` del padre y el scoped no alcanza a los hijos. Autocontenido con Tailwind.
    - [x] Salir del módulo con cambios sin guardar no avisaba: `onBeforeRouteLeave` en el overlay. La X del header pasa a confirmar igual que `Esc`.
    - [x] Nivel de stock `sin_control` para stock y mínimo en 0 ("Sin control", en vez de reportarlo como faltante). Cubierto por `stock.spec.ts`.
    - [x] Clickear en el aside el módulo actual no cerraba el overlay: señal `resetViewTrigger` del shell a la página.
    - [x] `DataTable` sin hover ni separadores de fila (aplica a los 4 listados).
- [x] **H2: Productos y BOM** *(commit `f77f318`)*
    - [x] Columna "Calculado" por línea de receta: `normal` / `fijo` / `extra`. Migración `add_modo_calculo_to_bom` **aplicada a Supabase** (columna con default `normal`, no destructiva).
    - [x] El campo Insumo/descripción pasa de `select` a input con `datalist` (autocompletado, igual que el editor de presupuestos).
    - [x] Aviso de precio por debajo del sugerido: compara a la precisión que se muestra, así un redondeo de centavos no lo dispara.
    - [x] Paleta de nivel de stock unificada entre lista y edición; campos de stock aceptan quedar vacíos.
- [x] **H3: Botón Guardar siempre activo — corregido de raíz**
    - [x] Causa: las comparaciones campo por campo contra el registro de la API se rompen por diferencias de forma. La concreta en productos era el orden de claves de `medidas` (la BD guarda `{base,tipo,altura,unidad,profundidad}`, el formulario rearmaba `{tipo,base,altura,profundidad,unidad}` y `JSON.stringify` respeta el orden).
    - [x] Nuevo `shared/lib/useFormSnapshot`: fotografía el formulario al cargarlo y lo compara contra sí mismo. Al snapshot entra solo lo que edita el usuario; quedan afuera los derivados (precio automático, costo que baja del insumo).
    - [x] Aplicado igual en insumos y productos. En alta, Guardar arranca deshabilitado y se habilita con el primer dato.
    - [x] Cubierto por `useFormSnapshot.spec.ts` (5 tests, uno reproduce el caso del orden de claves).
- [x] **H4: Ajustes finales de la ronda**
    - [x] Celdas de Cantidad y Costo unitario del BOM: el sufijo dejó de ser un `<span>` absoluto sobre el input con padding hardcodeado; ahora es un hermano flex que no se superpone. Cantidad muestra la inicial de la unidad; Costo unitario, la unidad completa.
    - [x] Productos no tenía conectado el diálogo "¿Salir sin guardar?" (existía en el template y nada lo abría) ni el listener de `Esc`. Igualado a insumos: aside, X, `Esc` y guarda de ruta.

---

## Fase 3: Pendientes heredados

- [x] **P4: Desacople de `editorMode` (Paso 5 heredado)**
    - [x] Nuevo `shared/lib/editorSlot.ts`: un punto de montaje (`EDITOR_SLOT_ID`) y un único booleano derivado (`hayEditorAbierto`). **Desvío del plan:** en vez de que el overlay dibuje su barra dentro de sí mismo, la *teletransporta* al header. Se cumple el objetivo —el editor es dueño de sus controles y muere el singleton— sin mover de lugar los botones, que era un cambio visual que el plan §3.2 prohíbe.
    - [x] `InsumoDetalle.vue` autocontenido (título, Guardar, Cerrar propios).
    - [x] `ProductoDetalle.vue` autocontenido.
    - [x] `PresupuestoEditor.vue` autocontenido, con su badge de estado en el mismo bloque (antes iba por un teleport aparte a `#editor-header-status`).
    - [x] `AppHeader.vue` sin props de editor ni botones de guardado: solo expone el punto de montaje y oculta "Crear nuevo" mientras hay un editor abierto.
    - [x] `App.vue` sin callbacks ni props de editor; `router.ts` sin `resetEditorMode`; las 3 páginas sin el emit `set-editor-mode`.
    - [x] `shared/lib/editorMode.ts` **eliminado**. `grep` de `editorMode`, `editorDirty`, `set-editor-mode` y `editor-header-status` en `src/` → vacío.
    - [x] De paso, presupuestos se iguala a los otros dos: guarda de ruta al salir con cambios y cierre del editor desde el aside.
    - [ ] Validación en navegador por el usuario (los 3 editores: abrir en alta y edición, ensuciar, guardar, cerrar con cambios, `Esc`, navegar entre rutas).
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
    - [x] Actualizar `AGENTS.md` con la arquitectura modular resultante. Describía el `package-by-layer` previo al refactor (`views/`, `components/drawers/`, `stores/`, `services/`…), directorios que ya no existen. Se documentan además el modo de cálculo del BOM y el nivel de stock sin control.
    - [x] ~~Decidir si se recuperan los tests ausentes (`stock.test.ts`, `ConfirmDialog.test.ts`)~~ — **descartado por decisión del usuario (2026-07-25)**. Queda registrado que el `Audit_Report` de Stage 1 declara 26 tests en 3 archivos y el repo tiene uno solo, por si en algún momento se retoma.
    - [ ] `npx vue-tsc -b`, `npm run build` y `npm run test` en `web/`; `npm run test` en `api/`.
    - [ ] Cerrar el walkthrough con la evidencia final.

> **Testing E2E:** fuera de alcance hasta nuevo aviso. El material de `docs/MVP/testing/` queda como está.
