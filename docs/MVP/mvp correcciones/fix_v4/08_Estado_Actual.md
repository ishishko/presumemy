# 08 Estado Actual — Resumen de Avances y Deuda Técnica (Epic D Completo)

Este documento sintetiza el estado actual del microERP **Presumemi** tras la finalización de los planes de implementación y refinamiento de la fase de correcciones **fix_v4**. Resume los hitos completados y la deuda técnica remanente/decisiones abiertas para futuras iteraciones.

## 1. Hitos Completados (100% Funcionales)

### Tarea 1 — Consolidación de Categorías
* **Gestión Inline:** Implementado el CRUD completo e independiente para Categorías de Insumos y Categorías de Productos en sus respectivas vistas.
* **Seguridad de Relaciones:** El borrado inline valida e impide eliminar una categoría si cuenta con elementos asociados (insumos o productos), forzando al usuario a reasignarlos y evitando huérfanos en la base de datos.

### Epic A — Insumos
* **Diseño e Identificación:** Rediseño del formulario en secciones claras. Se unificó la nomenclatura utilizando *"Costo de la presentación"* y *"Cantidad de unidades por presentación"*.
* **Cálculo de Costo Unitario:** Read-only calculado automáticamente a partir de la presentación (`costo_presentación ÷ cantidad_unidades`).
* **Stock Semántico:** Coloreado de stock con base en el umbral mínimo (rojo para agotado, naranja para stock bajo).
* **Gestión de Proveedores:** Soporte para hasta 3 proveedores en cada insumo, definiendo un **Proveedor Principal obligatorio** que alimenta el costo de referencia en las recetas y BOM.

### Epic B — Productos
* **Favoritos:** Implementación de marcación con estrella `★` y ordenamiento priorizado para colocar favoritos al inicio de las listas.
* **Filtros por Categoría:** Habilitación de toggles en Pills de categorías (hacer clic en la categoría activa la deselecciona y muestra todos los productos).
* **Costeo y Precios:**
  * Implementado cálculo de **precio sugerido** basado en costo total de receta (BOM) + margen (monto fijo o porcentaje por producto).
  * Posibilidad de sobreescribir el cálculo de precio de venta a través de un **precio final manual**.
* **Alertas Visuales:**
  * Alerta "Por debajo de costo" si el precio final manual es menor al sugerido.
  * Alerta de **"Precios desactualizados"** (badge de advertencia en el catálogo con filtro rápido por lote) cuando los costos de insumos aumentan y hacen que el precio sugerido supere el precio final actual.
* **BOM Flexible:** No obligatoriedad de BOM al crear el producto (solo campo Nombre requerido). Al activar "Costo por receta" se inicializa con 1 línea vacía para facilitar la carga.

### Epic C — Dashboard / Home
* **Remoción de Datos Sensibles:** Se quitó el gráfico de ingresos semanales para mantener la privacidad frente a clientes.
* **Presupuestos Recientes:** Filtrados para excluir estados finales (`cancelado` y `facturado`), mostrando únicamente presupuestos activos.
* **Próximos a entregar:** Widget con las 3 entregas más urgentes ordenadas por fecha.
* **Últimos editados:** Listado dinámico de los 3 últimos documentos modificados.
* **Capacidad de Fabricación:** Widget inteligente que calcula la disponibilidad de fabricación de cada producto cruzando el stock disponible de sus insumos y el requerimiento de su BOM.

### Epic D — Backlog Técnico (Resuelto)
* **Corrección de Signo en Finanzas:** Los egresos ahora se guardan en valor absoluto y la API calcula dinámicamente los totales y KPIs en base al tipo de movimiento.
* **Búsqueda global en topbar:** Implementado buscador global debounceado en el topbar que permite buscar simultáneamente entre Clientes, Insumos, Productos y Presupuestos con deep-linking inmediato al drawer/overlay de edición.
* **Paginación Cliente-Side:** Reutilización de un componente de paginación flexible (10, 25 y 50 filas) en listas densas (Presupuestos, Finanzas).
* **Límite de Paginación en Backend:** Modificación del límite máximo en esquemas Zod (`limit: 1000`) para compatibilidad total con la carga y paginado de gran volumen de datos sin rebotar peticiones (HTTP 400).
* **Margen / Tipo de Ganancia:** Implementado el flip switch `.checkbox-wrapper-10` ("Fijo" / "Porcentaje") en ProductoDetalle.
* **Medidas en Productos (JSONB):**
  * Columna de dimensiones estructuradas (`medidas Json?`).
  * Selector semántico `.medidas-toggle-group` con estilo flip switch ("Plano" / "Cuerpo").
  * Entrada y validación de dimensiones en centímetros (Base × Altura × Profundidad).
* **Entrega de Presupuestos:** Reemplazo de `SegmentedControl` por un flip switch `.segmented` ("Retira" / "Envío") centrado horizontalmente en una disposición vertical que conserva la amplitud del campo "Lugar de envío".
* **Sanitización de Domicilio:** Validación estricta con `.strict()` y `.trim()` en Ajustes, mapeando los campos correctamente con la base de datos (`localidad`).
* **KPIs en Finanzas:** Modificada la interacción del store para refrescar en tiempo real los KPIs del dashboard al momento de guardar, editar o eliminar transacciones/órdenes de imprenta.

---

## 2. Deuda Técnica Remanente

Las siguientes tareas del backlog de menor prioridad y decisiones funcionales complejas quedan pendientes para fases posteriores:

| Tarea Pendiente | Clasificación / Prioridad | Estado / Nota |
|---|---|---|
| **Exportar a CSV** | Backlog Técnico - Prioridad Baja | Falta definir endpoints de exportación o lógica cliente de descarga CSV para tablas. |
| **Modo Oscuro Completo** | Backlog Técnico - Prioridad Baja | Actualmente existen únicamente variables de color-scheme y media queries parciales del sistema (`prefers-color-scheme`), requiere interruptor manual en Ajustes y tokens semánticos completos. |
| **Dashboard V2** | Funcionalidad - Prioridad Baja | Configuración de widgets dinámicos personalizables, vista de agenda mensual e informe de top de clientes frecuentes. |
| **Ampliación de Pruebas Frontend** | Pruebas - Prioridad Media | Si bien la cobertura en backend de Vitest es del 100% funcional (19 passed), se requiere expandir pruebas sobre componentes Vue y stores Pinia. |

---

## 3. Decisiones de Negocio Abiertas

* **Flujo de Estados (FSM) de Presupuestos:**
  * **Propuesta pendiente:** Deni propone desacoplar completamente la facturación del flujo del presupuesto, definiendo `cerrado` como el estado final de la FSM, y registrando la factura únicamente en la sección de Finanzas (hoy `facturado` es un estado del presupuesto).
  * **Acción requerida:** Validar con las usuarias finales (Memy y Deni) su flujo contable diario antes de modificar la máquina de estados.
