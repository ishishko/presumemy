# Flujo de Creación y Receta de Producto
Módulo Productos · MemyDeni

## Contexto general
Un producto representa la unidad final vendible dentro del catálogo de MemyDeni. Su costo base puede ingresarse de forma manual o calcularse dinámicamente mediante una receta de materiales o BOM (*Bill of Materials*). 

El precio de venta final se determina aplicando un margen configurable (por porcentaje o monto fijo) sobre el costo del producto, permitiendo la previsualización en tiempo real y el análisis dinámico de la validación del margen para asegurar la rentabilidad del negocio artesanal.

---

## Accesos y navegación
El usuario gestiona el catálogo desde la sección `/productos`:

1. **Crear producto:** Clic en el botón "Crear nuevo" (icono de suma) en la cabecera superior derecha. Abre el panel lateral derecho (`ProductoDetalle.vue`) en su estado vacío.
2. **Editar producto:** Clic en cualquier tarjeta de producto de la cuadrícula (grid) o en su botón de edición rápido (lápiz) que asoma en hover. Abre el mismo panel con los datos cargados.
3. **Filtros por categoría:** Fila de pastillas (pills) superiores en el listado para filtrar optimistamente los productos por su categoría correspondiente.

---

## El Listado de Productos
El catálogo se presenta en un grid de tarjetas visuales densas que resumen la ficha técnica del producto.

![Listado de Productos](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/productos_list_v3.png)

### Elementos de la Tarjeta de Producto
* **Miniatura (Thumb):** Imagen del producto si posee `imagenUrl`; de lo contrario, muestra un placeholder vectorial neutro.
* **Información Identitaria:** Nombre descriptivo, código autogenerado y nombre de categoría.
* **Indicadores Rápidos:** Número de insumos asociados en su receta BOM (ej. "3 insumos") y el precio de venta oficial en fuente de tamaño grande.
* **Acciones en Hover:** Botones para edición (lápiz) y eliminación lógica (papelera, que abre confirmación).

---

## Formulario de Creación y Edición (Overlay)
Al abrir el formulario, se desliza un panel lateral que organiza la carga de datos en tres columnas de diseño denso a nivel superior (`pd-top`) y una sección inferior expandible para la receta BOM.

![Formulario de Producto](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/formulario_producto_overlay_v3.png)

### Paso 1 — Datos básicos (Identidad y Fotos)
Esta sección define la ficha identitaria y visibilidad del producto:

| Campo | Componente UI | Valor Ejemplo | Notas / Reglas de Validación |
| :--- | :--- | :--- | :--- |
| **URL de imagen** | `FloatingField` | `https://picsum.photos/200` | Enlace a la imagen del producto. Si está vacío, se muestra el icono neutro. |
| **Nombre** | Input inline nativo | Vaso polipapel personalizado | **Requerido.** Título comercial. Debe ser único y descriptivo. |
| **Categoría** | `FloatingSelect` | Repostería | **Requerido.** FK → `CategoriaProducto`. Determina el prefijo del código. |
| **Medida** | `FloatingField` | 250ml · 8cm alto | Medidas físicas o presentación del artículo para referencia de taller. |
| **Descripción** | `FloatingField` multilínea | Vaso de polipapel con impresión full color... | Detalle libre de acabados, materiales o recomendaciones. |
| **Producto activo** | `ToggleSwitch` | `true` (Activo) | Si se desactiva, el producto se oculta en los autocompletados de presupuestos. |
| **Costo por receta** | `ToggleSwitch` | `true` (Receta) | Define si el costo proviene de la receta BOM o se ingresa de forma manual. |

---

### Paso 2 — BOM (Lista de materiales o Receta)
Si el interruptor **"Costo por receta"** (`tieneBom`) está activo:
1. El campo **Costo del producto** se bloquea en modo lectura.
2. El costo se calcula de forma automática aplicando la sumatoria de las líneas:
   $$\text{Costo del producto} = \sum (\text{Cantidad} \times \text{Costo unitario})$$
3. Se despliega la sección inferior de la planilla editable BOM.

#### Estructura de la Tabla de Receta (BOM)

| Columna | Control UI | Valor Ejemplo | Comportamiento y Reglas |
| :--- | :--- | :--- | :--- |
| **Tipo** | Selector nativo | `Insumo` / `Cameo` / `Embalaje` / `Extra` | Clasificación del costo. |
| **Insumo / descripción** | Selector o Texto | Cartulina opalina 220 g | Autocompleta desde el catálogo de insumos. En tipo `Extra` permite escritura libre. |
| **Cantidad** | Input numérico | `2.50` | Proporción o cantidad física requerida. |
| **Costo unitario** | Input numérico | `$ 22.00` | Precio del recurso. Inicializado desde el catálogo. Editable localmente. |
| **Subtotal** | Solo lectura | `$ 55.00` | Multiplicación automática: `Cantidad × Costo unitario`. |

