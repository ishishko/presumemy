# 02 Walkthrough - Epic A: Insumos (fix v4)

Implementación y cierre de gaps del módulo de Insumos y Categorías (Epic A) según las especificaciones del plan detallado y refinamientos de diseño posteriores.

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
  * Creado [CategoriaDeleteDialog.vue](file:///d:/Desarrollando/presumemy/web/src/components/ui/CategoriaDeleteDialog.vue) para gestionar de forma adaptativa la eliminación.
* **Limpieza de Tabla y Semáforo de Stock de 4 Niveles**:
  * Removida la columna "Estado" (encabezados, celdas y metadata asociada) en [InsumosView.vue](file:///d:/Desarrollando/presumemy/web/src/views/InsumosView.vue).
  * Implementada la lógica de 4 niveles de stock (`sin_unidades`, `critico`, `bajo`, `ok`) coloreando de forma consistente en la tabla (barra `.stock-bar`) y en la ficha del detalle (badge `.id-level-badge` y barra de progreso):
    * **OK (Verde):** `stock >= stockMinimo` (color: `var(--green-700)`, bg: `var(--green-50)`).
    * **Bajo (Amarillo):** `stock < stockMinimo` y `stock > stockMinimo * 0.2` (color: `var(--yellow-ink)`, bg: `var(--yellow)`).
    * **Crítico (Naranja):** `stock > 0` y `stock <= stockMinimo * 0.2` (color: `var(--orange-ink)`, bg: `var(--orange-50)`, barra naranja `var(--orange-500)`).
    * **Sin unidades (Rojo):** `stock === 0` (color: `var(--coral-500)`, bg: `var(--coral-50)`, barra vacía con fondo rojo translúcido y borde coral).
  * Modificadas las pills de estado en la parte superior de [InsumosView.vue](file:///d:/Desarrollando/presumemy/web/src/views/InsumosView.vue) para permitir la deselección (si se vuelve a hacer click en una pill activa, regresa a la opción default `'todos'`).
* **Rediseño Completo de Ficha de Insumo (InsumoDetalle.vue)**:
  * Reestructurado [InsumoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/InsumoDetalle.vue) en un layout grid balanceado en **2 columnas**:
    * **Columna Izquierda (Identidad, Costeo y Stock):**
      * **Fila 1:** Nombre del Insumo + Badge del código alineado a la derecha en la base.
      * **Fila 2:** Categoría (Dropdown) + Insumo Activo (ToggleSwitch en un contenedor inline del mismo alto).
      * **Fila 3:** Selector de modalidad de costo mediante un flip switch reducido (**Pack / Simple**).
        * **Pack:** Campos `Costo pack`, `Unidades por pack`, `Unidad de medida` + `Costo unitario calculado` readonly.
        * **Simple:** Campos `Costo unitario` directo y `Unidad de medida`.
      * **Fila 4:** Título "Control de stock" con línea divisoria superior.
      * **Fila 5:** `Stock actual` + `Stock mínimo` + bloque de `Nivel` inline (badge, barra y porcentaje en 3 columnas alineadas).
    * **Columna Derecha (Proveedores y Notas):**
      * **Arriba:** Proveedores (hasta 3 con referencias).
      * **Abajo:** Notas (textarea interno).
  * **Accesibilidad (A11y)**: Añadidos fieldsets y legends, vinculación de etiquetas, trap de foco al tabular e inicialización de foco en Nombre al abrir. Mensajes de error en campos inválidos con aria-invalid.

---

## Verificación de Calidad

### 1. Pruebas Unitarias de Backend
Se corrió la suite de pruebas en el backend, pasando todos los tests (incluyendo los de límite de 12 y reasignación):
```bash
 ✓ src/test/categorias.test.ts (8 tests) 120ms
 Test Files  4 passed (4)
      Tests  16 passed (16)
```

### 2. Comprobación de Tipado del Frontend
La ejecución del compilador de TypeScript en el frontend se completó sin advertencias ni errores:
```bash
npx vue-tsc -b
# Concluido exitosamente con código 0
```
