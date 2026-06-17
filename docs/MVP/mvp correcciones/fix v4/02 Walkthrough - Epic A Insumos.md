# 02 Walkthrough - Epic A: Insumos (fix v4)

Implementación y cierre de gaps del módulo de Insumos y Categorías (Epic A) según las especificaciones del plan detallado.

## Cambios Realizados

### 1. Backend API (api/)

* **Tope de Categorías**:
  * Modificados [routes/insumos.ts](file:///d:/Desarrollando/presumemy/api/src/routes/insumos.ts) y [routes/productos.ts](file:///d:/Desarrollando/presumemy/api/src/routes/productos.ts) para validar que no existan más de 12 categorías activas antes de crear una nueva en `POST /categorias`. En caso de superar el límite, se retorna un error `409 Conflict`.
* **Baja Lógica con Reasignación**:
  * Definido el esquema `categoriaDeleteSchema` en [types/insumos.ts](file:///d:/Desarrollando/presumemy/api/src/types/insumos.ts) y [types/productos.ts](file:///d:/Desarrollando/presumemy/api/src/types/productos.ts) para validar opcionalmente la categoría de destino en el cuerpo del DELETE.
  * Modificado `DELETE /categorias/:id` en ambos módulos de rutas. Si la categoría tiene asociados activos, requiere el parámetro `reasignarA`. En una transacción Prisma, se actualizan todos los elementos asociados a la nueva categoría y se da de baja lógica (`activo: false`) a la categoría borrada.
* **Pruebas Unitarias**:
  * Actualizado [test/categorias.test.ts](file:///d:/Desarrollando/presumemy/api/src/test/categorias.test.ts) y [test/setup.ts](file:///d:/Desarrollando/presumemy/api/src/test/setup.ts) para mockear transacciones Prisma de forma genérica y validar el límite de 12, el bloqueo sin destino y el borrado exitoso con reasignación.

### 2. Frontend SPA (web/)

* **Nuevos Tokens de Color**:
  * Agregados los tokens `--orange-50` (naranja claro), `--orange-500` (naranja estándar) y `--orange-ink` (naranja contrastado para texto) en [tokens.css](file:///d:/Desarrollando/presumemy/web/src/assets/css/tokens.css).
* **Servicio API**:
  * Añadida la función `delWithBody` en [services/api.ts](file:///d:/Desarrollando/presumemy/web/src/services/api.ts) para enviar peticiones de eliminación de tipo DELETE con cuerpo JSON.
* **Pinia Stores**:
  * Actualizada la firma de `removeCategoria` en [stores/insumos.ts](file:///d:/Desarrollando/presumemy/web/src/stores/insumos.ts) y [stores/productos.ts](file:///d:/Desarrollando/presumemy/web/src/stores/productos.ts) para enviar el parámetro `reasignarA` si es provisto.
* **Componente de Pills**:
  * Modificado [CategoriaPills.vue](file:///d:/Desarrollando/presumemy/web/src/components/ui/CategoriaPills.vue) para deshabilitar el botón `+` cuando existen 12 o más categorías activas.
* **Nuevo Diálogo de Borrado**:
  * Creado [CategoriaDeleteDialog.vue](file:///d:/Desarrollando/presumemy/web/src/components/ui/CategoriaDeleteDialog.vue) para gestionar de forma adaptativa la eliminación:
    * Si no hay asociados, confirmación simple.
    * Si hay asociados y existen otras categorías, despliega un select para elegir destino.
    * Si hay asociados pero es la única categoría, bloquea el borrado indicando que se debe crear otra primero.
  * Integrado en [InsumosView.vue](file:///d:/Desarrollando/presumemy/web/src/views/InsumosView.vue) y [ProductosView.vue](file:///d:/Desarrollando/presumemy/web/src/views/ProductosView.vue).
* **Limpieza de Tabla y Semáforo de Stock**:
  * Removida la columna "Estado" (encabezados, celdas y metadata asociada) en [InsumosView.vue](file:///d:/Desarrollando/presumemy/web/src/views/InsumosView.vue).
  * Implementado el helper `barTone` y actualizada la barra de stock en la tabla de insumos para pintar de rojo (`--coral-500`) cuando el stock es 0, y de naranja (`--orange-500`) cuando el stock es inferior al mínimo.
* **Rediseño Completo de Ficha de Insumo**:
  * Reestructurado [InsumoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/InsumoDetalle.vue) en un layout grid balanceado en **3 secciones** principales más una de notas:
    1. **Inicio** (Izquierda): Nombre (usando FloatingField adaptado), Categoría, Unidad, Costo de presentación, Cantidad de unidades por presentación, Costo unitario calculado unificado (sola fila texto-readonly) y Toggle Activo.
    2. **Control de stock** (Derecha, arriba): Stock actual, Stock mínimo y Nivel con semáforo de color adaptado (rojo/naranja/verde).
    3. **Proveedores** (Derecha, abajo): Tabla compacta.
    4. **Notas** (Fondo): Fila de ancho completo.
  * Reemplazada toda la terminología de "paquete/pack" por "presentación".
  * **Accesibilidad (A11y)**: Añadidos fieldsets y legends, vinculación de etiquetas, trap de foco al tabular e inicialización de foco en Nombre al abrir. Mensajes de error en campos inválidos con aria-invalid.

---

## Verificación de Calidad

### 1. Pruebas Unitarias de Backend
Se corrió la suite de pruebas en el backend, pasando todos los tests (incluyendo los nuevos de límite de 12 y reasignación):
```bash
 ✓ src/test/categorias.test.ts (8 tests) 159ms
 Test Files  4 passed (4)
      Tests  16 passed (16)
```

### 2. Comprobación de Tipado del Frontend
La ejecución del compilador de TypeScript en el frontend se completó sin advertencias ni errores:
```bash
npx vue-tsc -b
# Concluido exitosamente con código 0
```
