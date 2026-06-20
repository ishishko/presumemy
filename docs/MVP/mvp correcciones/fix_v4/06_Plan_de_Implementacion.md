# Plan de Implementación 06: Epic B — Optimización de Productos (Carga de Imágenes, Layout de 2 Bloques, Switch de Ganancia y Accesibilidad BOM)

Este plan detalla la especificación técnica y de diseño para implementar las mejoras de almacenamiento de imágenes locales en el servidor, visualización de hasta 3 fotos con interacción Drag & Drop para reordenación, rediseño del formulario en 2 columnas (60% de ancho para identidad/fotos y 40% de ancho para finanzas/precios), sustitución del control de ganancia por el flip switch `.checkbox-wrapper-10`, y la aplicación de los estándares de accesibilidad y limpieza interactiva a la tabla de Receta (BOM).

## User Review Required

> [!IMPORTANT]
> **Modelo de Datos - Modificación y Reutilización de Campo:**
> - No se crearán campos adicionales redundantes. Modificaremos y renombraremos la columna existente de base de datos para almacenar la lista de fotos:
>   - En `schema.prisma`, cambiamos `imagenUrl String? @map("imagen_url")` a:
>     `imagenes String[] @default([]) @map("imagenes")`
>   - El primer elemento del array (`imagenes[0]`) será tratado por defecto como la imagen principal del producto.
> - Se creará una migración de base de datos (`npm run db:migrate`) para alterar la columna `imagen_url` de tipo `TEXT` a un array `TEXT[]` y renombrarla a `imagenes`.

> [!IMPORTANT]
> **Seguridad y Acceso Autorizado a Imágenes:**
> - Los archivos subidos no estarán expuestos públicamente. La ruta `/uploads/*` estará protegida mediante autenticación.
> - Crearemos un middleware de autorización para `/uploads/*` en Hono. Dicho middleware verificará que el token JWT sea válido.
> - Para permitir que las etiquetas HTML `<img>` carguen las imágenes de forma nativa en el frontend sin fallar por falta de cabeceras, el middleware permitirá autenticar tanto por cabecera `Authorization: Bearer <token>` como por parámetro de consulta `?token=<token>`.
> - En el frontend, la obtención de URLs de imágenes anexará automáticamente el token del usuario actual: `/api/uploads/filename.png?token=JWT_TOKEN`.

---

## Proposed Changes

### 1. Backend API (api/)

#### [MODIFY] [schema.prisma](file:///d:/Desarrollando/presumemy/api/prisma/schema.prisma)
* **Modelo Producto**:
  * Eliminar `imagenUrl String? @map("imagen_url")`
  * Añadir `imagenes String[] @default([]) @map("imagenes")`

#### [MODIFY] [index.ts](file:///d:/Desarrollando/presumemy/api/src/index.ts)
* **Middleware de Acceso Seguro a /uploads**:
  * Configurar una ruta de servicio de estáticos para `./uploads`.
  * Interceptar y aplicar un filtro de seguridad en `/uploads/*` para verificar el token JWT de Supabase de la sesión activa, tomándolo de la cabecera `Authorization` o del query param `?token=<token>`. Si no hay token válido, retornar HTTP `401 Unauthorized`.
  ```typescript
  import { serveStatic } from '@hono/node-server/serve-static'
  import { verifySupabaseToken } from './middleware/auth.js' // lógica de verificación adaptada
  
  app.use('/uploads/*', async (c, next) => {
    const token = c.req.query('token') || c.req.header('Authorization')?.split(' ')[1]
    if (!token) return c.json({ error: 'No autorizado' }, 401)
    try {
      await verifySupabaseToken(token) // función helper que valide el JWT contra Supabase
      await next()
    } catch {
      return c.json({ error: 'Token inválido' }, 401)
    }
  })
  app.use('/uploads/*', serveStatic({ root: './' }))
  ```
* **Endpoint de Subida Autenticado:**
  * Crear `POST /api/upload` protegido con el middleware de autenticación habitual.
  * Procesar `multipart/form-data`, guardar la imagen en el directorio local `./uploads/` con un UUID para evitar colisiones y retornar la ruta relativa (ej. `/uploads/uuid-file.png`).

#### [MODIFY] [productos.ts](file:///d:/Desarrollando/presumemy/api/src/types/productos.ts)
* **Validación Zod:**
  * Actualizar `productoSchema` en `api/src/types/productos.ts` sustituyendo `imagenUrl` por `imagenes: z.array(z.string()).default([])`.

#### [MODIFY] [productos.ts](file:///d:/Desarrollando/presumemy/api/src/routes/productos.ts)
* **Controlador de Productos:**
  * Actualizar las consultas a base de datos y la creación/edición de productos para persistir y retornar el array de `imagenes`.
  * En cualquier payload retornado, la propiedad `imagenes` expondrá el array completo ordenado.

