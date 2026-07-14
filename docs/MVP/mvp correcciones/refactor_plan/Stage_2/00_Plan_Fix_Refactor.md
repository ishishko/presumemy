# Plan de Refactorización, Limpieza de Vistas y Resolución de Contradicciones (V2)

Este plan tiene como objetivo resolver los problemas de visualización en los formularios de creación/edición, recuperar el CRUD de categorías (solucionando la regresión funcional), unificar la moneda a ARS / es-AR, y avanzar hacia la meta de **Tailwind v4 puro** eliminando estilos scoped y reduciendo la dependencia del CSS legacy. 

Asimismo, se aborda la deuda arquitectónica de inversión de dependencias (DIP).

---

## 1. Inversión de Dependencias (DIP) en los Componentes

Para evitar que la descomposición multiplique la violación de dependencias (DIP), la lógica de acceso a datos directa (`shared/api/client` -> `get`/`post`/`put`/`del`) será retirada de la capa de presentación (UI) y trasladada a los stores de Pinia de cada módulo.

> **⚠️ Estado real de los stores (verificar antes de ejecutar):** hoy los stores **no** exponen acciones de creación/edición. `insumos` y `productos` exponen `fetch`, `remove` (ya absorbió el `del()`), `upsert` (solo muta el array en memoria, **no** pega a la API) y el CRUD de categorías; `presupuestos` solo expone `fetch`, `remove`, `upsert`. Los componentes hacen el `post`/`put` directo a `shared/api` y luego llaman `upsert`. Por lo tanto este paso **primero crea** la capa de acciones y **recién después** reemplaza en la UI.

### Modificación del Flujo de Datos
1. **Crear las acciones faltantes en cada store** (async: hacen el `post`/`put` sobre `shared/api/client` y luego `upsert` local):
   * **Insumos**: `createInsumo(payload)`, `updateInsumo(id, payload)` en `modules/insumos/store.ts`. El borrado ya existe como `remove(id)` (reutilizarlo; no se llama `deleteInsumo`).
   * **Productos**: `createProducto(payload)`, `updateProducto(id, payload)` en `modules/productos/store.ts`. Borrado = `remove(id)` existente.
   * **Presupuestos**: `createPresupuesto`/`updatePresupuesto` (y `patch` de estado FSM) en `modules/presupuestos/store.ts`. Borrado = `remove(id)` existente.
2. **Reemplazar en la UI**: `InsumoDetalle` (y sus nuevos hijos), `ProductoDetalle` y `PresupuestoEditor` dejan de importar `shared/api/client` y delegan en las acciones del store recién creadas.

La UI solo conocerá la interfaz expuesta por sus respectivos stores.

---

## 2. Recuperación del CRUD de Categorías (Regresión Funcional)

Recuperaremos la funcionalidad perdida para administrar categorías inline de insumos y productos.

