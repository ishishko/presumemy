# Plan de Implementación 07: Epic C — Redefinición del Dashboard / Home (arquitectura híbrida store/server) + Fix de reapertura del FSM de Presupuestos

Este plan detalla el rediseño del Dashboard adoptando una arquitectura híbrida para optimizar la carga de datos y evitar consultas redundantes de insumos y capacidad, derivando estos cálculos en el cliente a partir de los stores de Pinia. Además, implementa la configuración del formato de fecha (absoluto vs relativo) y corrige la desincronización del FSM de presupuestos para permitir reabrir un presupuesto cerrado con confirmación explícita.

## User Review Required

> [!IMPORTANT]
> **Configuración del formato de fecha del dashboard (`formatoFechaDashboard`):**
> - Se agrega el campo `formatoFechaDashboard` a la tabla `ConfiguracionNegocio` (`prisma.schema`) de tipo `String` con valor por defecto `"relativo"`.
> - Las opciones disponibles son:
>   1. **Relativo** (Default): Muestra el tiempo restante de forma relativa (ej. "Entrega hoy", "Atrasado hace 2 días", "En 3 días").
>   2. **Absoluto**: Muestra la fecha formateada en formato local (ej. "24 Jun 2026").
>   * En ambos casos, si está atrasada, se resalta en coral (`--coral-500`) y con la etiqueta/badge "atrasado".

> [!IMPORTANT]
> **Reapertura de Presupuestos (cerrado -> en_curso):**
> - Se habilitará la transición en el frontend (`PresupuestoEditor.vue`) agregando `en_curso` a las transiciones permitidas desde `cerrado`.
> - Al seleccionar esta transición, se mostrará un modal de confirmación explícito antes de aplicar el cambio para advertir a la usuaria que el presupuesto volverá a ser editable y se limpiará la fecha de finalización.

---

## Proposed Changes

### 1. Backend API (api/)

#### [MODIFY] [schema.prisma](file:///d:/Desarrollando/presumemy/api/prisma/schema.prisma)
* **Modelo `ConfiguracionNegocio`**:
  * Agregar `formatoFechaDashboard String @default("relativo") @map("formato_fecha_dashboard")`

#### [MODIFY] [seed.ts](file:///d:/Desarrollando/presumemy/api/prisma/seed.ts)
* **Configuración inicial**:
  * Añadir `formatoFechaDashboard: 'relativo'` al seed de `ConfiguracionNegocio`.

#### [MODIFY] [ajustes.ts](file:///d:/Desarrollando/presumemy/api/src/routes/ajustes.ts)
* **Validación Zod y PUT**:
  * Modificar `configSchema` para validar la propiedad `formatoFechaDashboard: z.enum(['relativo', 'absoluto']).optional()`.
  * En `PUT /api/configuracion/:id`, pasar `formatoFechaDashboard` a la base de datos.

#### [MODIFY] [dashboard.ts](file:///d:/Desarrollando/presumemy/api/src/routes/dashboard.ts)
* **Endpoint `GET /api/dashboard/stats`**:
  * Eliminar por completo la consulta de `insumosBajos` (`prisma.insumo.findMany`).
  * En `presupuestosRecientes`, filtrar por `estado: { notIn: ['facturado', 'cancelado'] }` y ordenar por `updatedAt: 'desc'`. Mantener `take: 5`.
  * Agregar consulta `proximosEntregar` que busque presupuestos activos, no facturados ni cancelados, con fecha de entrega no nula, ordenados por `fechaEntrega: 'asc'` (`take: 3`). Incluir el nombre del cliente.
  * Remover `insumosBajosCount` and `insumosBajos` de la respuesta JSON.
  * Añadir `proximosEntregar` a la respuesta JSON.

---

### 2. Frontend SPA (web/)

#### [MODIFY] [index.ts](file:///d:/Desarrollando/presumemy/web/src/types/index.ts)
* **Interfaz `ConfiguracionNegocio`**:
  * Agregar `formatoFechaDashboard: 'relativo' | 'absoluto'`.