> [!IMPORTANT]
> **Regla de Aislamiento de Costos de Receta:**
> Al seleccionar un recurso de catálogo en el BOM, el **Costo unitario** se inicializa con el valor actual de `insumos.costo_unitario`. 
> * El usuario puede modificar libremente este costo unitario dentro de la tabla.
> * **Esta modificación es atómica y local:** Afecta únicamente a la receta de este producto. No altera el costo unitario del catálogo de insumos general ni afecta a otros productos que utilicen el mismo insumo.

---

### Paso 3 — Ganancia y Cálculo de Margen
La ganancia se calcula dinámicamente aplicando dos fórmulas según la preferencia del usuario en el control segmentado (`SegmentedControl`):

#### A. Porcentaje (%)
El precio calculado incrementa el costo base aplicando el porcentaje de margen definido:
$$\text{Precio calculado} = \text{Costo del producto} \times \left(1 + \frac{\text{Margen (\%)}}{100}\right)$$

*Ejemplo:* Para un costo de $\$ 593.00$ y un margen de ganancia del $80\%$:
$$\text{Precio calculado} = \$ 593.00 \times \left(1 + \frac{80}{100}\right) = \$ 1,067.40$$

#### B. Monto fijo ($)
El precio calculado se compone sumando directamente la ganancia absoluta al costo:
$$\text{Precio calculado} = \text{Costo del producto} + \text{Ganancia fija}$$

*Ejemplo:* Para un costo de $\$ 593.00$ y una ganancia fija de $\$ 500.00$:
$$\text{Precio calculado} = \$ 593.00 + \$ 500.00 = \$ 1,093.00$$

---

### Paso 4 — Aprobación y Validaciones de Precio Final
* **Precio calculado:** Campo numérico de solo lectura generado automáticamente según la fórmula anterior.
* **Precio final:** El valor de venta oficial aprobado manualmente por el usuario. Al escribir en este campo, el sistema recalcula de forma inversa la ganancia para mantener la coherencia.
* **Variantes de validación del precio final:**

| Estado de Validación | Condición de Activación | Nivel visual | Comportamiento en ERP |
| :--- | :--- | :--- | :--- |
| **Sin Precio** (`sin_precio`) | El `precio_final` es nulo, vacío o igual a `0`. | `Advertencia` | Requiere un precio aprobado para ser cotizado. |
| **Bajo Margen** (`error`) | El `precio_final` es menor que el `precio_calculado`. | `Crítico` (Rojo) | Indica que el producto se ofrece con una ganancia inferior a la esperada. |
| **Margen Ok** (`ok`) | El `precio_final` es mayor o igual al `precio_calculado`. | `Normal` (Verde) | Margen comercial saludable y validado. |

---

## Integración y Gobernanza del ERP

> [!NOTE]
> **Inmutabilidad de Costos y Congelamiento:**
> Cuando un producto se añade a un presupuesto, el valor que se registra en `precioUnitario` del detalle es el `precio_final` configurado en ese instante. Si en el futuro los insumos aumentan y la receta del producto incrementa su costo calculado, **los presupuestos emitidos en el pasado no se verán alterados ni recalculados**, protegiendo los acuerdos previos con clientes.

> [!CAUTION]
> **Borrado Lógico y Auditoría:**
> Al pulsar "Eliminar", el sistema ejecuta una llamada que establece `activo = false` en lugar de borrar físicamente el registro. Esto preserva la integridad de los presupuestos antiguos que contienen ese producto, impidiendo que apunten a claves inexistentes, a la vez que oculta el producto del catálogo activo.

---

## Verificación Visual y Multimedia

### Listado con Nuevo Producto Guardado
Una vez completado el flujo de creación y guardados los cambios, el grid se refresca de inmediato mostrando la tarjeta del nuevo producto:

![Listado de Productos con Registro Nuevo](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/productos_list_saved_v3.png)

### Video del Recorrido Completo (Walkthrough)
Se ha grabado un video interactivo que reproduce paso a paso todo el flujo de creación del producto, desde la apertura del panel, la configuración de datos básicos, la activación del costo por receta BOM asociando un insumo de catálogo, la configuración del margen de ganancia, hasta su guardado exitoso y verificación en la cuadrícula:

🎥 **Ver Video del Recorrido:** [flujo_creacion_producto.mp4](file:///d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/flujo_creacion_producto.mp4)
