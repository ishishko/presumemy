# Walkthrough 05: Epic B — Productos (Favoritos, Sincronización de Precios, Alertas de Margen y BOM Siempre Activo)

Se implementó con éxito la Epic B en el catálogo de productos, introduciendo la capacidad de marcar productos favoritos, una lógica avanzada de precios (sugerido por receta + margen vs. precio final manual), alertas de reajuste cuando el precio queda por debajo del sugerido, e integrando permanentemente la estructura de materiales (BOM) en todos los productos.

## Cambios Realizados

### 1. Modelo de Datos y Base de Datos (api/)
* **Migración:** Se añadió `favorito Boolean @default(false)` y `precioManual Boolean @default(false) @map("precio_manual")` al modelo `Producto` en `schema.prisma`. Se cambió el valor por defecto del campo `tieneBom` a `true` (siempre activo).
* **Base de Datos:** Se generó y aplicó una migración SQL en Supabase PostgreSQL. Se corrigió un bug de claves duplicadas en el script de siembra (`seed.ts`) para garantizar que la base de datos se pueda restablecer y poblar de forma limpia y automática.

### 2. Endpoints de API (api/src/routes/productos.ts)
* **Cálculo en Tiempo de Ejecución (Virtuals):** En los endpoints `GET /` y `GET /:id`, se calculan dinámicamente:
  - `costoBOM`: Sumatoria de las líneas utilizando el costo actual de los insumos en el catálogo.
  - `precioSugerido`: Margen aplicado sobre `costoBOM` (porcentaje o monto fijo).
  - `precio`: Si `precioManual` es `false`, se sobrescribe dinámicamente con el `precioSugerido` actual en tiempo de ejecución.
  - `desactualizado`: Si `precioManual` es `true` y el precio guardado es menor al `precioSugerido`, se marca como `true`.
* **Persistencia Coherente:** En `POST /` y `PUT /:id`, si `precioManual` es `false`, se computa el precio sugerido en el servidor antes de guardar para asegurar la consistencia de los datos en la base de datos.
* **Toggle de Favorito:** Se añadió el endpoint `PATCH /api/productos/:id/favorito` que permite alternar de forma atómica y rápida el estado de destacado de un producto.

### 3. Modificaciones del Frontend (web/)
* **Catálogo e Interactividad (ProductosView.vue):**
  - **Fila de Filtros de Estado:** Se agregó una fila superior de filtros interactivos ("Todos", "Favoritos ★", "Precios desactualizados ⚠️") con contadores automáticos en tiempo real.
  - **Botón Estrella Flotante:** Se integró un botón con forma de estrella (`★` / `☆`) en la esquina de cada tarjeta del catálogo. Al hacer clic (`@click.stop`), se llama a la API de favorito y se actualiza el store localmente sin recargar toda la pantalla.
  - **Badge de Alerta:** Si un producto está marcado como desactualizado (`precio < precioSugerido`), se muestra una etiqueta llamativa `⚠️ Reajustar precio` en su tarjeta.
  - **Ordenamiento Inteligente:** La lista de productos se ordena automáticamente colocando los favoritos primero y de forma secundaria por orden alfabético.
* **Lógica en el Formulario (ProductoDetalle.vue):**
  - **BOM Siempre Activo:** Se eliminó por completo el switch para desactivar el BOM. El panel de la receta y costos está visible en todo momento. Se inicializa con una línea de receta vacía al crear un producto.
  - **Precio Automático vs. Manual:** Se agregó el interruptor "Precio automático (sincronizado con receta)". Si está activo, el campo de "Precio final" se deshabilita y se actualiza reactivamente al cambiar la ganancia o las líneas de receta. Si se desactiva, se permite el ingreso de un precio fijo libre y se valida contra el sugerido.
  - **Banner de Advertencia:** Si el precio final manual está por debajo del sugerido, se despliega un banner de advertencia color naranja/coral.
  - **Unidades de Medida en BOM:** Se renderiza la unidad de medida (ej. `cm`, `pliego`) al lado del input de cantidad en cada fila, y se muestra el costo unitario base formateado (ej. `/ cm`).

---

## Verificación de Calidad

1. **Compilación de Tipos Frontend:**
   Se ejecutó de forma limpia la verificación de tipos en el frontend (`web/`):
   ```bash
   npx vue-tsc -b
   ```
   Finalizado con éxito y 0 errores.

2. **Pruebas Unitarias de Backend:**
   La suite de pruebas en el backend (`api/`) pasó en su totalidad (19 de 19 pruebas exitosas):
   ```bash
   npm run test
   ```

3. **Pruebas de Navegador:**
   Se validó el comportamiento visual del catálogo, el funcionamiento de los filtros de estado por píldoras, la interactividad de la estrella de favoritos con su reordenación animada, el switch de precio automático, el banner de advertencia por debajo del costo + margen, y el formateador de unidades en la tabla BOM.
