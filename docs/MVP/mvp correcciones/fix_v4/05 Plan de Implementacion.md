# Plan de Implementación 05: Epic B — Productos (Favoritos, Sincronización de Precios, Alertas de Margen y BOM Siempre Activo)

Este plan detalla la especificación técnica y de diseño para implementar la Epic B en el catálogo de productos. El objetivo es introducir la capacidad de marcar productos favoritos, implementar una lógica avanzada de precios (sugerido por costo de receta + margen vs. precio final manual), mostrar alertas visuales cuando los precios quedan desactualizados ante variaciones de costo de los insumos, e integrar de forma permanente la estructura de materiales (BOM) en todos los productos.

## User Review Required

> [!IMPORTANT]
> **Modelo de Datos y Migración de Base de Datos:**
> - Añadiremos dos nuevos campos a la tabla `Producto` en el esquema de Prisma:
>   - `favorito`: un booleano para indicar si el producto está marcado como destacado (default `false`).
>   - `precio_manual` (`precioManual` en Prisma): un booleano para indicar si el usuario ingresó un precio manual fijo, bloqueando el cálculo automático (default `false`).
> - Se creará una migración automática (`npm run db:migrate`) y se regenerará el cliente Prisma.

> [!IMPORTANT]
> **Lógica de Recalculo Automático y Precio Desactualizado:**
> - **Sincronización Automática:** Si `precioManual` es `false`, el precio final del producto se calculará en tiempo de ejecución al consultar los productos, utilizando el costo actual de los insumos en el catálogo. Esto asegura que cualquier incremento en el costo de los insumos actualice automáticamente los precios de venta de los productos que no tienen precio fijo.
> - **Alerta de Desactualización:** Si `precioManual` es `true` y el precio manual guardado es inferior al precio sugerido por el costo actual de insumos + margen, el producto se marcará como `desactualizado` (out of date). Esto se expondrá en la API como una propiedad calculada `desactualizado: boolean`.
> - **Filtro de Desactualizados:** Añadiremos un control de filtrado batch en la cabecera del catálogo para ver de un vistazo todos los productos con precios por debajo de su costo teórico.

> [!NOTE]
> **BOM Siempre Activo:**
> - Todos los productos tendrán siempre activada la receta/estructura de materiales (BOM). Eliminaremos la opción de desactivar la receta (el campo `tieneBom` en base de datos será siempre `true` para nuevos registros).
> - La sección de la receta BOM estará visible en todo momento en la interfaz. Si un producto no requiere insumos (por ejemplo, si no se han cargado aún), su costo BOM simplemente se calculará en `$ 0`.

---

## Proposed Changes

### Backend API (api/)

#### [MODIFY] [schema.prisma](file:///d:/Desarrollando/presumemy/api/prisma/schema.prisma)
* **Modelo Producto**:
  * Añadir `favorito Boolean @default(false)`
  * Añadir `precioManual Boolean @default(false) @map("precio_manual")`

#### [MODIFY] [productos.ts](file:///d:/Desarrollando/presumemy/api/src/types/productos.ts)
* **Validación Zod**:
  * Actualizar `productoSchema` para admitir `favorito` (booleano opcional) y `precioManual` (booleano opcional).

#### [MODIFY] [productos.ts](file:///d:/Desarrollando/presumemy/api/src/routes/productos.ts)
* **Cálculo de Costo Real y Precios en GET / y GET /:id**:
  * Para cada producto retornado, si `tieneBom` es `true`, calcular `costoBOM` dinámicamente sumando `l.cantidad * l.insumo.costoUnitario` (para líneas de tipo `insumo`) y `l.cantidad * l.costoUnitario` (para otras líneas sin insumo).
  * Calcular `precioSugerido` aplicando el margen (`ganancia` y `tipoGanancia`) sobre `costoBOM`.
  * Si `precioManual` es `false`, mutar dinámicamente el `precio` retornado para que sea igual a `precioSugerido`.
  * Establecer la propiedad virtual `desactualizado` como `tieneBom && precio < precioSugerido`.
  * Añadir estas propiedades virtuales (`precioSugerido`, `costoBOM`, `desactualizado`) al payload de respuesta JSON de cada producto.
* **Toggles en POST y PUT**:
  * Soportar y guardar los campos `favorito` y `precioManual`.
  * Si `tieneBom` es `true` y `precioManual` es `false`, calcular el precio sugerido en el controlador antes de persistir para guardar un valor consistente en la base de datos.
* **Nuevo endpoint PATCH /:id/favorito**:
  * Permitir alternar el estado de favorito de un producto y retornar el registro actualizado.

---

### Frontend SPA (web/)

#### [MODIFY] [index.ts](file:///d:/Desarrollando/presumemy/web/src/types/index.ts)
* **Interfaz Producto**:
  * Añadir propiedades: `favorito: boolean`, `precioManual: boolean`, y los calculados virtuales `precioSugerido?: number`, `costoBOM?: number`, `desactualizado?: boolean`.