### Acciones
1. **Restaurar componentes desde Git**: Localizar y recuperar del historial los archivos eliminados `CategoriaPills.vue` y `CategoriaDeleteDialog.vue` y moverlos a:
   * `[NEW]` [CategoriaPills.vue](file:///d:/Desarrollando/presumemy/web/src/shared/ui/CategoriaPills.vue)
   * `[NEW]` [CategoriaDeleteDialog.vue](file:///d:/Desarrollando/presumemy/web/src/shared/ui/CategoriaDeleteDialog.vue)
2. **Generalización (C17/DRY)**:
   * Modificar `CategoriaPills` para reemplazar el prop acoplado `variant: 'insumos' | 'productos'` por `allLabel: string` (ej. `"Todas"` o `"Todos"`).
   * Asegurar que el tipado de `Categoria` acepte un campo `count?: number` de forma directa para evitar dependencias cruzadas en `_count`.
3. **Cableado**: Conectar ambos componentes en [InsumosPage.vue](file:///d:/Desarrollando/presumemy/web/src/modules/insumos/InsumosPage.vue) y [ProductosPage.vue](file:///d:/Desarrollando/presumemy/web/src/modules/productos/ProductosPage.vue).

---

## 3. Unificación de Moneda y Locale (ARS vs MXN)

* **`[MODIFY]` [format.ts](file:///d:/Desarrollando/presumemy/web/src/shared/lib/format.ts)**:
  * Ajustar locale a `es-AR` (formato con miles en `.` y decimales en `,`).
  * Definir que el formateador financiero use el sufijo `ARS` (ej: `$ 1.250,00 ARS`).
  * Remover cualquier referencia a `es-MX` o `MXN` del formateador global.
* **Propagación**: Inspeccionar y corregir las cadenas de formato de moneda hardcodeadas localmente en las vistas.

---

## 4. Corrección de Errores de Visualización en Edición/Creación

### A. Posicionamiento en Pantalla Completa y Tailwind Puro (Adiós a components.css)
* **PresupuestoEditor.vue**: Eliminar la redefinición local `.editor-overlay` con `position: absolute` y los estilos scoped. En su lugar, aplicar clases Tailwind puro en la envoltura principal: `fixed top-0 right-0 bottom-0 left-[240px] z-30 bg-page-bg display-grid grid-rows-[auto_1fr_auto] overflow-hidden`.
* **InsumoDetalle.vue & ProductoDetalle.vue**: Eliminar los estilos scoped locales (`.id-overlay` y `.pd-overlay`) y sus múltiples estilos inline de posicionamiento. Migrarlos a la misma estructura Tailwind v4 pura de overlay autocontenido a pantalla completa.

### B. Desacoplamiento de `editorMode` y Resolución de Botones Duplicados
Se eliminará el `editorMode` global del navbar para que el overlay de edición sea autocontenido con su propio header (tal como en el diseño de React).
Esto impacta y requiere modificaciones en 6 archivos:
1. [AppHeader.vue](file:///d:/Desarrollando/presumemy/web/src/app/shell/AppHeader.vue): Remover lógica y controles visuales del `editorMode` (botones de disquete y cruz en la cabecera general).
2. [App.vue](file:///d:/Desarrollando/presumemy/web/src/app/App.vue): Quitar los listeners de eventos `@set-editor-mode` y la propagación de props del editor al header.
3. [router.ts](file:///d:/Desarrollando/presumemy/web/src/app/router.ts): Limpiar referencias si es necesario en las transiciones de estado de edición.
4. [InsumoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/modules/insumos/components/InsumoDetalle.vue): Agregar su encabezado de editor autocontenido (con flecha para volver y título) y remover emits `@update:header`.
5. [ProductoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/modules/productos/components/ProductoDetalle.vue): Igual que insumos.
6. [PresupuestoEditor.vue](file:///d:/Desarrollando/presumemy/web/src/modules/presupuestos/components/PresupuestoEditor.vue): Mover la barra de estado y los controles para que se rendericen dentro de su propio encabezado local en vez de usar un Teleport a la cabecera global.

### C. Estilos de Drawers
* Remover los bloques `<style scoped>` de **layout/estilo redundante** y los estilos inline de [ClienteDrawer.vue](file:///d:/Desarrollando/presumemy/web/src/modules/clientes/components/ClienteDrawer.vue), [MovimientoDrawer.vue](file:///d:/Desarrollando/presumemy/web/src/modules/finanzas/components/MovimientoDrawer.vue) y [ImprentaDrawer.vue](file:///d:/Desarrollando/presumemy/web/src/modules/finanzas/components/ImprentaDrawer.vue).
* **Conservar la transición del drawer** (slide desde la derecha + scrim) como `<style scoped>` mínimo o `@utility`. Es una **excepción explícita** del plan Stage_1 (00_Plan §"Transiciones" y G2.8): las animaciones de `drawer`/`toast`/`confirm` y la "wave" de `FloatingField` no se fuerzan a Tailwind porque pierden claridad. No las elimines al limpiar el resto del scoped.
* Reemplazar las clases duplicadas de layout por la estructura nativa de Tailwind v4 que emule el drawer del design system, o utilizar las variables CSS globales, logrando Tailwind puro sin depender del `components.css` legacy.

---

## 5. Optimización de la Componentización (Nombres Canónicos)

Para descomponer los componentes sobredimensionados (~1500 líneas), separaremos las secciones complejas de los formularios en subcomponentes atómicos utilizando la nomenclatura canónica definida en la arquitectura del proyecto (`00_Arquitectura_Modular.md`).

La reducción de líneas se logrará mediante la eliminación de los estilos scoped y la migración de estilos inline a utilidades de Tailwind v4.

### Subcomponentes a Crear

#### Módulo Insumos
1. **`[NEW]` [ProveedoresEditor.vue](file:///d:/Desarrollando/presumemy/web/src/modules/insumos/components/ProveedoresEditor.vue)** (Canónico):
   * Tabla dinámica de proveedores y lógica de precio principal.
2. **`[NEW]` [InsumoStockForm.vue](file:///d:/Desarrollando/presumemy/web/src/modules/insumos/components/InsumoStockForm.vue)**:
   * Barra de stock, inputs de stock actual, mínimo, y badges de nivel.

#### Módulo Productos
1. **`[NEW]` [BomEditor.vue](file:///d:/Desarrollando/presumemy/web/src/modules/productos/components/BomEditor.vue)** (Canónico):
   * Lista de materiales (receta BOM), autocompletado de insumos y cómputo de costos.
2. **`[NEW]` [ProductoMedidasForm.vue](file:///d:/Desarrollando/presumemy/web/src/modules/productos/components/ProductoMedidasForm.vue)**:
   * Inputs de dimensiones (base, altura, profundidad) y tipo (plano o cuerpo).

#### Módulo Presupuestos
1. **`[NEW]` [LinesSpreadsheet.vue](file:///d:/Desarrollando/presumemy/web/src/modules/presupuestos/components/LinesSpreadsheet.vue)** (Canónico):
   * Grilla interactiva de selección de productos, cantidades y cálculo de importes.
2. **`[NEW]` [EditorTotals.vue](file:///d:/Desarrollando/presumemy/web/src/modules/presupuestos/components/EditorTotals.vue)** (Canónico):
   * Resumen y cálculo de sumatorias (subtotal, envío, recargos y total final).

---

## Plan de Trabajo por Pasos

```mermaid
graph TD
    A[Paso 1: Restaurar CategoriaPills y Dialog de Git] --> B[Paso 2: Unificacion Moneda y Locale ARS]
    B --> C[Paso 3: Desacoplar editorMode de AppHeader, App, Router]
    C --> D[Paso 4: Limpieza de CSS Scoped en Drawers a Tailwind v4]
    D --> E[Paso 5: Ajustes de posicion de overlays a Tailwind v4]
    E --> F[Paso 6: Inversion de Dependencias - trasladar API a Stores]
    F --> G[Paso 7: Extraccion de Subcomponentes en Insumos]
    G --> H[Paso 8: Extraccion de Subcomponentes en Productos]
    H --> I[Paso 9: Extraccion de Subcomponentes en Presupuestos]
    I --> J[Paso 10: Integracion y Pruebas en el Navegador]
```

---

## 6. Alcance y Exclusiones (Stage 3)

Quedan fuera del alcance del presente plan (`Stage 2`) y se posponen para la fase de consolidación arquitectónica final (`Stage 3`):
* El saneamiento completo y estandarización de barrels `index.ts` por módulo.
* La separación completa de `api.ts` y del cliente HTTP en módulos no impactados por esta refactorización.
* La migración de esquemas de validación Zod y tipos compartidos a sus módulos correspondientes.
* La actualización integral del archivo `AGENTS.md` (debido a la regla de preservación de archivos ajenos).
* La eliminación final del archivo temporal `components.css`.

---

## 7. Plan de Verificación (checkpoint por grupo)

La migración de CSS complejo a Tailwind v4 puro es de **alto riesgo de regresión visual**: el `Audit_Report` de Stage_1 ya documentó que esa migración rompió medidas (sidebar de 210px en vez de 240 por el `root: 14px` + escala `rem` de Tailwind, donde `w-60` = 15rem = 210px). Por eso se valida **tras cada paso** que toque estilos o datos (pasos 4, 5, 7, 8, 9), no solo al final.

### Por cada grupo
1. **Typecheck:** `cd web && npx vue-tsc -b` sin errores.
2. **Paridad visual:** `npm run dev` y comparar el archivo migrado contra el prototipo pixel-perfect (`docs/MVP/design-system/project/ui_kits/presumemi/index.html`) — atención a: ancho de sidebar (240px), alto de header (56px), overlays anclados a `left: 240px / top: 0`, transición de drawers, focus rings y hover.

### Verificación funcional final (paso 10, en navegador)
* Los overlays (`InsumoDetalle`, `ProductoDetalle`, `PresupuestoEditor`) abren a pantalla completa respetando el sidebar, sin recuadros cortados ni doble botonera de guardado.
* El CRUD inline de categorías (crear, renombrar, borrar con reasignación) funciona en Insumos y Productos.
* El formato de moneda muestra `$ 1.250,00 ARS` de manera uniforme.
* Los drawers (`ClienteDrawer`, `MovimientoDrawer`, `ImprentaDrawer`) se deslizan desde la derecha con su transición intacta.
* Ninguna vista/componente de los módulos tocados importa `shared/api/client` directo (DIP cerrado en insumos/productos/presupuestos).
