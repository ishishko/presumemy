# Plan de Implementación 06: Epic B — Optimización de Productos (Carga de Imágenes, Layout de 2 Bloques, Switch de Ganancia y Accesibilidad BOM)

Este plan detalla la especificación técnica y de diseño para implementar las mejoras de almacenamiento de imágenes locales en el servidor, visualización de hasta 3 fotos con interacción Drag & Drop para reordenación, rediseño del formulario en 2 columnas (60% de ancho para identidad/fotos y 40% de ancho para finanzas/precios), sustitución del control de ganancia por el flip switch `.checkbox-wrapper-10`, y la aplicación de los estándares de accesibilidad y limpieza interactiva a la tabla de Receta (BOM).

## User Review Required

> [!IMPORTANT]
> **Almacenamiento de Archivos Locales en el Servidor:**
> - Añadiremos una carpeta física `api/uploads` para almacenar los archivos de imagen subidos.
> - Crearemos un endpoint `POST /api/upload` en la API (usando `multipart/form-data`) para subir imágenes de forma segura desde la app web, retornando la ruta relativa del archivo (ej. `/uploads/filename.png`).
> - Serviremos la carpeta de forma estática en la API utilizando el middleware de archivos estáticos de Hono.

> [!IMPORTANT]
> **Modelo de Datos con Múltiples Imágenes:**
> - Modificaremos el modelo `Producto` en el esquema de Prisma para almacenar un array de strings para las imágenes adicionales:
>   - `imagenes String[] @default([])` en PostgreSQL.
>   - El campo original `imagenUrl` se mantendrá y sincronizará automáticamente en el backend con la primera posición de este array (`imagenes[0] || null`) para mantener compatibilidad con el resto de la app.
> - Se aplicará la migración y se regenerará el cliente Prisma.

---

## Proposed Changes

### 1. Backend API (api/)

#### [MODIFY] [schema.prisma](file:///d:/Desarrollando/presumemy/api/prisma/schema.prisma)
* **Modelo Producto**:
  * Añadir el campo `imagenes String[] @default([])` para almacenar las rutas de hasta 3 fotos ordenadas.
  * Mantener `imagenUrl String? @map("imagen_url")` como referencia a la imagen principal.

#### [MODIFY] [index.ts](file:///d:/Desarrollando/presumemy/api/src/index.ts)
* **Servidor de Archivos Estáticos:**
  * Importar `serveStatic` de `@hono/node-server/serve-static` (o configurar el middleware estático de Hono).
  * Servir la ruta `/uploads/*` mapeada a la carpeta física `./uploads` en el servidor:
    ```typescript
    import { serveStatic } from '@hono/node-server/serve-static'
    app.use('/uploads/*', serveStatic({ root: './' }))
    ```
  * Crear un endpoint de subida general `/api/upload` que procese un campo de formulario `file` y guarde el archivo en el directorio local `./uploads/` con un nombre único autogenerado (ej. usando `crypto.randomUUID()` y la extensión del archivo).

#### [MODIFY] [productos.ts](file:///d:/Desarrollando/presumemy/api/src/types/productos.ts)
* **Validación Zod:**
  * Actualizar `productoSchema` en `api/src/types/productos.ts` para admitir `imagenes` como un array opcional de strings: `imagenes: z.array(z.string()).optional()`.

#### [MODIFY] [productos.ts](file:///d:/Desarrollando/presumemy/api/src/routes/productos.ts)
* **POST y PUT /api/productos:**
  * Soportar and mapear el campo `imagenes`.
  * Si se recibe `imagenes`, guardar el array completo y establecer `imagenUrl` como `imagenes[0] || null` antes de realizar la inserción o actualización en base de datos.
  * Si se consulta el producto en GET, garantizar que la propiedad `imagenes` se retorne en el JSON de respuesta.

---

### 2. Frontend SPA (web/)

#### [MODIFY] [index.ts](file:///d:/Desarrollando/presumemy/web/src/types/index.ts)
* **Interfaz Producto:**
  * Añadir `imagenes?: string[]` a la interfaz `Producto`.

#### [MODIFY] [productos.ts](file:///d:/Desarrollando/presumemy/web/src/schemas/productos.ts)
* **Esquema Zod:**
  * Actualizar `productoSchema` para incluir `imagenes: z.array(z.string()).optional()`.

#### [MODIFY] [ProductoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/ProductoDetalle.vue)

