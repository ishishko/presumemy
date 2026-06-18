# Transcripción Estructurada — Discusión Productos (UX/UI y Lógica de Negocio)

**Fecha de análisis:** 2026-06-14  
**Origen:** Audio `Productos.mp4`

---

## 1. Concepto de Favoritos
* **Requisito:** Agregar la posibilidad de marcar ciertos productos como "Favoritos" mediante un icono de estrella (`★`).
* **Comportamiento:** Los productos marcados como favoritos deben aparecer siempre al inicio de la lista/grid en el Catálogo de Productos para facilitar su acceso rápido, ya que son los artículos que más se comercializan en el negocio.

---

## 2. Grid/Lista de Productos y Filtros
* **Comportamiento de Filtros por Categoría:**
  * Al hacer clic en un tag/pill de categoría en la barra superior, se filtra el catálogo por esa categoría (comportamiento actual).
  * **Mejora solicitada:** Al hacer clic nuevamente en la categoría que ya está activa (seleccionada), se debe **deseleccionar el filtro** y volver a mostrar todos los productos del catálogo de forma inmediata.

---

## 3. KPI del Dashboard: Capacidad de Fabricación (Stock Bajo)
* **Redefinición del Widget:** El widget que antes indicaba un número genérico de "insumos bajos" o similar debe redefinirse.
* **Nueva Lógica:** Mostrar la **"Capacidad de Fabricación"** estimando cuántas unidades de cada producto (BOM) se pueden elaborar en total en base al stock actual de insumos.
* **Ejemplo:** Si el producto es "Cajita Petit" y su receta requiere 10 cm de cinta y 1 hoja de papel, el sistema debe cruzar la receta con el stock físico de cinta y papel y mostrar en el dashboard: *"Se pueden fabricar 8 Cajitas Petit con los insumos disponibles"*.

---

## 4. Definición de Precios: Precio Calculado vs. Precio Final (Manual)
Se discute a fondo la forma en que se definen y muestran los precios en el Catálogo de Productos:
* **Margen de Ganancia Variable:** Los productos deben permitir un margen de ganancia configurable individualmente (no global) porque la naturaleza de los productos varía.
  * **Merchandising:** Productos costosos de comprar pero sencillos de personalizar (ej. funda de iPhone en blanco a $100 pesos) no pueden tener un margen de ganancia del 100% o 200% porque quedarían fuera de precio de mercado. El margen de ganancia debe poder definirse en un porcentaje menor (ej. 10% o 15%).
* **Precio Sugerido/Calculado (Receta + Margen):** Es el precio matemático resultante de: `Costo de Insumos de la Receta + Margen de Ganancia (fijo o porcentual)`.
* **Precio Final (Manual):** Se debe permitir a las usuarias ingresar un **Precio Final a mano** (sobreescribiendo el cálculo automático).
* **Alerta Visual:** Si el "Precio Final" que definieron manualmente queda por debajo del "Precio Sugerido/Calculado", el sistema debe mostrar una advertencia visual destacada (ej. un badge o texto de color de alerta) para notificarles que están perdiendo dinero o margen respecto a los costos de sus insumos.

---

## 5. Receta (BOM) y Estandarización de Unidades
* **Estandarización:** Al armar la receta (BOM) de un producto, las unidades de consumo deben ser las unidades base (por ejemplo, centímetros en vez de "rollo"). Esto es fundamental para que el cálculo del costo unitario y el stock sea preciso.
* **Campos Obligatorios:** En el formulario de producto, la receta/BOM no debe ser obligatoria al crear un artículo simple. El único campo estrictamente obligatorio para dar de alta es el **Nombre** del producto (y su categoría).
* **Edición de Costos en Presupuesto:** Al elaborar un presupuesto, las usuarias deben poder modificar el costo de los insumos congelados para ese presupuesto específico sin que esto afecte al costo maestro en la base de datos de insumos.

---

## 6. Alerta de Precios Desactualizados
* **Lógica:** Si el costo de un insumo sube (se actualiza el precio del proveedor), todos los productos que usen ese insumo en su receta (BOM) verán incrementado su "Precio Calculado/Sugerido".
* **Consecuencia:** Si el "Precio Final" (manual) guardado en la base de datos para esos productos queda por debajo del nuevo "Precio Calculado", el sistema debe marcar esos productos con una alerta de **"Precio desactualizado"**.
* **Filtro útil:** Se propone añadir un filtro o badge en el catálogo para ver rápidamente todos los productos con precios desactualizados para facilitar su corrección en lote.
