# Flujo de Navegación desde Inicio (Dashboard)
Panel de Inicio · MemyDeni

## Contexto general
El panel de inicio (Dashboard) actúa como el centro de mando operativo de MemyDeni. Consolida de forma visual el estado de salud financiera del negocio, los presupuestos pendientes de cobro y los insumos críticos que requieren reposición inmediata en el taller, evitando la sobrecarga de datos.

Para potenciar la eficiencia en la toma de decisiones, el Dashboard implementa un diseño interactivo bidireccional: las listas de **Presupuestos recientes** e **Insumos bajos** sirven como accesos directos (*puentes*). Al hacer clic en un elemento, el sistema redirige al usuario al módulo correspondiente y abre de forma inmediata el panel lateral de edición del registro seleccionado, precargando la información necesaria.

---

## Accesos y navegación
El Dashboard es el panel central de MemyDeni:
* **Acceso inicial:** Es la pantalla de aterrizaje (*landing*) por defecto una vez que el usuario inicia sesión de forma correcta a través del portal de autenticación.
* **Barra lateral (Sidebar):** Ubicado en la parte superior del menú como el botón "Inicio" (icono de casa o tablero de control), permitiendo volver a esta vista en cualquier momento.

---

## Interfaz General y KPIs
La cabecera del Dashboard muestra tres tarjetas totalizadoras que computan las métricas agregadas del mes corriente de forma automática:

![Panel de Inicio](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/dashboard_v3.png)

### Estructura de Tarjetas de Indicadores (KPIs)

| Indicador | Fuente de Datos | Valor Ejemplo | Comportamiento y Reglas en el ERP |
| :--- | :--- | :--- | :--- |
| **Ingresos · este mes** | Transacciones del mes actual | `$ 15,250.00` | Sumatoria de todas las transacciones activas de tipo ingreso del período en curso. |
| **Por cobrar** | Presupuestos activos | `$ 8,400.00` | Total de los presupuestos en estado `enviado` o `en_curso`. Indica debajo la cantidad de cotizaciones pendientes. |
| **Insumos bajos** | Inventario de taller | `3` | Contador de insumos únicos cuyo stock actual está por debajo del stock mínimo configurado. |

---

## Bloque 1 — Presupuestos Recientes (Acceso Directo Comercial)
Presenta una lista de las últimas 5 cotizaciones creadas en el ERP para un seguimiento comercial rápido.

### Estructura de Columnas del Listado

| Columna | Tipo de Dato | Valor Ejemplo | Notas y Reglas Visuales |
| :--- | :--- | :--- | :--- |
| **Folio** | Identificador único | `P-1002` | Código correlativo del presupuesto en el ERP. |
| **Cliente** | Nombre de cliente | Carolina Herrera | Muestra el nombre comercial. Si no está asignado, indica *Sin cliente*. |
| **Temática** | Texto libre | Cumpleaños Toy Story | Detalle del motivo del evento. |
| **Estado** | Badge de estado | `En curso` | Muestra el estado del presupuesto coloreado según la máquina de estados (FSM). |
| **Total** | Monto nominal | `$ 4,500.00` | Valor monetario total del presupuesto. |

### Lógica de Navegación y Carga Condicional

Al hacer clic en cualquier fila de la tabla de Presupuestos recientes, el sistema ejecuta una redirección al listado comercial, inyectando el folio del presupuesto como parámetro en la consulta de la URL (`query`):

```typescript
router.push({ name: 'presupuestos', query: { edit: p.folio } })
```

Esto traslada al usuario a `/presupuestos?edit=P-XXXX`. El módulo comercial procesa la URL y despliega el panel de edición:

![Edición de Presupuesto desde Dashboard](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/dashboard_presupuesto_v3.png)

> [!NOTE]
> **Carga Dinámica de Detalles (Lazy Fetching):**
> Para optimizar el tráfico de red, el listado general del Dashboard no incluye las líneas de presupuesto detalladas. Al abrir la ficha desde la URL, el componente comercial detecta la ausencia de la propiedad `detalles` y solicita bajo demanda al servidor el desglose del presupuesto (`GET /api/presupuestos/:id`) antes de renderizar la mesa de trabajo en el drawer.

---

## Bloque 2 — Insumos Bajos (Acceso Directo de Abastecimiento)
Muestra una lista de insumos que han cruzado su umbral mínimo de seguridad y necesitan reposición urgente.

### Estructura de Elementos de la Ficha

| Elemento UI | Representación | Valor Ejemplo | Reglas de Alerta |
| :--- | :--- | :--- | :--- |
| **Nombre y Código** | Texto descriptivo | Cartulina Glitter / `I-1024` | Nombre del insumo y su identificador correlativo. |
| **Stock Actual / Mínimo** | Valores tabulares | `2 unidades / min 10` | Cantidad actual disponible física frente al stock de seguridad. |
| **Barra de stock** | Indicador gráfico porcentual | `[██░░░░░░░░]` | Muestra el porcentaje cubierto. Si el stock es inferior al 50% del mínimo, la barra se tiñe de rojo (`low`); si está entre el 50% y el 100%, se muestra amarilla (`warn`). |

### Lógica de Navegación y Apertura

Al pulsar sobre la tarjeta de un insumo crítico, se ejecuta una transición hacia el módulo de inventarios inyectando el código del insumo en el query:

```typescript
router.push({ name: 'insumos', query: { edit: i.codigo } })
```

El usuario es redirigido a `/insumos?edit=I-XXXX`. La vista de Insumos detecta el parámetro y abre automáticamente el overlay de edición con los catálogos y proveedores precargados:

![Edición de Insumo desde Dashboard](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/dashboard_insumo_v3.png)

> [!IMPORTANT]
> **Consistencia Relacional y Auditoría:**
> Cualquier cambio guardado en la ficha abierta (sea en presupuestos o insumos) actualiza el registro correspondiente en la base de datos de Supabase PostgreSQL modificando el campo `updatedAt`. Al retornar al Dashboard, el store de Pinia se refresca automáticamente, recalculando los KPIs y removiendo del listado los insumos que hayan salido del estado de stock bajo tras el reabastecimiento.

---

## Verificación Visual y Multimedia

### Video del Recorrido Completo (Walkthrough)
Se ha grabado un video interactivo que reproduce el flujo de navegación del Dashboard:
1. Acceso inicial al Dashboard tras iniciar sesión.
2. Navegación al módulo de Presupuestos mediante clic en una fila del listado reciente, validando la apertura automática del drawer y la carga completa de datos.
3. Retorno al Dashboard.
4. Navegación al módulo de Insumos mediante clic en una fila de la lista de insumos bajos, validando la apertura del overlay de edición y el indicador visual de stock.
5. Retorno final al Dashboard.

🎥 **Ver Video del Recorrido:** [flujo_navegacion_dashboard.mp4](file:///d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/flujo_navegacion_dashboard.mp4)