* **Rediseño del Layout (2 Bloques):**
  * Cambiar la estructura en el template para renderizar un grid principal de dos columnas principales:
    - **Bloque Izquierdo (60%):**
      - Cabecera: Campo del Nombre grande (`.pd-inline-name`).
      - Cuerpo (Grid de 2 columnas):
        - Columna izquierda: **Módulo de Fotos**.
          - Caja principal para la foto activa grande con zona de drag and drop para subir y un indicador visual de carga/vacío.
          - Fila inferior de **2 miniaturas** para añadir imágenes secundarias.
          - Interactividad HTML5 Drag & Drop (`@dragstart`, `@dragover`, `@drop`) para reordenar las 3 imágenes arrastrándolas entre sí (intercambiando sus índices en el array local).
        - Columna derecha: **Identidad** (Categoría dropdown, Medida, Descripción multilínea, y Switch de Activo).
    - **Bloque Derecho (40%):**
      - Tarjeta de **Precios** unificada que agrupa:
        - Switch de Precio Automático.
        - **Tipo de Ganancia:** Reemplazar el `SegmentedControl` por el flip switch `.checkbox-wrapper-10` con las opciones `Fijo` (on) y `Porcentaje` (off).
        - Entrada de Margen/Ganancia.
        - Campos de Costo base, Precio calculado y Precio final con su banner de advertencia si corresponde.

* **Subida de Archivos desde la Web:**
  * Reemplazar el input de texto "URL de imagen" por un manejador de subida de archivos real.
  * Al soltar un archivo en la zona de drop o seleccionarlo desde el selector de archivos, realizar una subida HTTP `multipart/form-data` al endpoint `/api/upload`.
  * Guardar la ruta relativa retornada (ej. `/uploads/xxxx.png`) en el array de imágenes local del producto y actualizar la visualización de forma inmediata.

* **Comportamiento y Accesibilidad de la Tabla Receta (BOM):**
  * Declarar e implementar la detección de focusout en la tabla de receta:
    - Añadir `ref="recetaTableRef"` a la tabla.
    - Agregar `@focusout="onRecetaTableFocusout"` en la tabla o su contenedor.
    - La función `onRecetaTableFocusout(event)` verificará si el foco ha salido de la tabla (usando `!recetaTableRef.value.contains(event.relatedTarget)`). En caso afirmativo, ejecutará `cleanupEmptyRecetaLineas()` para purgar líneas en blanco (líneas donde la cantidad es 0 o vacía y no tienen insumo seleccionado ni descripción).
  * Heredar los mismos estilos interactivos de planilla (.lines-spreadsheet) para el foco en celdas de inputs de cantidad, costo unitario y selección, aplicando un resaltado de borde violeta a la fila activa y fondo violeta suave a la celda enfocada.

---

## Verification Plan

### Automated Tests
- Ejecutar validación de TypeScript en `/web`: `npx vue-tsc -b`.
- Correr pruebas del backend en `/api`: `npm run test`.

### Manual Verification
1. **Subida de Imágenes:**
   - Crear o editar un producto y arrastrar una imagen local sobre la caja de fotos. El archivo debe subirse al servidor y mostrarse inmediatamente.
   - Verificar físicamente que el archivo se guarde en `api/uploads/` y que la base de datos guarde la ruta relativa.
2. **Arrastrar y Reordenar Fotos:**
   - Cargar 3 imágenes distintas. Arrastrar una de las miniaturas sobre la principal: los elementos deben intercambiar su posición de forma interactiva y el precio/orden debe persistir correctamente al guardar.
3. **Rediseño Visual (2 Bloques):**
   - Comprobar la visualización del layout 60% / 40% en pantalla completa.
   - El nombre debe aparecer destacado arriba a la izquierda.
   - La sección de precios debe estar contenida por completo en la columna derecha del 40%.
   - El tipo de ganancia debe alternar entre fijo y porcentaje usando el flip switch de estilo `.checkbox-wrapper-10`.
4. **Accesibilidad en la Receta:**
   - Hacer clic en la tabla Receta, agregar una línea y no rellenar ningún campo.
   - Hacer clic fuera de la tabla: la línea vacía debe eliminarse automáticamente.
   - Navegar con la tecla `Tab` por las celdas de la receta y verificar que el borde de la fila activa se resalta en violeta y la celda actual adquiere un fondo violeta suave.