#### [MODIFY] [ProductosView.vue](file:///d:/Desarrollando/presumemy/web/src/views/ProductosView.vue)
* **Filtros Adicionales (Todos, Favoritos, Desactualizados)**:
  * Añadir una fila de filtros adicionales debajo de las categorías con chips/pills para:
    * **Todos** (total de productos).
    * **Favoritos ★** (con estrella dorada y conteo de favoritos).
    * **Precios desactualizados ⚠️** (con color rojo/naranja y conteo de desactualizados).
  * En la propiedad computada `filtered`:
    * Aplicar el filtro de categorías (`catFilter`).
    * Aplicar el filtro de estado seleccionado (Todos, Favoritos, Desactualizados).
    * **Ordenamiento**: Ordenar primero los productos que tengan `favorito === true`, y de forma secundaria por orden alfabético (`nombre`).
* **Interactividad en Cards**:
  * Añadir un botón flotante con estrella (`★` / `☆`) en la esquina de cada producto card. Al hacer click, llamar a una función `toggleFavorite(p)` que invoque a la API (`PATCH /api/productos/:id/favorito`) y actualice localmente el store sin recargar la página entera. Usar `@click.stop` para evitar que se abra la edición.
  * Si `p.desactualizado` es `true`, renderizar un pequeño badge visual llamativo: `⚠️ Reajustar precio` o similar en la card.

#### [MODIFY] [ProductoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/ProductoDetalle.vue)
* **Lógica de Precios en Drawer**:
  * Inicializar el ref `precioManual` (default `false`).
  * En el panel de precios, agregar un checkbox/switch etiquetado como "Precio automático (sincronizado con receta)".
    * Si está activo (`precioManual === false`):
      * Deshabilitar el input del "Precio final".
      * Usar un watcher reactivo para que al cambiar `precioCalculado`, se actualice automáticamente el ref `precio.value`.
    * Si está inactivo (`precioManual === true`):
      * Habilitar el input de "Precio final" para ingreso manual libre.
  * Si `tieneBom` es `true` y `precio.value < precioCalculado.value`, mostrar un banner de advertencia claro de color naranja/coral: `⚠️ El precio de venta final está por debajo del sugerido (costo de receta + margen).`.
* **BOM Siempre Activo**:
  * Remover el interruptor de "Costo por receta" / "Tiene BOM" de la interfaz.
  * Mantener la sección y la tabla de la receta BOM visible de forma permanente.
  * Al crear un nuevo producto, inicializar la receta con una fila de BOM vacía por defecto.
* **Unidades en BOM**:
  * En la tabla de la receta, renderizar al lado del input de cantidad la unidad de medida del insumo seleccionado (ej: `100 cm`, `2 pliego`).
  * En las columnas de costo unitario y subtotal, mostrar la unidad asociada para clarificar las unidades base (ej: `$ 0.22 / cm`).

---

## Verification Plan

### Automated Tests
- Ejecutar compilación de TypeScript en el frontend: `npx vue-tsc -b` en `/web`.
- Ejecutar tests unitarios del backend: `npm run test` en `/api`.

### Manual Verification
1. **Marcar Favoritos desde Catálogo:**
   - Hacer clic en la estrella de un producto normal: debe volverse dorada y el producto debe subir automáticamente al principio de la lista.
   - Quitar la marca: la estrella vuelve a ser gris y el producto se recoloca en su orden alfabético habitual.
2. **Filtrado Dinámico:**
   - Hacer clic en la píldora de "Favoritos" en la cabecera: solo deben listarse los favoritos.
   - Hacer clic en "Precios desactualizados": solo se listan aquellos productos cuyo precio esté por debajo del sugerido.
3. **Toggle de Categoría Pills:**
   - Hacer clic en la categoría seleccionada actualmente: debe desactivar el filtro y mostrar todos los productos.
4. **Precio Sugerido vs. Manual:**
   - En el drawer de un producto con receta, activar "Precio automático": el input del precio final debe bloquearse y tomar el valor exacto del calculado.
   - Modificar la ganancia o margen: el precio final debe actualizarse en tiempo real.
   - Desactivar "Precio automático": el input se desbloquea y permite colocar un precio manual inferior al calculado. Debe aparecer el banner de advertencia visual.
5. **Alerta por Aumento de Costos (Simulación):**
   - Editar un insumo y duplicar su costo unitario.
   - Al volver al catálogo de productos, el producto que consume dicho insumo debe aparecer con el badge de advertencia `⚠️ Reajustar precio`. En el filtro de "Precios desactualizados" debe aparecer listado.
6. **BOM Siempre Activo:**
   - Crear un producto: la receta BOM debe estar visible por defecto y guardarse exitosamente (incluso con líneas vacías que se descartan o una receta de costo $0).
