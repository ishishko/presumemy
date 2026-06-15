# Transcripción Estructurada — Discusión Insumos (UX/UI y Lógica de Negocio)

**Fecha de análisis:** 2026-06-14  
**Origen:** Audio `Insumos.mp4`

---

## 1. Estructura del Dashboard / Pantalla de Inicio (Home)
* **Datos Sensibles:** No se debe mostrar información financiera sensible (ingresos, caja, egresos) directamente en la pantalla de inicio para evitar que sea visible al abrir la aplicación frente a terceros. Se decide **quitar el gráfico de ingresos semanales** del Home.
* **Presupuestos Recientes:** Les parece útil mantener la lista de presupuestos recientes en el Home, pero **excluyendo los estados finales (facturados y cancelados)**. Solo deben mostrarse presupuestos activos en los que se pueda trabajar.
* **Próximos Pedidos a Entregar:** Añadir una sección prioritaria en el inicio ordenada por fecha de entrega: *"Andá a laburar en aquellos que tenés que entregar"*. Debe mostrar:
  * Los primeros 3 pedidos que faltan entregar.
  * Los últimos 3 documentos/pedidos en los que se ha trabajado recientemente (historial de edición rápida).

---

## 2. Pantalla de Insumos — Vista Principal (Tabla)
* **Visualización del Stock (Semáforo de nivel):**
  * La columna "Estado" (que muestra etiquetas escritas como "Bajo", "Crítico", etc.) se considera redundante y hace ruido visual si ya existe la barra de stock y el nivel.
  * **Decisión:** Eliminar la columna "Estado". Es suficiente con colorear el nivel de stock de forma semántica:
    * **Naranja:** Para stock bajo (alerta/crítico).
    * **Rojo:** Para stock vacío (sin stock).
  * **Alineación de Columnas:** Las columnas numéricas como "Stock" y "Mínimo" en la tabla de insumos deben alinearse a la derecha o centrarse correctamente (actualmente se ven feas alineadas a la izquierda).

---

## 3. Comportamiento del Detalle / Edición de Insumos
* **UX de Apertura:** Actualmente, al hacer clic en un insumo de la tabla, se abre directamente en modo edición. Se debate si esto es correcto:
  * El programador prefiere mantener la edición inmediata al entrar para ahorrar clics.
  * La usuaria prefiere que se abra una vista de **Detalle / Ficha del Insumo** en modo lectura, y que tenga un botón claro para "Editar" si se requiere modificar algo. Esto evita cambios accidentales y permite ver la información de forma limpia.
  * **Decisión para el MVP:** Evaluar un término medio o permitir una visualización de ficha con botón de activar edición.

---

## 4. Gestión de Categorías de Insumos
* **Creación On-demand:** En el formulario de alta de insumo, el botón de agregar categoría rápido (`+`) se considera innecesario en el día a día porque las categorías de insumos son muy estables y no se crean frecuentemente.
* **Ubicación:** Se decide mover la creación y edición de categorías de insumos directamente a la sección de **Ajustes** del sistema para mantener limpio el formulario de insumos.

---

## 5. Formulario de Alta / Edición de Insumo (Reordenamiento)
Se define una separación conceptual clara del formulario, ordenando los campos en las siguientes secciones para mejorar el flujo de lectura:

1. **Sección: Identificación del Insumo**
   * Nombre
   * Categoría
   * Unidad de medida (ej. centímetros, centímetros cúbicos, hojas, etc.)
2. **Sección: Compra y Costo (Presentación)**
   * Costo del paquete / presentación (monto pagado).
   * Cantidad por paquete / presentación (ej. 500 cm).
   * *Costo Unitario:* Campo calculado de solo lectura que divide el costo entre la cantidad de la presentación.
3. **Sección: Control de Stock**
   * Stock actual.
   * Stock mínimo.
4. **Sección: Proveedores**
   * Permite asociar múltiples proveedores con su respectivo precio.
   * Debe marcarse obligatoriamente un **Proveedor Principal** (cuyo precio se usará para calcular el costo de referencia en las recetas del catálogo).

---

## 6. Lógica de Costo de Presentación
* **Aclaración de conceptos:** En lugar de términos genéricos como "paquete", usar etiquetas claras como **"Costo de la Presentación"** y **"Cantidad de unidades por presentación"**.
* **Ejemplo:** Si compran un rollo de cinta de 500 cm por $100 pesos, la presentación es el "rollo", la unidad es "cm", la cantidad es "500" y el costo es "$100". El sistema calcula que el costo unitario por cm es de $0.20 pesos. Este costo unitario es el que se consume en la receta (BOM) del producto.