* **Interfaz `DashboardStats`**:
  * Modificar `kpis` eliminando `insumosBajosCount`.
  * Eliminar `insumosBajos`.
  * Agregar `proximosEntregar: Presupuesto[]`.

#### [MODIFY] [AjustesView.vue](file:///d:/Desarrollando/presumemy/web/src/views/AjustesView.vue)
* **Sección Inicio**:
  * Agregar campo selector `FloatingSelect` para elegir "Fecha en dashboard" (`formatoFechaDashboard`).
  * Actualizar la función `saveConfig` para enviar `formatoFechaDashboard` en el cuerpo del PUT.

#### [MODIFY] [DashboardView.vue](file:///d:/Desarrollando/presumemy/web/src/views/DashboardView.vue)
* **Layout e Interfaz**:
  * Remover por completo el gráfico de ingresos semanales y todos sus métodos auxiliares (`chartData`, `chartMax`, `moneyShort`).
  * En `onMounted`, precargar concurrentemente `productosStore` e `insumosStore` si aún no han sido descargados, junto con los stats del dashboard.
  * Reemplazar la tercera tarjeta KPI ("Insumos bajos") por "Insumos a reponer", calculada en base a `insumosStore.data` (`stock < stockMinimo`).
  * Implementar el computed property `capacidadFabricacion` calculando la capacidad máxima de cada producto a partir de su BOM y el stock actual de insumos, agrupando consumo de insumos repetidos, ordenando favoritos primero, luego menor capacidad, tomando los 10 primeros.
  * Rediseñar la distribución del cuerpo a dos columnas:
    * **Izquierda (1 columna)**: Presupuestos recientes sin estados finales (`facturado`, `cancelado`), ordenados por última actualización.
    * **Derecha (columna con dos paneles)**:
      * **Panel Superior**: "Próximos a entregar" iterando los presupuestos de `proximosEntregar`. Implementar el formateo condicional de fecha (Relativo/Absoluto) y la alerta en coral (`--coral-500`) si está atrasado.
      * **Panel Inferior**: "Capacidad de fabricación" iterando `capacidadFabricacion`. Mostrar alertas de capacidad crítica: coral para `capacidad === 0` y amarillo para `1` a `5`.
  * Los clics en las filas navegarán al editor del presupuesto/producto correspondiente.

#### [MODIFY] [PresupuestoEditor.vue](file:///d:/Desarrollando/presumemy/web/src/components/editors/PresupuestoEditor.vue)
* **Sincronización del FSM**:
  * Actualizar `TRANSITIONS` para incluir `cerrado: ['facturado', 'en_curso']`.
  * Interceptar la acción de cambiar de `cerrado` a `en_curso` mostrando un diálogo de confirmación. Al confirmar, realizar el cambio y guardar el presupuesto para limpiar la fecha de finalización en el backend.

---

## Verification Plan

### Automated Tests
- Ejecutar verificación de tipos en el frontend: `npx vue-tsc -b` (dentro de `web/`).
- Ejecutar verificación de tipos en el backend: `npx tsc --noEmit` (dentro de `api/`).
- Correr tests de API en el backend: `npm run test` (dentro de `api/`).

### Manual Verification
1. **Migración e inicialización**: Correr `npm run db:migrate` y validar que la base de datos incluye la columna y que el seed inicializa correctamente.
2. **Dashboard sin gráfico**: Comprobar la remoción visual del gráfico de ingresos semanales.
3. **KPI Insumos a reponer**: Modificar el stock de un insumo para que baje de su mínimo en la sección Insumos y verificar que el contador en el Dashboard se actualice al volver.
4. **Layout y reactividad de capacidad**: Verificar el panel de Capacidad de fabricación. Bajar el stock de un insumo limitante a 0 y constatar que el producto baja a capacidad 0 con alerta coral.
5. **Formato de fecha de entrega**: Cambiar la configuración de formato de fecha en Ajustes y verificar cómo impacta la renderización en el panel "Próximos a entregar".
6. **Reapertura de presupuesto**: Validar la confirmación y reapertura correcta de un presupuesto cerrado, reactivando los inputs en la app.
