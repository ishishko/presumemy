# Flujo de Creación y Edición de Insumo
Módulo Productos · MemyDeni

## Contexto general
Un insumo representa una materia prima en el taller que se adquiere en paquetes o packs comerciales y se fracciona o consume por unidades individuales. El flujo de creación y edición captura la información de identidad del insumo, gestiona el control de inventario y establece la lógica de costeo que alimenta de manera directa la receta o Estructura de Materiales (BOM) de los productos del catálogo.

Para evitar la pérdida accidental de datos, el sistema implementa un control de modificaciones reactivo (*dirty tracking*) que bloquea el cierre del formulario o la navegación de salida si existen cambios pendientes sin guardar.

---

## Accesos y navegación
El usuario puede interactuar con el flujo de insumos en la vista `/insumos`:

1. **Crear insumo:** Botón "Nuevo insumo" en la cabecera superior derecha. Abre el panel de overlay de pantalla completa (`InsumoDetalle.vue`) con campos vacíos.
2. **Editar por Doble Click:** Al hacer doble click sobre cualquier fila del listado de insumos, se desliza el overlay con los datos correspondientes. La fila aplica un cursor de tipo `pointer` y deshabilita la selección de texto (`user-select: none`) para una experiencia fluida.
3. **Editar por Acción:** Botón con el ícono de lápiz en el extremo derecho de cada fila de la tabla. Abre el mismo panel de edición.

---

## El Listado de Insumos
El listado centraliza todos los insumos disponibles. Muestra el código secuencial, nombre del insumo, stock actual contra el mínimo mediante barras visuales de colores, costo unitario y acciones rápidas.

![Listado de Insumos](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/insumos_list_v3.png)

### Estructura de la Tabla de Datos

| Columna | Alineación | Formato / Valor de Ejemplo | Descripción y Reglas Visuales |
| :--- | :--- | :--- | :--- |
| **CÓDIGO** | Izquierda | `I-1001` | Código identificador secuencial con nomenclatura `I-10XX` asignado por el sistema. |
| **INSUMO** | Izquierda | Cartulina opalina 220 g | Nombre descriptivo completo e indicación de categoría asignada. |
| **STOCK** | Izquierda | `18 pliego` <br> *barra verde/roja* | Barra de progreso visual que representa la disponibilidad física. Se colorea según el nivel de stock en relación al mínimo. |
| **COSTO UNITARIO** | Derecha (num) | `$ 22.00` | Costo unitario calculado en base al último paquete de compra. Usa fuente tabular (`font-variant-numeric: tabular-nums`). |
| **ACCIONES** | Derecha | *(Pencil / Trash)* | Botones compactos transparentes con hovers semánticos para edición rápida y eliminación. |

---

## Formulario de Creación y Edición (InsumoDetalle Overlay)
Al activarse el flujo, se desliza un panel fullscreen que organiza la carga de datos de forma clara y accesible.

![Formulario de Insumo](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/formulario_insumo_drawer.png)

### Paso 1 — Identidad y Control de Stock
Esta sección gestiona la identidad del material y los parámetros de inventario. El nombre del insumo se presenta como un título inline interactivo en la cabecera del panel.

| Campo | Componente / Tipo | Requerido | Valor Ejemplo | Notas / Reglas de Validación |
| :--- | :--- | :--- | :--- | :--- |
| **Nombre** | Input de título inline | **Sí** | Cartulina Opalina Oro | Nombre del material (marca, gramaje y medidas). |
| **Categoría** | `FloatingSelect` | **Sí** | Papel | Vínculo relacional con las categorías del sistema. Si no se selecciona, la validación se marca en rojo. |
| **Unidad de medida** | `FloatingField` (Texto) | **Sí** | pliego | Define cómo se consumirá en la BOM (ej: pliego, m, rollo, u). |
| **Stock actual** | `FloatingField` (Número) | No | 25 | Cantidad física en taller. Al costado del input se renderiza una píldora con la unidad de medida. |
| **Stock mínimo** | `FloatingField` (Número) | No | 10 | Umbral mínimo para la generación de alertas. Cuenta con la píldora de unidad de medida. |
| **Insumo activo** | `ToggleSwitch` | No | `true` | Interruptor accesible (`role="switch"`, `aria-checked`). Si se desactiva, el insumo se oculta de autocompletados. |

---

### Paso 2 — Compra, Costos e Indicadores Visuales

Se definen los parámetros de adquisición comercial para calcular el costo unitario de la materia prima.