---

### 2. Frontend SPA (web/)

#### [MODIFY] [index.ts](file:///d:/Desarrollando/presumemy/web/src/types/index.ts)
* **Interfaz Producto:**
  * Reemplazar `imagenUrl?: string` por `imagenes: string[]` en `Producto`.

#### [MODIFY] [productos.ts](file:///d:/Desarrollando/presumemy/web/src/schemas/productos.ts)
* **Esquema Zod:**
  * Reemplazar `imagenUrl` por `imagenes: z.array(z.string()).default([])` en el esquema de frontend.

#### [MODIFY] [ProductosView.vue](file:///d:/Desarrollando/presumemy/web/src/views/ProductosView.vue)
* **Renderizado de Miniaturas en Grid:**
  * En la tarjeta del producto, utilizar la primera imagen del array `imagenes` (si existe) para la visualización del catálogo.
  * Para cargar la imagen de forma autenticada, implementar una propiedad computada o función helper `getImageUrl(path: string)` que construya la URL absoluta apuntando a `/api` y le añada el token JWT almacenado en Pinia/localStorage:
    ```typescript
    function getImageUrl(path: string) {
      if (!path) return ''
      const token = localStorage.getItem('sb-token') // o desde el authStore
      return `${import.meta.env.VITE_API_URL || ''}${path}?token=${token}`
    }
    ```

#### [MODIFY] [ProductoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/ProductoDetalle.vue)

* **Rediseño del Layout (2 Bloques):**
  * Modificar el marcado HTML y estilos para lograr una distribución de 60% / 40% en pantalla completa.
  * **Bloque Izquierdo (60%):**
    - Cabecera: Campo del Nombre grande (`.pd-inline-name`).
    - Cuerpo (Grid de 2 columnas):
      - Columna izquierda: **Módulo de Fotos**.
        - Caja grande para la foto activa principal (`imagenes[0]`), implementando zona de drag & drop para subir una foto local o seleccionarla por click.
        - Fila de **2 miniaturas** debajo (`imagenes[1]` e `imagenes[2]`).
        - Implementación de eventos nativos HTML5 Drag & Drop (`@dragstart`, `@dragover`, `@drop`) que permita arrastrar cualquiera de las 3 imágenes sobre las otras para intercambiar su posición en el array local `imagenes.value`, actualizando el orden instantáneamente.
      - Columna derecha: **Identidad** (Categoría dropdown, Medida, Descripción multilínea, y Switch de Activo).
  * **Bloque Derecho (40%):**
    - Tarjeta de **Precios** unificada que agrupa:
      - Switch de Precio Automático.
      - **Tipo de Ganancia:** Reemplazar el `SegmentedControl` por el flip switch `.checkbox-wrapper-10` con las opciones `Fijo` (on) y `Porcentaje` (off).
      - Entrada de Margen/Ganancia.
      - Campos de Costo base, Precio calculado y Precio final con su banner de advertencia si corresponde.

* **Accesibilidad y Comportamiento de la Tabla Receta (BOM):**
  * Aplicar el comportamiento interactivo de la tabla de proveedores:
    - Agregar `ref="recetaTableRef"` a la tabla de receta.
    - Agregar `@focusout="onRecetaTableFocusout"` para detectar cuándo el foco del usuario ha salido de los campos de la tabla. En ese momento, limpiar y remover filas vacías.
    - Heredar el estilo de planilla `.lines-spreadsheet`, `.cell-input`, `.num-input` y `.del-btn` para enfocar, resaltar filas activas en violeta y celdas individuales en fondo violeta suave.

---

## Verification Plan

### Automated Tests
- Validar tipos en `/web`: `npx vue-tsc -b`.
- Correr tests de API en `/api`: `npm run test`.

### Manual Verification
1. **Acceso Protegido a Archivos:**
   - Intentar abrir una imagen de producto subida en una pestaña de incógnito/anónima del navegador sin parámetros: debe retornar un error `401 Unauthorized`.
   - Verificar que al agregar el token JWT como query param `?token=...`, la imagen se renderice correctamente en la app.
2. **Carga y Reordenamiento Drag & Drop:**
   - Cargar 3 imágenes. Arrastrar la tercera imagen sobre la primera: comprobar que se intercambian y que al guardar el producto, la nueva imagen principal se actualiza tanto en el catálogo como en la base de datos.
3. **Layout de 2 Bloques:**
   - Validar estéticamente la alineación de las 2 columnas y el rediseño del flip switch de Tipo de Ganancia.
4. **Accesibilidad en la Receta:**
   - Verificar la navegación mediante Tab y la limpieza automática de filas vacías.
