# Plan de Verificación de Flujos de Creación en Presumemi

Realizaremos un análisis y navegación detallada de todos los flujos de creación del microERP. Para trabajar de manera segura y no interferir con tu base de pruebas local, utilizaremos el worktree `testing-ports` y configuraremos la aplicación en puertos alternativos. 

Conectaremos el backend y frontend con la base de datos de pruebas real y utilizaremos un usuario de prueba provisto por ti para iniciar sesión (evitando hacer reset o seed de Prisma para no alterar los datos existentes).

## User Review Required

> [!IMPORTANT]
> **Credenciales de Prueba:**
> Para realizar la navegación real por la base de datos y flujos de creación, solicitamos que nos proveas las credenciales (Email y Contraseña) del usuario de prueba de Supabase.

> [!NOTE]
> **Auditoría de Accesibilidad y Usabilidad Visual:**
> Durante la navegación, analizaremos meticulosamente:
> - El contraste de colores y la legibilidad del texto al completar los formularios.
> - Posibles desbordamientos de texto, elementos cortados o comportamientos extraños de responsividad.
> - La navegación por teclado (focus, tabulación) y la semántica de accesibilidad.

## Proposed Changes

Exclusivamente dentro del worktree `testing-ports` (`d:/Desarrollando/presumemy-worktree/`):

### Configuración e Infraestructura

#### [MODIFY] [tokens.css (Frontend)](file:///d:/Desarrollando/presumemy-worktree/web/src/assets/css/tokens.css)
- Remover la directiva `@import url("https://fonts.googleapis.com/css2?family=Onest...")` de la línea 6 para evitar la advertencia de orden de importación en PostCSS.

#### [MODIFY] [main.css (Frontend)](file:///d:/Desarrollando/presumemy-worktree/web/src/assets/css/main.css)
- Mover la directiva `@import url("https://fonts.googleapis.com/css2?family=Onest...")` al inicio de `main.css`, antes de `@import "tailwindcss"`.

---

## Plan de Navegación y Verificación

Utilizaremos el navegador controlado mediante `chrome-devtools-mcp` para simular un usuario real en `http://localhost:5174` y auditar los siguientes flujos:

### 0. Inicio de Sesión
- Navegar a `/login`.
- Ingresar las credenciales de prueba.
- Verificar redirección correcta a `/dashboard`.
- Auditar contraste, etiquetas de los campos de entrada y visibilidad de los placeholders.

### 1. Flujo de Insumos
- Navegar a `/insumos`.
- Abrir el panel de creación ("Crear nuevo").
- Completar campos (Nombre, Categoría, Unidad, Stocks) y observar el llenado:
  - ¿Se mantiene visible el texto de manera óptima durante la escritura?
  - ¿Hay desalineaciones o saltos de línea extraños?
- Verificar el cálculo automático de Costo Unitario en la sección de compra.
- Asignar proveedores y validar que el selector principal sea único.
- Guardar y verificar la inserción reactiva en la tabla.
- Realizar doble clic para abrir edición rápida. Modificar un campo y cerrar para verificar la advertencia de cambios sin guardar (`dirty`).
- Validar navegación por teclado en el listado y el overlay.

### 2. Flujo de Productos
- Navegar a `/productos`.
- Abrir panel de creación.
- Probar el switch "Costo por receta" (BOM):
  - Llenar líneas del BOM (tipo Insumo, Extra, Cameo).
  - Modificar el costo unitario de un insumo dentro de la receta y verificar el aislamiento del costo (que no afecte al catálogo de insumos general).
- Probar las dos modalidades de ganancia (Porcentaje y Monto fijo) y verificar la reactividad del precio calculado.
- Probar estados de validación del precio final:
  - Sin precio (o nulo) -> Advertencia.
  - Bajo Margen -> Crítico/Error.
  - Margen OK -> Normal.
- Validar legibilidad de los textos y consistencia visual en la tarjeta de producto tras su creación.

### 3. Flujo de Clientes
- Navegar a `/clientes`.
- Abrir panel de creación.
- Ingresar datos básicos y medios de contacto (Instagram, WhatsApp).
- Verificar que al marcar un canal como principal se desmarque el otro.
- Validar que al cargar los canales no haya problemas de visualización o solapamiento en el panel.

### 4. Flujo de Presupuestos
- Navegar a `/presupuestos`.
- Abrir panel de creación.
- Seleccionar el cliente recién creado: comprobar el autocompletado y si sugiere correctamente el canal de contacto principal.
- Ingresar temática, fechas e ítems (asociar el producto creado).
- Verificar el congelamiento del precio del producto al insertarse en el detalle.
- Validar que se permita discrepancia matemática en Condiciones de Pago (Seña + Resto != Total) para descuentos y redondeos discrecionales.
- Guardar en estado `borrador`.
- Cambiar a `facturado` y verificar si el backend genera y distribuye la transacción contable (Meme 40%, Pety 30%, Gastos 30%).

### 5. Flujo de Ajustes
- Navegar a `/ajustes`.
- Verificar el indicador de cambios sin guardar y habilitación condicional del campo de "Días de espera".
- Probar la validación de la suma al 100% de la distribución y su bloqueo correspondiente si difiere de ese valor.

## Reporte Final
- En cada etapa tomaremos capturas de pantalla de la interfaz (guardadas en `C:\Users\Shimbo\.gemini\antigravity\scratch\screenshots`).
- Inspeccionaremos la consola del navegador y las respuestas de red.
- Generaremos un reporte estructurado y visual (`walkthrough.md`) detallando errores visuales, de lógica y de accesibilidad/usabilidad encontrados.