| Campo | Componente / Tipo | Requerido | Valor Ejemplo | Notas / Reglas de Validación |
| :--- | :--- | :--- | :--- | :--- |
| **Costo del paquete** | `FloatingField` (Número) | No | `$ 220.00` | Valor monetario total del pack. Cuenta con prefijo `$` y validación de valores no negativos. |
| **Cantidad por pack** | `FloatingField` (Número) | No | 10 | Cantidad de unidades dentro del paquete. Cuenta con píldora de unidad de medida. |
| **Costo unitario** | Input de sólo lectura | No | `$ 22.00` | Autocalculado y no editable: `costoPaquete / cantidadPack`. |
| **Costo de referencia**| Etiqueta informativa | No | `$ 22.00 / pliego` | Representación canónica del costo fraccionado por unidad de medida. |

> [!NOTE]
> **Fórmula del Costo Unitario:**
> $$\text{Costo unitario} = \frac{\text{Costo del paquete}}{\text{Cantidad por pack}}$$
> *Ejemplo:* $\$ 220.00 \div 10\text{ pliegos} = \$ 22.00\text{ por pliego.}$
> Este valor es el que consume la Estructura de Materiales (BOM) en el catálogo de productos para determinar el subtotal de insumos por receta:
> $$\text{Subtotal de insumo} = \text{Cantidad consumida} \times \text{Costo unitario del insumo}$$

---

### Paso 3 — Asignación de Proveedores
Se despliega una grilla interna que permite vincular **hasta 3 proveedores** con sus respectivos precios de lista de mercado.

* **Proveedor:** Selector directo (`<select>`) de los proveedores registrados en la base de datos.
* **Precio de referencia:** Input numérico para registrar el costo cobrado por ese proveedor en particular.
* **Proveedor Principal:** Botón de selección circular (Radio). Solo uno puede marcarse como principal (`esPrincipal: true`). Al seleccionar uno, el anterior se desactiva automáticamente.
* **Eliminar proveedor:** Botón de cruz (`X`) con hover coral. Se deshabilita si queda solo un registro en la tabla de proveedores para garantizar consistencia mínima.
* **Agregar proveedor:** Botóndashed con ícono `Plus` para añadir una fila (se deshabilita al alcanzar el límite estricto de 3 proveedores).

---

### Paso 4 — Notas y Barra de Acciones del Pie
* **Notas:** Caja de texto libre (`textarea`) para especificaciones del equipo de compras o producción (variaciones de tiempos de entrega, observaciones de calidad).
* **Acciones del Pie:**
  * **Volver a insumos (Cerrar):** Regresa al listado. Si existen modificaciones sin guardar, solicita confirmación mediante un diálogo accesible (`ConfirmDialog`).
  * **Eliminar:** Botón en tono coral. Solo visible en modo edición. Solicita confirmación y ejecuta un soft delete (`activo = false`) en la base de datos.
  * **Crear insumo / Guardar cambios:** Botón primario (`btn-primary`) con ícono `Check`. Se mantiene deshabilitado (`disabled` y opacidad reducida al 50%) si no hay cambios en el formulario (`!dirty`), habilitándose automáticamente en cuanto se edita un campo.

---

## Reglas de Validación y Alertas de Inventario

> [!IMPORTANT]
> **Niveles y Alertas de Stock:**
> El sistema calcula de forma reactiva el nivel de inventario actual en base al stock mínimo:
> * **Crítico:** Si el stock actual es menor al 50% del mínimo configurado (o si el mínimo no está configurado y el stock es 0). Se muestra en color coral (`#EA5F3C`) con fondo pastel y la barra de progreso reducida.
> * **Bajo:** Si el stock actual es mayor o igual al 50% del mínimo pero menor al mínimo total. Se muestra en color amarillo/ocre (`#8A6A00`) con fondo pastel.
> * **OK:** Si el stock actual es igual o mayor al mínimo configurado. Se muestra en color verde/esmeralda (`#1F5A3E`) con fondo pastel y la barra de progreso llena.

> [!CAUTION]
> **Confirmación de Cambios Pendientes:**
> Si el usuario intenta salir del overlay teniendo cambios sin guardar, se despliega una advertencia en pantalla que previene la pérdida de la información:
> ![Confirmación de salida](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/5_insumos_confirm_exit.png)

---

## Resultado e Integración (BOM)
Una vez creado y guardado con éxito el insumo, el sistema le asigna su código secuencial identificativo único (ej. `I-1021`) y se añade reactivamente en la tabla general de inventario.

![Listado de Insumos Guardado](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/insumos_list_saved_v3.png)

A partir de este momento, queda disponible en el sistema para que cualquier producto del catálogo que lo requiera en su receta o Estructura de Materiales (BOM) calcule su costo unitario proporcional en base a la cantidad fraccionada consumida.

